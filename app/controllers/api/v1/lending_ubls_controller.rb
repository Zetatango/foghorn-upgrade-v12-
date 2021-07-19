# frozen_string_literal: true

require 'ztt_client'

class Api::V1::LendingUblsController < ApplicationController
  before_action :validate_token

  def index
    ubls_info = {
      merchant_id: current_user&.merchant_on_selected_profile
    }

    ubls = ztt_client.lending_api.get_ubls(ubls_info)
    render json: { status: 'Success', message: 'Loaded Offers', data: ubls }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def show
    id = show_params[:id]
    ubl = ztt_client.lending_api.get_lending_ubl(id)
    render json: { status: 'Success', message: 'Loaded Lending UBL', data: ubl }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def show_params
    params.permit(:id)
  end
end
