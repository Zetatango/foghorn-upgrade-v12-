# frozen_string_literal: true

require 'token_validator'

class ProfileAccessTokenService
  class ProfileAccessTokenServiceException < RuntimeError
    attr_reader :message

    def initialize(message)
      super(message)
      @message = message
    end
  end

  class ProfileGuidException < ProfileAccessTokenServiceException; end
  class AccessTokenException < ProfileAccessTokenServiceException; end

  def initialize(profile_guid, access_token, context = nil)
    @profile_guid = profile_guid
    @access_token = access_token
    @context = context

    @oauth_token_service = TokenValidator::OauthTokenService.instance
  end

  def api_access_token
    @api_access_token ||= request_api_access_token
  end

  private

  def valid_profile_guid?
    @profile_guid.present?
  end

  def valid_token?
    @access_token.present?
  end

  def request_api_access_token
    raise ProfileGuidException, 'Profile guid must be supplied' unless valid_profile_guid?
    raise AccessTokenException, 'Access token is not valid' unless valid_token?

    oauth_header = { authorization: "Bearer #{@access_token}" }

    payload = { profile_guid: @profile_guid }
    payload[:context] = @context if @context.present?
    response = RestClient.post(roadrunner_api_path(:token), payload, oauth_header)

    JSON.parse(response.body, symbolize_names: true)[:access_token]
  rescue Errno::ECONNREFUSED, RestClient::Exception => e
    Rails.logger.error("Failed to get profile access token: #{e.message}")
    nil
  end

  def roadrunner_api_path(action)
    "#{Rails.configuration.roadrunner_url}/api/users/#{action}"
  end
end
