# frozen_string_literal: true

require 'test_helper'
require 'ztt_client'

class JwtControllerTest < ActionDispatch::IntegrationTest
  def setup
    @delegated_access_token = SecureRandom.base58(32)
    @idp_access_token = SecureRandom.base58(32)
    @api_access_token = SecureRandom.base58(32)

    stub_user_state

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 200, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)
  end

  def stub_user_state
    ApplicationController.any_instance.stubs(:current_user).returns(nil)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(false)
    ApplicationController.any_instance.stubs(:redirected_user_signed_in?).returns(true)
  end

  test 'with empty access token returns unprocessable_entity' do
    get generate_jwt_path('')
    assert_response :bad_request
  end

  test 'with token redirects to root' do
    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
  end

  test 'with token sets session header' do
    get generate_jwt_path(@delegated_access_token)
    assert_equal @api_access_token, session[:api_access_token]
  end

  test 'with nil access token renders error' do
    ApiAccessTokenService.any_instance.stubs(:api_access_token).returns(nil)
    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end
end
