# frozen_string_literal: true

class Api::V1::TransactionsController < ApplicationController
  before_action :validate_token

  def index
    params = list_params.slice(:offset, :limit, :order_by, :order_direction)

    history = ztt_client.transactions_api.get_transaction_history(params)

    render json: { status: 'Success', message: 'Loaded transaction history', data: history }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def list_params
    params.permit(:offset, :limit, :order_by, :order_direction)
  end
end
