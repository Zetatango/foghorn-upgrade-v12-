# frozen_string_literal: true

require 'token_validator'

class ApiAccessTokenService
  class ApiAccessTokenServiceException < RuntimeError
    attr_reader :message

    def initialize(message)
      super(message)
      @message = message
    end
  end

  class DelegatedAccessTokenException < ApiAccessTokenServiceException; end

  def initialize(delegated_access_token)
    @delegated_access_token = delegated_access_token
    @oauth_token_service = TokenValidator::OauthTokenService.instance
  end

  def api_access_token
    @api_access_token ||= request_api_access_token
  end

  private

  def valid_token?
    @delegated_access_token.present?
  end

  def request_api_access_token
    raise DelegatedAccessTokenException, 'Delegated access token is not valid' unless valid_token?

    oauth_header = @oauth_token_service.oauth_auth_header
    return nil if oauth_header.blank? # Will be blank if an error occurs while fetching access token

    response = RestClient.post(roadrunner_api_path(:token), { access_token: @delegated_access_token }, oauth_header)
    JSON.parse(response.body, symbolize_names: true)[:access_token]
  rescue Errno::ECONNREFUSED, RestClient::Exception
    nil
  end

  def roadrunner_api_path(action)
    "#{Rails.configuration.roadrunner_url}/api/clients/#{action}"
  end
end
