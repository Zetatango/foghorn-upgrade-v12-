# frozen_string_literal: true

class OnBoardingController < ApplicationController
  layout 'application'

  before_action :authenticate_user!
  before_action :validate_token

  #
  # Authorization: will automatically call Ability.authorize!(:new, :on_boarding)
  #
  def new
    # Set invoice id to the passed in parameter if this feature is enabled
    @invoice_id = Rails.application.secrets.invoice_handling_enabled == true ? new_onboarding_params[:invoice_id] : nil
    @flow = new_onboarding_params[:flow] || current_user.default_route
  end

  #
  # Authorization: will automatically call Ability.authorize!(:query_merchant, :on_boarding)
  #
  def query_merchant
    params = business_query_params
    business_info = {
      name: params[:name],
      address_line_1: params[:address_line_1],
      city: params[:city],
      state_province: params[:state_province],
      postal_code: params[:postal_code],
      country: params[:country],
      address_line_2: params[:address_line_2],
      phone_number: params[:phone_number]
    }

    business_info.each do |key, value|
      business_info[key] = value.strip if value.is_a?(String) && !value.blank?
    end

    @merchant_query = ztt_client.merchants_api.submit_merchant_query(business_info.to_json)
    render json: { status: 'SUCCESS', message: 'Merchant query result', data: @merchant_query }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  #
  # Authorization: will automatically call Ability.authorize!(:select_merchant, :on_boarding)
  #
  def select_merchant
    @selected_merchant = ztt_client.merchants_api.select_merchant_query_result(select_merchant_params[:query_id], format_select_merchant_params)

    render json: { status: 'SUCCESS', message: 'Merchant query result', data: @selected_merchant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  #
  # Authorization: will automatically call Ability.authorize!(:submit_applicant, :on_boarding)
  #
  # rubocop:disable Metrics/CyclomaticComplexity
  def submit_applicant
    params = submit_applicant_params
    applicant_info_required = {
      merchant_guid: current_user.merchant_on_selected_profile,
      first_name: params[:first_name],
      last_name: params[:last_name],
      date_of_birth: params[:date_of_birth],

      address_line1: params[:address_line_1],
      city: params[:city],
      province: params[:province],
      country: params[:country]
    }
    applicant_info_optional = {
      middle_initial: params[:middle_initial],
      suffix: params[:suffix],

      annual_income: params[:annual_income],
      sin: params[:sin],
      phone_number: params[:phone_number],
      email: current_user.email,
      owner_since: params[:owner_since],
      ownership_percentage: params[:ownership_percentage],

      postal_code: params[:postal_code]
    }

    applicant_info_required.each do |key, value|
      applicant_info_required[key] = value.strip if value.is_a?(String) && !value.blank?
    end

    applicant_info_optional.each do |key, value|
      applicant_info_optional[key] = value.strip if value.is_a?(String) && !value.blank?
    end

    applicant_info_all = applicant_info_required.merge!(applicant_info_optional)

    @applicant = ztt_client.applicants_api.create_applicant(applicant_info_all)

    render json: { status: 'SUCCESS', message: 'Applicant submit result', data: @applicant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end
  # rubocop:enable Metrics/CyclomaticComplexity

  def auto_login
    store_in_session(auto_login_params)
    redirect_to '/auth/user'
  end

  protected

  def store_in_session(params)
    session[:merchant_guid] = params[:merchant_guid] if params[:merchant_guid]
    session[:applicant_guid] = params[:applicant_guid] if params[:applicant_guid]
    session[:profile_guid] = current_user.selected_profile if current_user.selected_profile
  end

  def new_onboarding_params
    params.permit(:invoice_id, :flow)
  end

  def auto_login_params
    params.permit(:merchant_guid, :applicant_guid)
  end

  def business_query_params
    params.permit(:name, :address_line_1, :address_line_2, :city, :state_province, :postal_code, :country, :phone_number)
  end

  def select_merchant_params
    params.permit(:business_id, :query_id, :avg_monthly_sales, :date_at_address, :industry, :business_num, :incorporated_in,
                  :doing_business_as, :lead_guid, :owner_since, :self_attested_date_established, :self_attested_average_monthly_sales)
  end

  def submit_applicant_params
    params.permit(:merchant_guid, :first_name, :last_name, :middle_initial, :suffix, :date_of_birth, :address_line_1, :city, :province,
                  :country, :sin, :annual_income, :email, :address_line_2, :postal_code, :phone_number, :owner_since, :ownership_percentage)
  end

  def format_select_merchant_params
    params = select_merchant_params
    query_result_id = {
      id: params[:business_id],
      avg_monthly_sales: params[:avg_monthly_sales],
      date_at_address: params[:date_at_address],
      industry: params[:industry],
      business_num: params[:business_num],
      doing_business_as: params[:doing_business_as],
      incorporated_in: params[:incorporated_in],
      self_attested_date_established: params[:self_attested_date_established],
      self_attested_average_monthly_sales: params[:self_attested_average_monthly_sales],
      lead_guid: params[:lead_guid],
      owner_since: params[:owner_since]
    }
    query_result_id.compact.to_json
  end
end
