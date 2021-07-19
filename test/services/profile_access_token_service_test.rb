# frozen_string_literal: true

require 'test_helper'

class ProfileAccessTokenTest < ActiveSupport::TestCase
  def setup
    @profile_guid = "prof_#{SecureRandom.base58(16)}"
    @idp_access_token = SecureRandom.base58(32)
    @api_access_token = SecureRandom.base58(32)

    TokenValidator::OauthTokenService.instance.clear

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)
  end

  test 'nil profile guid throws error' do
    assert_raise ProfileAccessTokenService::ProfileGuidException do
      ProfileAccessTokenService.new(nil, @idp_access_token).api_access_token
    end
  end

  test 'nil access token throws error' do
    assert_raise ProfileAccessTokenService::AccessTokenException do
      ProfileAccessTokenService.new(@profile_guid, nil).api_access_token
    end
  end

  test 'empty profile guid throws error' do
    assert_raise ProfileAccessTokenService::ProfileGuidException do
      ProfileAccessTokenService.new('', @idp_access_token).api_access_token
    end
  end

  test 'empty access token throws error' do
    assert_raise ProfileAccessTokenService::AccessTokenException do
      ProfileAccessTokenService.new(@profile_guid, '').api_access_token
    end
  end

  test 'requests profile access token from idp' do
    ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
    assert_requested(:post, "#{Rails.configuration.roadrunner_url}/api/users/token", times: 1)
  end

  test 'creates access token' do
    assert_not_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
  end

  test 'idp unresponsive returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_raise(Errno::ETIMEDOUT)

    assert_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
  end

  test 'idp offline returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_raise(Errno::ECONNREFUSED)

    assert_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
  end

  test 'unauthorized error (idp access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 401)

    assert_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
  end

  test 'forbidden error (idp access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 403)

    assert_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
  end

  test 'bad request error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 400)

    assert_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token).api_access_token
  end

  test 'creates access token with context' do
    WebMock.reset!
    context = { endorsing_partner: "p_#{SecureRandom.base58(16)}" }
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: { profile_guid: @profile_guid, context: context }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    assert_not_nil ProfileAccessTokenService.new(@profile_guid, @idp_access_token, context).api_access_token
  end
end
