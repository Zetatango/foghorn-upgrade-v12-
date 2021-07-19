# frozen_string_literal: true

require 'openssl'
require 'jose'

module AccessTokenHelper
  extend ActiveSupport::Concern

  def stub_jwks_response
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/oauth/discovery/keys")
      .to_return(status: 200, body: verification_jwks.to_json)
  end

  def verification_jwks
    { keys: [JSON.parse(verification_key.to_binary)] }
  end

  def key_id
    @key_id ||= SecureRandom.uuid
  end

  def generate_key(kid = nil)
    jwk = JOSE::JWK.generate_key([:rsa, 1024])
    jwk.merge('kid' => kid.nil? ? key_id : kid,
              'use' => 'sig')
  end

  def current_key
    @current_key ||= generate_key
  end

  def signing_key
    current_key
  end

  def verification_key
    current_key.to_public
  end

  # rubocop:disable Metrics/CyclomaticComplexity
  # rubocop:disable Metrics/PerceivedComplexity
  def access_token(options = {})
    valid_signature = options.key?(:valid_signature) ? options[:valid_signature] : true
    issuer = options.key?(:issuer) ? options[:issuer] : Rails.configuration.roadrunner_url
    subject = options.key?(:subject) ? options[:subject] : "u_#{SecureRandom.base58(16)}"
    audience = options.key?(:audience) ? options[:audience] : Rails.application.secrets.user_oidc[:credentials][:client_id]
    properties = options.key?(:properties) ? options[:properties] : {}
    delete_keys = options.key?(:delete_keys) ? options[:delete_keys] : []

    payload = {
      iss: issuer,
      sub: subject,
      aud: audience,
      properties: properties,
      iat: Time.now.to_i,
      exp: (Time.now + 1.minute).to_i,
      jti: SecureRandom.uuid,
      events: {
        "http://schemas.openid.net/event/backchannel-logout": {}
      }
    }

    payload[:nonce] = options[:nonce] if options.key?(:nonce)

    delete_keys.each do |key|
      payload.delete key
    end

    return as_jws_token(payload, signing_key) if valid_signature

    as_jws_token(payload, generate_key)
  end
  # rubocop:enable Metrics/CyclomaticComplexity
  # rubocop:enable Metrics/PerceivedComplexity

  def as_jws_token(payload, key)
    JSON::JWT.new(payload).sign(key.to_key, 'RS512').to_s
  end
end
