# frozen_string_literal: true

class Api::V1::BorrowerInvoicesController < ApplicationController
  before_action :validate_token

  # GET /api/v1/borrower_invoices
  def index
    params = invoices_params.slice(:offset, :limit, :order_by, :order_direction, :filter)

    invoices = ztt_client.merchants_api.get_received_business_partner_invoices(invoices_params[:id], params)
    render json: { status: 'Success', message: 'Loaded Borrower Invoices', data: invoices }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/borrower_invoices/{id}
  def show
    invoice = ztt_client.business_partner_invoices_api.get_business_partner_merchant_invoice(invoice_params[:id])
    render json: { status: 'Success', message: 'Loaded Invoice', data: invoice }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)

    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def invoice_params
    params.permit(:id)
  end

  def invoices_params
    params.permit(:id, :offset, :limit, :order_by, :order_direction, :filter)
  end
end
