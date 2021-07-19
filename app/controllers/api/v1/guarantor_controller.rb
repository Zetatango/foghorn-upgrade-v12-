# frozen_string_literal: true

require 'ztt_client'

class Api::V1::GuarantorController < ApplicationController
  before_action :validate_token

  def add
    params = add_guarantor_params

    guarantor = {
      application_guid: params[:application_id],
      first_name: params[:first_name],
      last_name: params[:last_name],
      date_of_birth: params[:date_of_birth],
      phone_number: params[:phone_number],
      email: params[:email],
      address_line_1: params[:address_line_1],
      city: params[:city],
      state_province: params[:state_province],
      country: params[:country],
      postal_code: params[:postal_code]
    }.to_json

    @new_guarantor_info = ztt_client.guarantor_info_api.create_guarantor(guarantor)
    render json: { status: 'SUCCESS', message: 'Guarantor info added', data: {} }, status: :ok
  rescue ActionController::ParameterMissing => e
    render json: { status: 'Error', message: e.message }, status: 400
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  protected

  def add_guarantor_params
    params.require(%i[application_id first_name last_name date_of_birth phone_number email address_line_1 city state_province country])
    params.permit(:application_id, :first_name, :last_name, :date_of_birth, :phone_number, :email, :relationship,
                  :address_line_1, :city, :state_province, :country, :postal_code)
  end
end
