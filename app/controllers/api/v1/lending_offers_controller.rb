# frozen_string_literal: true

require 'ztt_client'

class Api::V1::LendingOffersController < ApplicationController
  before_action :validate_token

  def offers
    offers_info = {
      merchant_id: current_user&.merchant_on_selected_profile
    }

    offers = ztt_client.lending_api.get_offers(offers_info)
    render json: { status: 'Success', message: 'Loaded Offers', data: offers }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def show_offer
    id = show_offer_params[:id]
    supplier_id = show_offer_params[:supplier_id] || ''
    offer = ztt_client.lending_api.get_lending_offer(id, supplier_id: supplier_id)
    render json: { status: 'Success', message: 'Loaded Offer', data: offer }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def fee
    id = fee_params[:id]
    principal_amount = fee_params[:principal_amount]
    loan_term_id = fee_params[:loan_term_id]
    fee = ztt_client.lending_api.fee_for_lending_offer(id, principal_amount, loan_term_id: loan_term_id)
    render json: { status: 'Success', message: 'Loaded Offer fee', data: fee }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  protected

  def show_offer_params
    params.permit(:id, :supplier_id)
  end

  def fee_params
    params.permit(:id, :principal_amount, :loan_term_id)
  end
end
