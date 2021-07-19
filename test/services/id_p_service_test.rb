# frozen_string_literal: true

require 'test_helper'

class IdPServiceTest < ActiveSupport::TestCase
  include ScimHelper

  setup do
    stub_jwks_response
    stub_oauth_token_request

    @service = IdPService.new
    @service.clear

    @idp = build :identity_provider

    @partner = build :partner
    @lending_partner = build :lending_partner
    @endorsing_partner = build :endorsing_partner

    @user = build :user, :merchant_new, partner: @partner

    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 200, body: scim_user(@user).to_json)
  end

  teardown do
    @service.clear
  end

  test '#idp_lookup raises error with idp offline' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ETIMEDOUT)
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .to_raise(Errno::ETIMEDOUT)

    assert_raises IdPService::ApiException do
      @service.identity_provider_lookup(@idp.id)
    end
  end

  test '#idp_lookup raises error with idp non-responsive' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ECONNREFUSED)
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .to_raise(Errno::ECONNREFUSED)

    assert_raises IdPService::ConnectionException do
      @service.identity_provider_lookup(@idp.id)
    end
  end

  test '#idp_lookup raises error when unauthorized' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_return(status: 401)
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .to_return(status: 401)

    assert_raises IdPService::ApiException do
      @service.identity_provider_lookup(@idp.id)
    end
  end

  test '#idp_lookup raises error when malformed json is returned' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: '{ invalid: json: invalid }')

    assert_raises IdPService::MalformedResponseException do
      @service.identity_provider_lookup(@idp.id)
    end
  end

  test '#idp_lookup returns nil when idp is not found' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 404)

    assert_nil @service.identity_provider_lookup(@idp.id)
  end

  test '#idp_lookup makes a remote call to idp' do
    stub_identity_provider_lookup_api
    @service.identity_provider_lookup(@idp.id)

    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}", times: 1
  end

  test '#idp_lookup uses idp:api token' do
    idp_api_token = SecureRandom.uuid
    TokenValidator::OauthTokenService.any_instance.stubs(:access_token).returns(token: idp_api_token)
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .with(
        headers: {
          authorization: "Bearer #{idp_api_token}"
        }
      )
      .to_return(status: 200, body: {
        id: @idp.id,
        name: @idp.name,
        subdomain: @idp.subdomain,
        vanity_url: @idp.vanity_url,
        created_at: @idp.created_at
      }.to_json)

    @service.identity_provider_lookup(@idp.id)

    assert_requested(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}") do |request|
      assert_equal "Bearer #{idp_api_token}", request.headers['Authorization']
    end
  end

  test '#idp_lookup caches result' do
    stub_identity_provider_lookup_api
    3.times { @service.identity_provider_lookup(@idp.id) }

    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}", times: 1
  end

  test '#idp_lookup returns valid hash' do
    stub_identity_provider_lookup_api
    assert_kind_of Hash, @service.identity_provider_lookup(@idp.id)
  end

  test '#partner_look returns hash with correct keys' do
    stub_identity_provider_lookup_api
    idp_info = @service.identity_provider_lookup(@idp.id)
    assert IdentityProvider.new(idp_info).valid?
  end

  test '#idp_lookup lookup of nil partner returns nil' do
    assert_nil @service.identity_provider_lookup(nil)
  end

  #
  # Tests for #get_user
  #
  test '#get_user raises a ConnectionException on connection timeout' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_raise(Errno::ETIMEDOUT)

    assert_raises IdPService::ConnectionException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises a ConnectionException on connection refused' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_raise(Errno::ECONNREFUSED)

    assert_raises IdPService::ConnectionException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises a ConnectionException on connection reset' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_raise(Errno::ECONNRESET)

    assert_raises IdPService::ConnectionException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user retries three times on connection exceptions' do
    number_of_attempts = 3

    Rails.configuration.stubs(:connection_error_retries).returns(number_of_attempts)

    stub_request(:get, scim_api_users_path(@user.uid)).to_raise(Errno::ETIMEDOUT)

    assert_raises IdPService::ConnectionException do
      @service.get_user(@partner, @user.uid)
    end

    assert_requested(:get, scim_api_users_path(@user.uid), times: number_of_attempts)
  end

  test '#get_user raises an ApiException on bad request' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 400)

    assert_raises IdPService::ApiException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises an ApiException on unauthorized' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 401)

    assert_raises IdPService::ApiException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises an ApiException on forbidden' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 403)

    assert_raises IdPService::ApiException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises an ApiException on not found' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 404)

    assert_raises IdPService::ApiException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises an ApiException on internal server error' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 500)

    assert_raises IdPService::ApiException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user raises an ApiException on service unavailable' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 503)

    assert_raises IdPService::ApiException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user invalid JSON response raises ApiException' do
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 200, body: "{\"id\":\"ip_#{SecureRandom.base58(16)}}notjson")

    assert_raises IdPService::MalformedResponseException do
      @service.get_user(@partner, @user.uid)
    end
  end

  test '#get_user sends the correct parameters' do
    @service.get_user(@partner, @user.uid)

    assert_requested(:get, scim_api_users_path(@user.uid)) do |request|
      Rack::Utils.parse_nested_query(request.body)['partner_guid'] == @partner.lender_partner_id
    end
  end

  test '#get_user sends the correct parameters when the partner is a lending partner' do
    @service.get_user(@lending_partner, @user.uid)

    assert_requested(:get, scim_api_users_path(@user.uid)) do |request|
      Rack::Utils.parse_nested_query(request.body)['partner_guid'] == @lending_partner.lender_partner_id
    end
  end

  test '#get_user sends the correct parameters when the partner is an endorsing partner' do
    @service.get_user(@endorsing_partner, @user.uid)

    assert_requested(:get, scim_api_users_path(@user.uid)) do |request|
      Rack::Utils.parse_nested_query(request.body)['partner_guid'] == @endorsing_partner.lender_partner_id
    end
  end

  test '#get_user returns a user' do
    user = @service.get_user(@partner, @user.uid)

    assert_equal @user.uid, user[:id]
    assert_equal @user.email, user[:userName]
    assert_equal @user.email, user[:emails].first[:value]
    assert_equal @user.enabled, user[:active]
    assert_equal @user.profile_info.first[:uid], user[scim_urn_ario_extension.to_sym][:profiles].first[:id]
    assert_equal @user.profile_info.first[:properties][:role].to_s, user[scim_urn_ario_extension.to_sym][:profiles].first[:role]
    assert_equal @user.profile_info.first[:properties][:partner].to_s,
                 user[scim_urn_ario_extension.to_sym][:profiles].first[:partner]
    assert_equal @user.profile_info.first[:properties][:merchant],
                 user[scim_urn_ario_extension.to_sym][:profiles].first[:merchant]
  end

  test '#get_user uses user token' do
    user_token = SecureRandom.base58(32)
    service = IdPService.new(user_token)

    service.get_user(@partner, @user.uid)

    assert_requested(:get, scim_api_users_path(@user.uid)) do |request|
      assert_equal "Bearer #{user_token}", request.headers['Authorization']
    end
  end

  test '#get_user uses idp:api token when user token flag is disabled' do
    Rails.configuration.stubs(:idp_user_token_enabled).returns(false)
    user_token = SecureRandom.base58(32)
    service = IdPService.new(user_token)
    idp_api_token = SecureRandom.uuid
    TokenValidator::OauthTokenService.any_instance.stubs(:access_token).returns(token: idp_api_token)

    service.get_user(@partner, @user.uid)

    assert_requested(:get, scim_api_users_path(@user.uid)) do |request|
      assert_equal "Bearer #{idp_api_token}", request.headers['Authorization']
    end
  end

  #
  # Tests for #update_user
  #
  test '#update_user raises a ConnectionException on connection timeout' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_raise(Errno::ETIMEDOUT)

    assert_raises IdPService::ConnectionException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises a ConnectionException on connection refused' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_raise(Errno::ECONNREFUSED)

    assert_raises IdPService::ConnectionException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises a ConnectionException on connection reset' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_raise(Errno::ECONNRESET)

    assert_raises IdPService::ConnectionException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises an ApiException on unauthorized' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 401)

    assert_raises IdPService::ApiException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises an ApiException on forbidden' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 403)

    assert_raises IdPService::ApiException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises an ApiException on not found' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 404)

    assert_raises IdPService::ApiException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises an ApiException on internal server error' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 500)

    assert_raises IdPService::ApiException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises an ApiException on service unavailable' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 503)

    assert_raises IdPService::ApiException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user raises an InvalidParameterException when no id is provided' do
    scim_user = scim_user(@user)
    scim_user.delete(:id)

    assert_raises IdPService::InvalidParameterException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user tries three times on connection error before raising a ConnectionException' do
    number_of_attempts = 3

    Rails.configuration.stubs(:connection_error_retries).returns(number_of_attempts)

    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id])).to_raise(Errno::ETIMEDOUT)

    assert_raises IdPService::ConnectionException do
      @service.update_user(@partner, scim_user)
    end

    assert_requested(:put, scim_api_users_path(scim_user[:id]), times: number_of_attempts)
  end

  test '#update_user makes a request to IdP with the correct parameters (no phone, no profiles)' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    scim_user.delete(:phone_number)
    scim_user.delete(:profiles)

    @service.update_user(@partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      scim_entity = Rack::Utils.parse_nested_query(request.body)

      scim_entity['partner_guid'] == @partner.lender_partner_id && scim_entity['userName'] == scim_user[:userName] &&
        scim_entity['name']['formatted'] == scim_user[:name][:formatted] && scim_entity['emails'].first['value'] == scim_user[:emails].first[:value] &&
        scim_entity['active'] == scim_user[:active].to_s
    end
  end

  test '#update_user makes a request to IdP with the correct partner guid (lending partner)' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    @service.update_user(@lending_partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      scim_entity = Rack::Utils.parse_nested_query(request.body)
      scim_entity['partner_guid'] == @lending_partner.lender_partner_id
    end
  end

  test '#update_user makes a request to IdP with the correct partner guid (endorsing partner)' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    @service.update_user(@endorsing_partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      scim_entity = Rack::Utils.parse_nested_query(request.body)
      scim_entity['partner_guid'] == @endorsing_partner.lender_partner_id
    end
  end

  test '#update_user makes a request to IdP with the correct parameters (with profiles)' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    scim_user.delete(:phone_number)

    @service.update_user(@partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      scim_entity = Rack::Utils.parse_nested_query(request.body)

      scim_entity['partner_guid'] == @partner.lender_partner_id && scim_entity['userName'] == scim_user[:userName] &&
        scim_entity['name']['formatted'] == scim_user[:name][:formatted] && scim_entity['emails'].first['value'] == scim_user[:emails].first[:value] &&
        scim_entity['active'] == scim_user[:active].to_s && scim_entity['profiles'].count == scim_user[:profiles].count
    end
  end

  test '#update_user makes a request to IdP with the correct parameters (with phone)' do
    scim_user = scim_user(@user)
    scim_user[:phoneNumbers] = [
      {
        value: "613#{Array.new(7) { rand(2..9) }.join}"
      }
    ]

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    scim_user.delete(:profiles)

    @service.update_user(@partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      scim_entity = Rack::Utils.parse_nested_query(request.body)

      scim_entity['partner_guid'] == @partner.lender_partner_id && scim_entity['userName'] == scim_user[:userName] &&
        scim_entity['name']['formatted'] == scim_user[:name][:formatted] && scim_entity['emails'].first['value'] == scim_user[:emails].first[:value] &&
        scim_entity['active'] == scim_user[:active].to_s && scim_entity['phoneNumbers'].first['value'] == scim_user[:phoneNumbers].first[:value]
    end
  end

  test '#update_user invalid JSON response raises ApiException' do
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: "{\"id\":\"ip_#{SecureRandom.base58(16)}}notjson")

    assert_raises IdPService::MalformedResponseException do
      @service.update_user(@partner, scim_user)
    end
  end

  test '#update_user uses user token' do
    user_token = SecureRandom.base58(32)
    service = IdPService.new(user_token)
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    service.update_user(@partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      assert_equal "Bearer #{user_token}", request.headers['Authorization']
    end
  end

  test '#update_user uses idp:api token when user token flag is disabled' do
    Rails.configuration.stubs(:idp_user_token_enabled).returns(false)
    user_token = SecureRandom.base58(32)
    service = IdPService.new(user_token)
    idp_api_token = SecureRandom.uuid
    TokenValidator::OauthTokenService.any_instance.stubs(:access_token).returns(token: idp_api_token)
    scim_user = scim_user(@user)

    stub_request(:put, scim_api_users_path(scim_user[:id]))
      .to_return(status: 200, body: scim_user.to_json)

    service.update_user(@partner, scim_user)

    assert_requested(:put, scim_api_users_path(scim_user[:id])) do |request|
      assert_equal "Bearer #{idp_api_token}", request.headers['Authorization']
    end
  end

  private

  def stub_identity_provider_lookup_api
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: {
        id: @idp.id,
        name: @idp.name,
        subdomain: @idp.subdomain,
        vanity_url: @idp.vanity_url,
        created_at: @idp.created_at
      }.to_json)
  end

  def stub_oauth_token_request
    access_token = SecureRandom.hex(32)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(
        body: {
          client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
          client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
          grant_type: 'client_credentials',
          scope: Rails.application.secrets.idp_api[:credentials][:scope]
        }
      )
      .to_return(
        status: 200,
        body: {
          access_token: access_token,
          token_type: :bearer,
          expires_in: 1800,
          refresh_token: '',
          scope: Rails.application.secrets.idp_api[:credentials][:scope]
        }.to_json
      )
    access_token
  end
end
