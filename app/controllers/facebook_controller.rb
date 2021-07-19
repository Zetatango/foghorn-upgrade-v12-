# frozen_string_literal: true

class FacebookController < OmniauthProviderBaseController
  PROVIDER = 'Facebook'

  rescue_from StandardError do |e|
    handle_standard_error(e)
  end

  private

  def provider
    PROVIDER
  end

  def callback_merchant_info
    info = { facebook_access_token: callback_access_token }
    expires_at = callback_access_token_expires_at

    info[:facebook_access_token_expires_at] = expires_at unless expires_at.nil?

    info
  end

  def callback_access_token_expires_at
    expires = request.env.dig('omniauth.auth', :credentials, :expires)
    raise InvalidOmniauthProviderResponseError, 'expires missing from the Facebook response' if expires.nil?

    return nil unless expires

    access_token_expire_at = request.env.dig('omniauth.auth', :credentials, :expires_at)
    raise InvalidOmniauthProviderResponseError, 'expires_at missing from the Facebook response' unless access_token_expire_at.present?

    access_token_expire_at
  end

  def callback_access_token
    access_token = request.env.dig('omniauth.auth', :credentials, :token)
    raise InvalidOmniauthProviderResponseError, 'Access token not present in the Facebook response' unless access_token.present?

    access_token
  end
end
