# frozen_string_literal: true

class Api::V1::SocialConnectionsController < ApplicationController
  before_action :validate_token

  def index
    result = ztt_client.social_connections_api.get_social_connections

    render json: { status: 'Success', message: 'Social connection status', data: result }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def disconnect_facebook
    result = ztt_client.social_connections_api.delete_facebook_social_connection

    render json: { status: 'Success', message: 'Disconnect from Facebook', data: result }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end
end
