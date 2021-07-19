# frozen_string_literal: true

require 'test_helper'

class Api::V1::SocialConnectionsControllerTest < ActionDispatch::IntegrationTest
  include SocialConnectionsHelper

  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  #
  # GET /api/v1/social_connections
  #
  test 'GET /api/v1/social_connections should return unauthorized when access token missing' do
    sign_in_user @merchant_new

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get social_connections_api_path, as: :json

    assert_response :unauthorized
  end

  test 'GET /api/v1/social_connections should return ok' do
    SwaggerClient::SocialConnectionsApi.any_instance.stubs(:get_social_connections).returns({})

    sign_in_user @merchant_new

    get social_connections_api_path

    assert_response :ok
  end

  test 'GET /api/v1/social_connections should pass down http errors if failed to list transactions' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::SocialConnectionsApi.any_instance.stubs(:get_social_connections).raises(e)

      get social_connections_api_path, params: { offset: 0, limit: 10 }

      assert_response http_code
    end
  end

  #
  # DELETE /api/v1/social_connections/facebook
  #
  test 'DELETE /api/v1/social_connections/facebook should return unauthorized when access token missing' do
    sign_in_user @merchant_new

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    delete social_connections_api_path(:facebook), as: :json

    assert_response :unauthorized
  end

  test 'DELETE /api/v1/social_connections/facebook should return ok' do
    SwaggerClient::SocialConnectionsApi.any_instance.stubs(:delete_facebook_social_connection).returns({})

    sign_in_user @merchant_new

    delete social_connections_api_path(:facebook)

    assert_response :ok
  end

  test 'DELETE /api/v1/social_connections/facebook should pass down http errors if failed to list transactions' do
    [400, 401, 404, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::SocialConnectionsApi.any_instance.stubs(:delete_facebook_social_connection).raises(e)

      delete social_connections_api_path(:facebook), params: { offset: 0, limit: 10 }

      assert_response http_code
    end
  end
end
