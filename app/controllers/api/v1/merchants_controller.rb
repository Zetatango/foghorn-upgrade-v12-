# frozen_string_literal: true

require 'ztt_client'

class Api::V1::MerchantsController < ApplicationController
  before_action :validate_token
  before_action :load_merchant_bundle, only: %i[load_invoices bundle]
  before_action :load_merchant, except: %i[new create_branding branding edit_branding update bank_accounts]
  before_action :validate_agreement_params, only: :agreement
  before_action :validate_bp_branding_params, only: :create_branding
  before_action :validate_bp_branding_edit_params, only: :edit_branding
  before_action :validate_update_params, only: :update
  before_action :validate_documents_params, only: :documents

  # TODO: require params[:id] and rename this action to show
  def index
    render json: { status: 'SUCCESS', message: 'Loaded resources', data: @merchant }, status: :ok
  end

  def bundle
    data = {
      merchant: @merchant,
      offers: @offers,
      applications: @apps,
      advances: @advances,
      delegated_mode: redirected_user_access_token ? true : false
    }
    render json: { status: 'SUCCESS', message: 'Loaded resources', data: data }, status: :ok
  end

  def new
    @new_merchant = ztt_client.merchants_api.create_merchant(format_new_merchant_params)
    render json: { status: 'SUCCESS', message: 'Loaded resources', data: @new_merchant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def load_invoices
    @invoices = ztt_client.financing_api.get_list_of_invoices(merchant_id: @merchant.id) if @advances.present?
    render json: { status: 'SUCCESS', message: 'Loaded invoices', data: @invoices }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def load_campaigns
    @campaigns = ztt_client.financing_api.get_campaigns(state: campaigns_params[:state])
    render json: { status: 'SUCCESS', message: 'Loaded campaigns', data: @campaigns }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def pad_agreement
    @pad_agreement = ztt_client.financing_api.get_pad_agreement(pad_agreement_params[:app_id])
    render json: { status: 'SUCCESS', message: 'Loaded PAD agreement', data: @pad_agreement }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def bank_account
    bank_account_id = bank_account_params[:id]

    @bank_account = ztt_client.common_api.get_bank_account(bank_account_id)
    render json: { status: 'SUCCESS', message: 'Bank account', data: @bank_account }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.warn("original exception msg: #{response[:message]} status: #{response[:status]} code: #{response[:code]}") if response[:status] == 404
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def bank_accounts
    opts = { source: bank_accounts_params[:source] }
    @bank_accounts = ztt_client.common_api.get_bank_accounts(current_user.owner_guid, opts)
    render json: { status: 'SUCCESS', message: 'Bank accounts', data: @bank_accounts }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.warn("original exception msg: #{response[:message]} status: #{response[:status]} code: #{response[:code]}") if response[:status] == 404
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def post_bank_account
    ba_params = new_bank_account_params
    bank_account = {
      institution_number: ba_params[:institution_number],
      transit_number: ba_params[:transit_number],
      account_number: ba_params[:account_number]
    }.to_json
    @new_bank_account = ztt_client.merchants_api.post_merchant_create_bank_account(@merchant.id, bank_account)
    load_merchant

    render json: { status: 'SUCCESS', message: 'Bank account created', data: @merchant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def select_bank_account
    owner_guid = selected_bank_account_params[:owner_guid]

    bank_account = {
      bank_account_id: selected_bank_account_params[:bank_account_id]
    }.to_json

    @selected_bank_account = ztt_client.merchants_api.post_merchant_select_bank_account(owner_guid, bank_account)
    load_merchant

    render json: { status: 'SUCCESS', message: 'Bank account selected', data: @merchant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def select_sales_volume_accounts
    owner_guid = selected_sales_volume_accounts_params[:owner_guid]

    bank_accounts = {
      bank_account_ids: selected_sales_volume_accounts_params[:bank_account_ids]
    }.to_json

    @selected_sales_volume_account = ztt_client.merchants_api.post_merchant_selected_sales_volume_accounts(owner_guid, bank_accounts)
    load_merchant

    render json: { status: 'SUCCESS', message: 'Sales volume accounts selected', data: @merchant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def select_insights_bank_accounts
    owner_guid = selected_insights_bank_accounts_params[:owner_guid]

    bank_accounts = {
      bank_account_ids: selected_insights_bank_accounts_params[:bank_account_ids]
    }.to_json

    @selected_insights_bank_accounts = ztt_client.merchants_api.post_merchant_selected_insights_bank_accounts(owner_guid, bank_accounts)
    load_merchant

    render json: { status: 'SUCCESS', message: 'Insights bank accounts selected', data: @merchant }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def request_assistance
    ra = request_assistance_params
    reason = { reason: ra[:reason] }.to_json
    ztt_client.merchants_api.post_merchant_request_assistance(@merchant.id, reason)
    render json: { status: 'SUCCESS', message: 'Merchant assistance requested' }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # POST /api/v1/increase_limit
  def increase_limit
    ztt_client.merchants_api.post_merchant_increase_limit(@merchant.id)

    render json: { status: 'Success', message: 'Increase limit requested' }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # POST /api/v1/refresh_offers
  def refresh_offers
    ztt_client.merchants_api.post_merchant_refresh_offers(@merchant.id)

    render json: { status: 'Success', message: 'Refresh offers requested' }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def agreement
    type = agreement_params[:type]
    show_terms = agreement_params[:show_terms]
    supplier_guid = agreement_params[:supplier_id]
    agreement = ztt_client.merchants_api.get_agreement(@merchant.id, type, show_terms: show_terms, supplier_id: supplier_guid)
    render json: { status: 'SUCCESS', message: 'Agreement retrieved', data: agreement }
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while getting the requested agreement: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  #
  # POST /api/v1/merchants/{id}/business_partner_branding
  #
  def create_branding
    response = ztt_client.merchants_api.post_business_partner_branding(
      branding_params[:id],
      vanity: branding_params[:vanity],
      primary_color: branding_params[:primary_color],
      secondary_color: branding_params[:secondary_color],
      logo: branding_params[:logo]
    )
    render json: { status: 'SUCCESS', message: 'Business partner branding successfully created', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to set business partner branding: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def branding
    return render json: { status: 'Error', message: 'Merchant guid is invalid' }, status: 400 unless merchant_guid_valid?(branding_params[:id])

    branding = ztt_client.merchants_api.get_business_partner_branding(branding_params[:id])
    render json: { status: 'SUCCESS', message: 'Business partner branding retrieved', data: branding }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to get a business partner branding: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def edit_branding
    response = ztt_client.merchants_api.put_business_partner_branding(
      branding_params[:id],
      vanity: branding_params[:vanity],
      primary_color: branding_params[:primary_color],
      secondary_color: branding_params[:secondary_color],
      logo: branding_params[:logo]
    )
    render json: { status: 'SUCCESS', message: 'Business partner branding successfully updated', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to update business partner branding: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def update
    response = ztt_client.merchants_api.update_merchant(update_params[:id], update_params.except(:id))
    render json: { status: 'SUCCESS', message: 'Merchant successfully updated', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to update a merchant: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  ##
  # Returns a +MerchantDocumentsListingEntity+
  #
  # The +MerchantDocumentsListingEntity+ will contain an array of +MerchantDocuments+,
  # as well as any parameters used for the query.
  #
  # GET /api/v1/merchants/documents
  #
  def documents
    response = ztt_client.merchant_documents_api.get_merchant_documents(documents_params)
    render json: { status: 'SUCCESS', message: 'Merchant documents successfully retrieved', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting merchant documents: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  protected

  def campaigns_params
    params.permit(:state)
  end

  def agreement_params
    params.permit(:type, :show_terms, :supplier_id)
  end

  def branding_params
    params.permit(:id, :vanity, :primary_color, :secondary_color, :logo)
  end

  def update_params
    params.permit(:id, :name, :doing_business_as, :business_num, :incorporated_in, :address_line_1, :address_line_2,
                  :city, :postal_code, :state_province, :country, :desired_bank_account_balance)
  end

  def documents_params
    params.permit(:offset, :limit, :order_by, :order_direction, :upload_start_time)
  end

  def validate_agreement_params
    render json: { status: 'Error', message: "Missing required parameter 'type'" }, status: 400 if agreement_params[:type].blank?

    return if agreement_params[:supplier_id].blank?

    render json: { status: 'Error', message: 'Supplier guid is invalid' }, status: 400 unless supplier_guid_valid?(agreement_params[:supplier_id])
  end

  def validate_bp_branding_params
    return render json: { status: 'Error', message: "Missing required parameter 'vanity'" }, status: 400 if branding_params[:vanity].blank?
    return render json: { status: 'Error', message: "Missing required parameter 'primary_color'" }, status: 400 if branding_params[:primary_color].blank?
    return render json: { status: 'Error', message: "Missing required parameter 'secondary_color'" }, status: 400 if branding_params[:secondary_color].blank?
    return render json: { status: 'Error', message: 'Logo is missing or format is unsupported' }, status: 400 unless logo_format_valid?(branding_params[:logo])

    render json: { status: 'Error', message: 'Merchant guid is invalid' }, status: 400 unless merchant_guid_valid?(branding_params[:id])
  end

  def validate_bp_branding_edit_params
    return render json: { status: 'Error', message: "Missing required parameter 'vanity'" }, status: 400 if branding_params[:vanity].blank?
    return render json: { status: 'Error', message: "Missing required parameter 'primary_color'" }, status: 400 if branding_params[:primary_color].blank?
    return render json: { status: 'Error', message: "Missing required parameter 'secondary_color'" }, status: 400 if branding_params[:secondary_color].blank?

    if branding_params[:logo].present?
      return render json: { status: 'Error', message: 'Logo format is unsupported' }, status: 400 unless logo_format_valid?(branding_params[:logo])
    end

    render json: { status: 'Error', message: 'Merchant guid is invalid' }, status: 400 unless merchant_guid_valid?(branding_params[:id])
  end

  def validate_update_params
    render json: { status: 'Error', message: 'Merchant guid is invalid' }, status: 400 unless merchant_guid_valid?(update_params[:id])
  end

  ##
  # Validates +document_params+
  #
  # The date that is specified must be in a proper date format, otherwise
  # to_datetime will throw an error.
  #
  # before_action: documents
  #
  def validate_documents_params
    DateTime.parse(documents_params[:upload_start_time]) if documents_params[:upload_start_time].present?
  rescue StandardError
    render json: { status: 'Error', message: 'Invalid upload_start_time format' }, status: 400
  end

  def supplier_guid_valid?(supplier_guid)
    /^su_\w{16}$/.match?(supplier_guid)
  end

  def merchant_guid_valid?(merchant_guid)
    /^m_\w{16}$/.match?(merchant_guid)
  end

  def logo_format_valid?(logo)
    %r{(data:image/png;base64,)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|)}.match?(logo)
  end

  def pad_agreement_params
    params.permit(:app_id)
  end

  def request_assistance_params
    params.permit(:reason)
  end

  def bank_account_params
    params.permit(:id)
  end

  def bank_accounts_params
    params.permit(:source)
  end

  def new_bank_account_params
    params.permit(:institution_number, :transit_number, :account_number)
  end

  def selected_bank_account_params
    params.permit(:merchant_id, :bank_account_id, :owner_guid)
  end

  def selected_sales_volume_accounts_params
    params.permit(:merchant_id, :owner_guid, bank_account_ids: [])
  end

  def selected_insights_bank_accounts_params
    params.permit(:merchant_id, :owner_guid, bank_account_ids: [])
  end

  def new_merchant_params
    params.permit(:name, :address_line_1, :city, :country, :postal_code, :state_province,
                  :email, :onboarding, :phone_number, :date_at_address, :industry, :avg_monthly_sales,
                  :partner_merchant_id, :business_num, :incorporated_in, :doing_business_as, :address,
                  :address_line_2, :lead_guid, :owner_since, :self_attested_date_established, :self_attested_average_monthly_sales)
  end

  def load_merchant_bundle
    @merchant = ztt_client.merchants_api.get_merchant('m_unused')
    @offers = ztt_client.financing_api.get_offers(merchant_id: @merchant.id)
    @apps = ztt_client.financing_api.get_applications(merchant_id: @merchant.id)
    @advances = ztt_client.financing_api.get_advances(merchant_id: @merchant.id)
  rescue SwaggerClient::ApiError => e
    case e.code
    when 0
      render json: { status: 'Error', message: 'Cannot connect with server' }, status: :service_unavailable
    when 404
      render json: { status: 'Error', message: 'Not found' }, status: :not_found
    else
      render json: { status: 'Error', message: 'Oops, not sure what went wrong' }, status: e.code
    end
  end

  def load_merchant
    @merchant = ztt_client.merchants_api.get_merchant('m_unused')
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def format_new_merchant_params
    merchant = {
      email: current_user.email,
      name: new_merchant_params[:name],
      phone_number: new_merchant_params[:phone_number],
      date_at_address: new_merchant_params[:date_at_address],
      industry: new_merchant_params[:industry],
      avg_monthly_sales: new_merchant_params[:avg_monthly_sales],

      address_line_1: new_merchant_params[:address_line_1],
      address_line_2: new_merchant_params[:address_line_2],
      city: new_merchant_params[:city],
      country: new_merchant_params[:country],
      postal_code: new_merchant_params[:postal_code],
      state_province: new_merchant_params[:state_province],
      business_num: new_merchant_params[:business_num],
      doing_business_as: new_merchant_params[:doing_business_as],
      incorporated_in: new_merchant_params[:incorporated_in],
      onboarding: new_merchant_params[:onboarding],
      self_attested_date_established: new_merchant_params[:self_attested_date_established],
      self_attested_average_monthly_sales: new_merchant_params[:self_attested_average_monthly_sales],
      lead_guid: new_merchant_params[:lead_guid],
      owner_since: new_merchant_params[:owner_since]
    }

    merchant.each do |key, value|
      merchant[key] = value.strip if value.is_a?(String) && !value.blank?
    end
    merchant.compact.to_json
  end
end
