# frozen_string_literal: true

require 'ztt_client'

# TODO: create a parent class for all Lending related stuff
class Api::V1::LendingRepaymentsController < ApplicationController
  before_action :validate_token

  def index
    repayments = ztt_client.lending_api.get_repayments
    render json: { status: 'Success', message: 'Loaded Lending Repayments List', data: repayments }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def show
    repayment_id = repayment_params[:id]
    repayment = ztt_client.lending_api.get_lending_ubl_repayment(repayment_id)

    render json: { status: 'Success', message: 'Loaded Lending Repayments List', data: repayment }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  protected

  def repayment_params
    params.permit(:id)
  end
end
