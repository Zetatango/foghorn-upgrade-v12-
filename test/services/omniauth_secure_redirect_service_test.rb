# frozen_string_literal: true

require 'test_helper'

class OmniauthSecureRedirectServiceTest < ActiveSupport::TestCase
  setup do
    @service = OmniauthSecureRedirectService.instance
    @service.clear
  end

  teardown do
    @service.clear
  end

  test 'it caches a secure redirect token' do
    Rails.cache.expects(:write)

    @service.generate_secure_redirect_token
  end

  test 'it sets an expire on the cached token' do
    token = SecureRandom.base58(16)

    SecureRandom.stubs(:base58).returns(token)

    Rails.cache.expects(:write).with(token, OmniauthSecureRedirectService::CACHE_KEY_VALUE, expires_in: OmniauthSecureRedirectService::CACHE_KEY_TIMEOUT,
                                                                                            namespace: OmniauthSecureRedirectService::CACHE_KEY_NAMESPACE)

    @service.generate_secure_redirect_token
  end

  test 'it returns the secure redirect token' do
    assert_not_nil @service.generate_secure_redirect_token
  end

  test 'it returns true if the secure redirect token is valid' do
    token = @service.generate_secure_redirect_token

    assert @service.valid_secure_redirect_token?(token)
  end

  test 'it deletes a consumed valid secure redirect token' do
    token = @service.generate_secure_redirect_token

    assert @service.valid_secure_redirect_token?(token)
    assert_not @service.valid_secure_redirect_token?(token)
  end

  test 'it returns false if the secure redirect token is invalid' do
    assert_not @service.valid_secure_redirect_token?(SecureRandom.base58(16))
  end
end
