# frozen_string_literal: true

require 'singleton'
require 'token_validator'

class BackchannelLogoutService
  include Singleton

  def initialize
    @oauth_token_service = TokenValidator::OauthTokenService.instance
  end

  def clear
    Rails.cache.delete_matched("\\A#{CACHE_KEY}")
    @oauth_token_service.clear
  end

  def logout(logout_token)
    payload = decode_jwt(logout_token)
    uid = verify(logout_token, payload)

    raise LogoutFailed unless SessionManagerService.instance.delete_all_for_uid(uid)

    cache_jwt(logout_token, payload['exp'])
  rescue JSON::JWT::InvalidFormat
    raise InvalidToken, 'Invalid JWT format'
  rescue JSON::JWS::VerificationFailed
    raise InvalidToken, 'Invalid JWT signature'
  end

  private

  CACHE_KEY = 'backchannel_logout_jwt_'

  REQUIRED_KEYS = %w[iss aud exp sub events].freeze
  PROHIBITED_KEYS = %w[nonce].freeze

  class BackchannelLogoutException < RuntimeError
    attr_reader :message

    def initialize(message = '')
      super(message)
      @message = message
    end
  end

  class InvalidToken < BackchannelLogoutException; end
  class LogoutFailed < BackchannelLogoutException; end

  def decode_jwt(jwt)
    JSON::JWT.decode jwt, signing_key
  rescue JSON::JWS::VerificationFailed
    @oauth_token_service.clear
    JSON::JWT.decode jwt, signing_key
  end

  def cache_jwt(jwt, expires_at)
    Rails.cache.write("#{CACHE_KEY}#{jwt}", 1, expires_in: (expires_at - Time.now.utc.to_i).seconds)
  end

  def verify_payload_fields(payload)
    REQUIRED_KEYS.each { |key| raise InvalidToken, "Missing parameter: #{key}" unless payload.key? key }
    PROHIBITED_KEYS.each { |key| raise InvalidToken, "Prohibited parameter: #{key}" if payload.key? key }
  end

  def verify_payload_contents(jwt, payload)
    raise InvalidToken, 'Invalid issuer' unless payload['iss'] == Rails.configuration.roadrunner_url
    raise InvalidToken, 'Invalid audience' unless Array(payload['aud']).include? Rails.application.secrets.user_oidc[:credentials][:client_id]
    raise InvalidToken, 'Token expired' unless payload['exp'] > Time.now.utc.to_i
    raise InvalidToken, 'Token replay detected' if Rails.cache.exist?("#{CACHE_KEY}#{jwt}")
  end

  def verify(jwt, payload)
    verify_payload_fields payload
    verify_payload_contents jwt, payload
    payload['sub']
  end

  def signing_key
    @oauth_token_service.signing_key.first if @oauth_token_service.signing_key&.length&.positive?
  end
end
