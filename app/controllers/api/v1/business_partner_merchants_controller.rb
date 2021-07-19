# frozen_string_literal: true

class Api::V1::BusinessPartnerMerchantsController < ApplicationController
  before_action :validate_token
  before_action :validate_business_partner_merchant_guid, :validate_merchant_document_guid, except: :subscribe
  before_action :validate_business_partner_merchants_guids, only: :subscribe

  # POST /api/v1/business_partner_merchants/{id}/invoice
  def invoice
    account_num = create_invoice_params[:account_number].blank? ? '' : create_invoice_params[:account_number]

    response = ztt_client.business_partner_merchants_api.post_business_partner_merchant_invoice(
      create_invoice_params[:id], create_invoice_params[:invoice_number], account_num,
      create_invoice_params[:amount], create_invoice_params[:merchant_document_id], create_invoice_params[:due_date]
    )
    render json: { status: 'SUCCESS', message: 'Business partner merchant invoices created successfully', data: response }, status: :created
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while creating a business partner merchant invoice: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  rescue ArgumentError => e
    Rails.logger.error("An argument error occurred while creating a business partner merchant invoice: #{e.message}")
    render json: { status: 'Error', message: e.message, code: :bad_request }, status: :bad_request
  end

  # POST /api/v1/business_partner_merchants/subscribe
  def subscribe
    response = ztt_client.business_partner_merchants_api.put_business_partner_merchants_auto_send_subscribe(
      subscription_params[:business_partner_merchants_ids].to_json,
      subscription_params[:auto_send]
    )

    render json: { status: 'SUCCESS', message: 'Business partner merchant subscribed to auto send payment plans successfully', data: response },
           status: :created
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("Error code #{response[:code]} occurred subscribing a business partner merchant to auto send payment plans: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  rescue ArgumentError => e
    Rails.logger.error("An argument error occurred while subscribing a business partner merchant to auto send payment plans: #{e.message}")
    render json: { status: 'Error', message: e.message, code: :bad_request }, status: :bad_request
  end

  private

  def create_invoice_params
    params.permit(:id, :invoice_number, :account_number, :amount, :merchant_document_id, :due_date)
  end

  def subscription_params
    params.permit(:auto_send, business_partner_merchants_ids: [])
  end

  def validate_merchant_document_guid
    merchant_document_guid = params[:merchant_document_id]

    return render json: { status: 'Error', message: 'Merchant document guid is required' }, status: :bad_request if merchant_document_guid.blank?

    return if merchant_document_guid_valid?(merchant_document_guid)

    render json: { status: 'Error', message: 'Merchant document guid is invalid' }, status: :bad_request
  end

  def validate_business_partner_merchants_guids
    merchants_guids = subscription_params[:business_partner_merchants_ids]
    invalid_guids = []

    return render json: { status: 'Error', message: 'Business partner merchant guid is required' }, status: :bad_request if merchants_guids.blank?

    merchants_guids.each do |guid|
      invalid_guids.push(guid) unless merchant_guid_valid?(guid)
    end

    render json: { status: 'Error', message: "Invalid merchants guids: #{invalid_guids.to_sentence}" }, status: :bad_request if invalid_guids.any?
  end

  def validate_business_partner_merchant_guid
    merchant_guid = params[:id]

    return render json: { status: 'Error', message: 'Business partner merchant guid is required' }, status: :bad_request if merchant_guid.blank?

    render json: { status: 'Error', message: 'Business partner merchant guid is invalid' }, status: :bad_request unless merchant_guid_valid?(merchant_guid)
  end

  def merchant_document_guid_valid?(merchant_document_guid)
    /^md_\w{16}$/.match?(merchant_document_guid)
  end

  def merchant_guid_valid?(merchant_guid)
    /^bpm_\w{16}$/.match?(merchant_guid)
  end
end
