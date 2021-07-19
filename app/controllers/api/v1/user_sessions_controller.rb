# frozen_string_literal: true

require 'ztt_client'

class Api::V1::UserSessionsController < ApplicationController
  include ScimUserHelper

  #
  # Authorization: will automatically call Ability.authorize!(:current_user_data, :generate_user_data)
  #
  def current_user_data
    user_data = generate_user_data
    render json: user_data[:body], status: user_data[:status]
  end

  def update_insights_preference
    scim_user = idp_client.get_user(current_partner, current_user.uid)
    scim_user[scim_urn_ario_extension.to_sym][:insightsPreference] = {
      optIn: update_insights_preference_params[:opt_in],
      lastModified: Time.now.utc.iso8601
    }
    idp_client.update_user(current_partner, scim_user)

    current_user.insights_preference = update_insights_preference_params[:opt_in]

    render json: {}, status: :ok
  rescue IdPService::IdPServiceException => e
    Rails.logger.error("Failed to update SCIM user data for #{current_user.uid}: #{e.message}")
    render json: {}, status: :internal_server_error
  end

  private

  # rubocop:disable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity, Metrics/AbcSize
  def generate_user_data
    begin
      lead = applicant? ? nil : load_lead
      merchant = load_merchant
      # NOTE: this will only work if merchant.owners&.first.present?
      # We may want to check that here instead of firing errors later.
      business_partner_application = Rails.application.secrets.business_partner_enabled ? load_business_partner_application(merchant) : nil
    rescue SwaggerClient::ApiError => e
      response = parse_api_error(e)
      Rails.logger.error("An error with code #{response[:code]} occurred while retrieving the user session metadata: #{response[:message]}")
      return { body: response, status: response[:status] }
    end

    begin
      scim_user = idp_client.get_user(current_partner, current_user.uid)

      current_user.insights_preference = if scim_user[scim_urn_ario_extension.to_sym][:insightsPreference].nil?
                                           nil
                                         else
                                           scim_user[scim_urn_ario_extension.to_sym][:insightsPreference][:optIn]
                                         end
    rescue IdPService::IdPServiceException => e
      Rails.logger.error("Failed to get SCIM user data for #{current_user.uid}: #{e.message}")
      return { body: {}, status: 500 }
    end

    {
      body: {
        status: 'Success',
        message: 'Loaded User Data',
        data: {
          id: current_user.uid,
          name: current_user.name,
          email: current_user.email,
          referrer_path: session[:return_to],
          profiles: current_user.filtered_profile_info(current_partner),
          selected_profile: selected_profile,
          partner: current_partner,
          merchant: merchant,
          lead: lead,
          business_partner_application: business_partner_application,
          preferred_language: current_user&.preferred_language,
          applicant_guid: current_user&.applicant,
          insights_preference: current_user&.insights_preference,
          product_preference: current_user&.product_preference
        }
      },
      status: :ok
    }
  end
  # rubocop:enable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity, Metrics/AbcSize

  def selected_profile
    return current_user.profile_info.first if current_user.profile_info.count == 1

    current_user.profile_info.each do |profile|
      return profile if profile[:uid] == current_user.selected_profile
    end
  end

  def load_lead
    # 404 is tolerable for the lead information. It shouldn't be blocking the user_data to be returned
    expected_lead_errors = [404]

    begin
      leads = ztt_client.leads_api.get_leads
    rescue SwaggerClient::ApiError => e
      response = parse_api_error(e)
      Rails.logger.error("An error with code #{response[:code]} occurred while retrieving the user session metadata: #{response[:message]}")
      raise e unless expected_lead_errors.include?(response[:status])
    end

    selected_lead = leads&.leads&.first
    selected_lead = format_lead(selected_lead) if selected_lead
    selected_lead
  end

  def load_merchant
    # 404 is expected to occur on 'About Business' step of onboarding from get_merchant
    expected_merchant_errors = [404]

    begin
      merchant = ztt_client.merchants_api.get_merchant('m_unused')
    rescue SwaggerClient::ApiError => e
      response = parse_api_error(e)
      Rails.logger.error("An error with code #{response[:code]} occurred while retrieving the user session metadata: #{response[:message]}")
      raise e unless expected_merchant_errors.include?(response[:status])
    end

    merchant
  end

  def load_business_partner_application(merchant)
    # 404 is expected to occur anytime we try to load the business partner application to see if there is one
    # 422 is expected to occur on 'About You (Business Owner)' step of onboarding from get_business_partner_contract
    expected_bp_application_errors = [404, 422]

    begin
      business_partner_application = ztt_client.merchants_api.get_business_partner_contract(merchant.id, show_terms: false) unless merchant&.id.blank?
    rescue SwaggerClient::ApiError => e
      response = parse_api_error(e)
      Rails.logger.error("An error with code #{response[:code]} occurred while retrieving the user session metadata: #{response[:message]}")
      raise e unless expected_bp_application_errors.include?(response[:status])
    end

    business_partner_application
  end

  def format_lead(lead)
    lead.attributes = JSON.parse(lead.attributes, symbolize_names: true)
    lead = lead.to_hash

    check_lead_expiration(lead)
  end

  def check_lead_expiration(lead)
    return lead if lead[:created_at] >= 2.weeks.ago

    lead.slice(:id, :merchant_selected_insights_bank_accounts, :merchant_desired_bank_account_balance)
  end

  def applicant?
    selected_profile.to_h.dig(:properties, :applicant)
  end

  def update_insights_preference_params
    params.permit(:opt_in)
  end
end
