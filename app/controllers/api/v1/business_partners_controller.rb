# frozen_string_literal: true

class Api::V1::BusinessPartnersController < ApplicationController
  before_action :validate_token, :validate_merchant_guid
  before_action :validate_invite_params, only: :invite
  before_action :validate_listing_parameters, only: %i[business_partner_merchants received_business_partner_invoices sent_business_partner_invoices]

  # POST /api/v1/business_partners
  def create
    ztt_client.merchants_api.post_business_partner_application(
      create_business_partner_params[:merchant_guid],
      ip_address: request.remote_ip
    )
    render json: { status: 'SUCCESS', message: 'Business partner successfully created' }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to become a business partner: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/business_partners/{id}
  def show
    return render json: { status: 'Error', message: 'Show terms is required' }, status: :bad_request unless show_business_partner_params[:show_terms].present?

    response = ztt_client.merchants_api.get_business_partner_contract(
      show_business_partner_params[:id],
      show_terms: show_business_partner_params[:show_terms]
    )

    render json: { status: 'SUCCESS', message: 'Retrieved business partner successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting a business partner's application: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # POST /api/v1/business_partners/{id}/invite
  def invite
    response = ztt_client.merchants_api.post_business_partner_merchant(invite_params[:id],
                                                                       invite_params[:email],
                                                                       invite_params[:name],
                                                                       invite_params[:send_invite])

    render json: { status: 'SUCCESS', message: 'Business partner merchant invite sent successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while inviting a business partner's merchant to the platform: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/business_partners/{id}/business_partner_merchant
  def business_partner_merchants
    params = business_partner_list_params.slice(:offset, :limit, :order_by, :order_direction, :filter)
    response = ztt_client.merchants_api.get_business_partner_merchants(business_partner_merchants_params[:id], params)

    render json: { status: 'SUCCESS', message: 'Business partner merchants listed successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while listing business partner merchants: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/business_partners/{id}/received_business_partner_invoices
  def received_business_partner_invoices
    params = business_partner_list_params.slice(:offset, :limit, :order_by, :order_direction, :filter)
    response = ztt_client.merchants_api.get_received_business_partner_invoices(business_partner_list_params[:id], params)

    render json: { status: 'SUCCESS', message: 'Received business partner invoices listed successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while listing received business partner invoices: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/business_partners/{id}/sent_business_partner_invoices
  def sent_business_partner_invoices
    params = business_partner_list_params.slice(:offset, :limit, :order_by, :order_direction, :filter)
    response = ztt_client.merchants_api.get_sent_business_partner_invoices(business_partner_list_params[:id], params)

    render json: { status: 'SUCCESS', message: 'Sent business partner invoices listed successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while listing sent business partner invoices: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/business_partners/{id}/business_partner_profile
  def business_partner_profile
    response = ztt_client.merchants_api.get_business_partner_profile(business_partner_profile_params[:id])

    render json: { status: 'SUCCESS', message: 'Business partner profile retrieved successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while retrieving business partner profile: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # PUT /api/v1/business_partners/{id}/business_partner_profile
  def update_business_partner_profile
    params = build_update_profile_params
    response = ztt_client.merchants_api.put_business_partner_profile(update_business_partner_profile_params[:id], params)

    render json: { status: 'SUCCESS', message: 'Business partner profile updated successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while updating business partner profile: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def validate_merchant_guid
    merchant_guid = params[:merchant_guid] || params[:id]

    return render json: { status: 'Error', message: 'Merchant guid is required' }, status: :bad_request if merchant_guid.blank?

    render json: { status: 'Error', message: 'Merchant guid is invalid' }, status: :bad_request unless merchant_guid_valid?(merchant_guid)
  end

  def merchant_guid_valid?(merchant_guid)
    /^m_\w{16}$/.match?(merchant_guid)
  end

  def validate_listing_parameters
    offset = listing_params[:offset]
    limit = listing_params[:limit]

    return render json: { status: 'Error', message: 'Offset is required' }, status: :bad_request if offset.blank?
    return render json: { status: 'Error', message: 'Limit is required' }, status: :bad_request if limit.blank?
  end

  def validate_invite_params
    name = invite_params[:name]
    email = invite_params[:email]
    send_invite = invite_params[:send_invite]

    return render json: { status: 'Error', message: 'Name is required' }, status: :bad_request if name.blank?
    return render json: { status: 'Error', message: 'Email is required' }, status: :bad_request if email.blank?
    return render json: { status: 'Error', message: 'Send invite is required' }, status: :bad_request if send_invite.blank?

    render json: { status: 'Error', message: 'Email address is invalid' }, status: :bad_request if EmailValidator.invalid?(email)
  end

  def create_business_partner_params
    params.permit(:merchant_guid)
  end

  def show_business_partner_params
    params.permit(:id, :show_terms)
  end

  def invite_params
    params.permit(:id, :email, :name, :send_invite)
  end

  def listing_params
    params.permit(:offset, :limit)
  end

  def business_partner_merchants_params
    params.permit(:id, :offset, :limit, :order_by, :order_direction, :filter)
  end

  def business_partner_list_params
    params.permit(:id, :offset, :limit, :order_by, :order_direction, :filter)
  end

  def business_partner_profile_params
    params.permit(:id)
  end

  def update_business_partner_profile_params
    params.permit(:id, :ario_marketing_requested, :collateral_downloaded, :partner_training_completed, :sales_training_completed,
                  :facebook_sharing_requested, :twitter_sharing_requested, :linkedin_sharing_requested, :vanity_added_to_website)
  end

  # rubocop:disable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
  def build_update_profile_params
    params = {}
    marketing_requested = update_business_partner_profile_params[:ario_marketing_requested]
    collateral_downloaded = update_business_partner_profile_params[:collateral_downloaded]
    partner_training_completed = update_business_partner_profile_params[:partner_training_completed]
    sales_training_completed = update_business_partner_profile_params[:sales_training_completed]
    facebook_sharing_requested = update_business_partner_profile_params[:facebook_sharing_requested]
    twitter_sharing_requested = update_business_partner_profile_params[:twitter_sharing_requested]
    linkedin_sharing_requested = update_business_partner_profile_params[:linkedin_sharing_requested]
    vanity_added_to_website = update_business_partner_profile_params[:vanity_added_to_website]

    params[:ario_marketing_requested] = marketing_requested unless marketing_requested.blank?
    params[:collateral_downloaded] = collateral_downloaded unless collateral_downloaded.blank?
    params[:partner_training_completed] = partner_training_completed unless partner_training_completed.blank?
    params[:sales_training_completed] = sales_training_completed unless sales_training_completed.blank?
    params[:facebook_sharing_requested] = facebook_sharing_requested unless facebook_sharing_requested.blank?
    params[:twitter_sharing_requested] = twitter_sharing_requested unless twitter_sharing_requested.blank?
    params[:linkedin_sharing_requested] = linkedin_sharing_requested unless linkedin_sharing_requested.blank?
    params[:vanity_added_to_website] = vanity_added_to_website unless vanity_added_to_website.blank?

    params
  end
  # rubocop:enable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
end
