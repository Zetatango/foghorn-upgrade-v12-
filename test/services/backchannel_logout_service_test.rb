# frozen_string_literal: true

require 'test_helper'

class BackchannelLogoutServiceTest < ActiveSupport::TestCase
  def setup
    stub_jwks_response

    @service = BackchannelLogoutService.instance
    @service.clear
  end

  teardown do
    @service.clear
  end

  test 'malformed jwt' do
    jwt = "#{SecureRandom.base64(32)}.#{SecureRandom.base64(32)}.#{SecureRandom.base64(32)}"
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout jwt
    end
  end

  test 'accepts valid jwts' do
    assert_nothing_raised do
      @service.logout access_token
    end
  end

  test 'invalid signature on retry' do
    WebMock.reset!
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/oauth/discovery/keys")
      .to_return(status: 200, body: verification_jwks.to_json.gsub(/[abcdfgh]/, 'Z'))
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/oauth/discovery/keys")
      .to_return(status: 200, body: verification_jwks.to_json.gsub(/[abcdfgh]/, 'Z'))

    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token
    end
  end

  test 'valid signature on retry' do
    WebMock.reset!
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/oauth/discovery/keys")
      .to_return(status: 200, body: verification_jwks.to_json.gsub(/[abcdfgh]/, 'Z'))
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/oauth/discovery/keys")
      .to_return(status: 200, body: verification_jwks.to_json)

    assert_nothing_raised do
      @service.logout access_token
    end
  end

  test 'invalid signature' do
    WebMock.reset!
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/oauth/discovery/keys")
      .to_return(status: 200, body: verification_jwks.to_json.gsub(/[abcdfgh]/, 'Z'))

    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token
    end
  end

  test 'failed logout if sessions cannot be developed' do
    Rails.cache.stubs(:delete).raises(Redlock::LockError.new("u_#{SecureRandom.base58(16)}"))
    assert_raises BackchannelLogoutService::LogoutFailed do
      @service.logout access_token
    end
  end

  test 'expired jwt' do
    old_token = access_token
    Timecop.freeze(Time.now + 10.minutes) do
      assert_raises BackchannelLogoutService::InvalidToken do
        @service.logout old_token
      end
    end
  end

  test 'contains prohibited nonce' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(nonce: SecureRandom.hex(64))
    end
  end

  test 'missing events' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(delete_keys: [:events])
    end
  end

  test 'missing subject' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(delete_keys: [:sub])
    end
  end

  test 'missing audience' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(delete_keys: [:aud])
    end
  end

  test 'missing issuer' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(delete_keys: [:iss])
    end
  end

  test 'invalid audience' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(audience: SecureRandom.hex(32))
    end
  end

  test 'invalid issuer' do
    assert_raises BackchannelLogoutService::InvalidToken do
      @service.logout access_token(issuer: "http://#{Rails.configuration.zetatango_url}")
    end
  end
end
