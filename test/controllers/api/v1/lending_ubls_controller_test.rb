# frozen_string_literal: true

require 'test_helper'

class Api::V1::LendingUblsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'should fail get_ubls when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_lending_ubls_url, as: :json
    assert_response :unauthorized
  end

  test 'should fail get_lending_ubl when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get lending_ubl_path, as: :json
    assert_response :unauthorized
  end

  test 'get_ubls api request returns unauthorized when user is not signed in' do
    SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).returns([{}])
    get api_v1_lending_ubls_url, as: :json
    assert_response :unauthorized
  end

  test 'get_lending_ubl api request returns unauthorized when user is not signed in' do
    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).returns([{}])
    get lending_ubl_path, as: :json
    assert_response :unauthorized
  end

  # AS MERCHANT ADMIN

  test 'should return success when api request for get_ubls as merchant_admin is success' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).returns({})
    get api_v1_lending_ubls_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_ubls as a merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).raises(e)
      get api_v1_lending_ubls_url, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_ubl as merchant_admin is success' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).returns({})
    get lending_ubl_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_ubl as a merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).raises(e)
      get lending_ubl_path, as: :json
      assert_response http_code
    end
  end

  # AS MERCHANT NEW

  test 'should return success when api request for get_ubls as merchant_new is success' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).returns({})
    get api_v1_lending_ubls_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_ubls as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).raises(e)
      get api_v1_lending_ubls_url, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_ubl as merchant_new is success' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).returns({})
    get lending_ubl_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_ubl as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).raises(e)
      get lending_ubl_path, as: :json
      assert_response http_code
    end
  end

  # IN DELEGATED ACCESS

  test 'should return success when api request for get_ubls as delegated_access is success' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).returns({})
    get api_v1_lending_ubls_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_ubls as a delegated_access' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_ubls).raises(e)
      get api_v1_lending_ubls_url, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_ubl as delegated_access is success' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).returns({})
    get lending_ubl_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_ubl as a delegated_access' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl).raises(e)
      get lending_ubl_path, as: :json
      assert_response http_code
    end
  end

  def lending_ubl_path
    "/api/v1/lending_ubls/get_ubl/#{SecureRandom.base58(16)}"
  end
end
