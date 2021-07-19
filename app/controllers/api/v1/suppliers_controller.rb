# frozen_string_literal: true

require 'ztt_client'

class Api::V1::SuppliersController < ApplicationController
  before_action :validate_token
  #
  # Authorization: will automatically call Ability.authorize!(:index)
  #
  def index
    supplier_opts = {
      start: supplier_params[:start],
      count: supplier_params[:count],
      search_string: supplier_params[:search_string]
    }
    suppliers = ztt_client.suppliers_api.get_list_of_suppliers(supplier_opts)
    render json: { status: 'Success', message: 'Loaded Suppliers List', data: suppliers }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  protected

  def supplier_params
    params.permit(:start, :count, :search_string)
  end
end
