# frozen_string_literal: true

require 'test_helper'

class Api::V1::LendingRepaymentsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'unauthorized access when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_lending_repayments_url, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for GET repayments when user is not signed in' do
    get api_v1_lending_repayments_url, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for GET show repayment when user is not signed in' do
    get lending_repayment_path, as: :json
    assert_response :unauthorized
  end

  # delegated access users

  test 'GET all lending repayments for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_repayments).returns([{}])
    get api_v1_lending_repayments_url, as: :json
    assert_response :ok
  end

  test 'GET lending repayment for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl_repayment).returns({})
    get lending_repayment_path, as: :json
    assert_response :ok
  end

  test 'fail to GET all lending repayments as delegated access user' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_repayments).raises(e)
      get api_v1_lending_repayments_url, as: :json
      assert_response http_code
    end
  end

  test 'fail on getting lending repayment as delegated access user' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl_repayment).raises(e)
      get lending_repayment_path, as: :json
      assert_response http_code
    end
  end

  # merchant_admin
  test 'GET all lending repayments as merchant_admin' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_repayments).returns([{}])
    get api_v1_lending_repayments_url, as: :json
    assert_response :ok
  end

  test 'GET lending repayment as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl_repayment).returns({})
    get lending_repayment_path, as: :json
    assert_response :ok
  end

  test 'fail to GET all lending repayments as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_repayments).raises(e)
      get api_v1_lending_repayments_url, as: :json
      assert_response http_code
    end
  end

  test 'fail on getting lending repayment as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl_repayment).raises(e)
      get lending_repayment_path, as: :json
      assert_response http_code
    end
  end

  # merchant_new

  test 'GET all lending repayments as merchant_new ' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_repayments).returns([{}])
    get api_v1_lending_repayments_url, as: :json
    assert_response :ok
  end

  test 'GET lending repayment as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl_repayment).returns({})
    get lending_repayment_path, as: :json
    assert_response :ok
  end

  test 'fail to GET all lending repayments as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_repayments).raises(e)
      get api_v1_lending_repayments_url, as: :json
      assert_response http_code
    end
  end

  test 'fail on getting lending repayment as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_ubl_repayment).raises(e)
      get lending_repayment_path, as: :json
      assert_response http_code
    end
  end

  private

  def lending_repayment_path
    "#{api_v1_lending_repayments_path}/#{SecureRandom.base58(16)}"
  end
end
