# frozen_string_literal: true

require 'singleton'

class OmniauthSecureRedirectService
  include Singleton

  CACHE_KEY_VALUE = 1
  CACHE_KEY_TIMEOUT = 30.seconds
  CACHE_KEY_NAMESPACE = 'omniauth-redirect'

  def generate_secure_redirect_token
    token = SecureRandom.base58(16)

    Rails.cache.write(token, CACHE_KEY_VALUE, expires_in: CACHE_KEY_TIMEOUT, namespace: CACHE_KEY_NAMESPACE)

    token
  end

  def valid_secure_redirect_token?(token)
    Rails.cache.delete(token, namespace: CACHE_KEY_NAMESPACE)
  end

  def clear
    Rails.cache.clear(namespace: CACHE_KEY_NAMESPACE)
  end
end
