# frozen_string_literal: true

require 'ztt_client'

class Api::V1::ApplicantsController < ApplicationController
  before_action :validate_token

  def init_authenticate
    guid = init_authenticate_params[:id]

    init_authenticate_response = ztt_client.applicants_api.initiate_applicant_authentication(guid, language: init_authenticate_params[:language])
    render json: { status: 'SUCCESS', message: 'Authentication initiated', data: init_authenticate_response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def authenticate
    guid = authenticate_params[:id]

    # Applicant responses should be numeric values which map to the answer index, so we will convert from an array of strings to an array of integers
    applicant_responses = authenticate_params[:applicant_responses]&.grep(/\A\d+\z/, &:to_i)

    authenticate_response_body = {
      authentication_query_guid: authenticate_params[:authentication_query_guid],
      applicant_responses: applicant_responses
    }.to_json

    authenticate_response = ztt_client.applicants_api.complete_applicant_authentication(guid, authenticate_response_body)
    render json: { status: 'SUCCESS', message: 'Authenticated', data: authenticate_response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def init_authenticate_params
    params.permit(:id, :language)
  end

  def authenticate_params
    params.permit(:authentication_query_guid, :id, applicant_responses: [])
  end
end
