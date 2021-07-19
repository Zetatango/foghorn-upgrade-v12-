# frozen_string_literal: true

require 'ztt_client'

class Api::V1::DirectPaymentsController < ApplicationController
  before_action :validate_token
  before_action :validate_direct_payment_guid, except: :create
  before_action :validate_create_params, only: :create

  def show
    direct_payment_id = direct_payment_params[:id]
    direct_payment = ztt_client.direct_payments_api.get_direct_payment(direct_payment_id)

    render json: { status: 'Success', message: 'Loaded Direct Payment', data: direct_payment }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def create
    dp = new_direct_payment_params

    direct_payment = {
      merchant_id: dp[:merchant_id],
      amount: dp[:amount],

      # Optional parameters
      invoice_id: dp[:invoice_id],
      invoice_number: dp[:invoice_number],
      account_number: dp[:account_number],
      payee_id: dp[:payee_id]
    }.to_json

    new_direct_payment = ztt_client.direct_payments_api.create_direct_payment(direct_payment)
    render json: { status: 'SUCCESS', message: 'Direct Payment Successfully created', data: new_direct_payment }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def validate_direct_payment_guid
    direct_payment_id = direct_payment_params[:id]

    return render json: { status: 'Error', message: 'Direct payment id is required' }, status: :bad_request if direct_payment_id.blank?

    render json: { status: 'Error', message: 'Direct payment id is invalid' }, status: :bad_request unless direct_payment_guid_valid?(direct_payment_id)
  end

  # rubocop:disable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity, Style/GuardClause
  def validate_create_params
    amount = new_direct_payment_params[:amount]
    merchant_id = new_direct_payment_params[:merchant_id]
    supplier_id = new_direct_payment_params[:payee_id]
    invoice_id = new_direct_payment_params[:invoice_id]

    return render json: { status: 'Error', message: 'Merchant guid is required' }, status: :bad_request if merchant_id.blank?
    return render json: { status: 'Error', message: 'Merchant guid is invalid' }, status: :bad_request unless merchant_guid_valid?(merchant_id)
    return render json: { status: 'Error', message: 'Amount is required' }, status: :bad_request if amount.blank?
    return render json: { status: 'Error', message: 'Amount is invalid' }, status: :bad_request unless amount_valid?(amount.to_s)

    if invoice_id.present?
      return render json: { status: 'Error', message: 'Invoice id is invalid' }, status: :bad_request unless invoice_guid_valid?(invoice_id)
    end

    if supplier_id.present?
      return render json: { status: 'Error', message: 'Supplier id is invalid' }, status: :bad_request unless supplier_guid_valid?(supplier_id)
    end
  end
  # rubocop:enable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity, Style/GuardClause

  def direct_payment_guid_valid?(direct_payment_guid)
    /^dp_\w{16}$/.match?(direct_payment_guid)
  end

  def merchant_guid_valid?(merchant_guid)
    /^m_\w{16}$/.match?(merchant_guid)
  end

  def supplier_guid_valid?(supplier_guid)
    /^su_\w{16}$/.match?(supplier_guid)
  end

  def invoice_guid_valid?(invoice_guid)
    /^bpiv_\w{16}$/.match?(invoice_guid)
  end

  def amount_valid?(amount)
    /^\d{1,9}(\.\d{1,2})?$/.match?(amount)
  end

  protected

  def direct_payment_params
    params.permit(:id)
  end

  def new_direct_payment_params
    params.permit(:merchant_id,
                  :amount,
                  :invoice_id,
                  :invoice_number,
                  :account_number,
                  :payee_id)
  end
end
