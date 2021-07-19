# frozen_string_literal: true

require 'test_helper'

class ApiAccessTokenTest < ActiveSupport::TestCase
  def setup
    @delegated_access_token = SecureRandom.base58(32)
    @idp_access_token = SecureRandom.base58(32)
    @api_access_token = SecureRandom.base58(32)

    TokenValidator::OauthTokenService.instance.clear

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)
  end

  test 'empty delegate access token throws error' do
    assert_raise ApiAccessTokenService::DelegatedAccessTokenException do
      ApiAccessTokenService.new('').api_access_token
    end
  end

  test 'requests access token from idp' do
    ApiAccessTokenService.new(@delegated_access_token).api_access_token
    assert_requested(:post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1)
  end

  test 'requests delete api access token' do
    ApiAccessTokenService.new(@delegated_access_token).api_access_token
    assert_requested(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token", times: 1)
  end

  test 'creates api access token' do
    assert_not_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'idp unresponsive (request 1) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_raise(Errno::ETIMEDOUT)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'idp unresponsive (request 2) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_raise(Errno::ETIMEDOUT)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'idp offline (request 1) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_raise(Errno::ECONNREFUSED)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'idp offline (request 2) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_raise(Errno::ECONNREFUSED)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'unauthorized error (idp access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 401)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'forbidden error (idp access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 403)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'unauthorized error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 401)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'forbidden error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 403)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end

  test 'bad request error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 400)

    assert_nil ApiAccessTokenService.new(@delegated_access_token).api_access_token
  end
end
