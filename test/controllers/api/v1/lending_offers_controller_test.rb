# frozen_string_literal: true

require 'test_helper'

class Api::V1::LendingOffersControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'should fail get_offers when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_get_merchant_offers_url, as: :json
    assert_response :unauthorized
  end

  test 'should fail get_lending_offer when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get lending_offer_path, as: :json
    assert_response :unauthorized
  end

  test 'should fail getOfferFee when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_lending_offers_fee_url, as: :json
    assert_response :unauthorized
  end

  test 'get_offers api request returns unauthorized when user is not signed in' do
    SwaggerClient::LendingApi.any_instance.stubs(:get_offers).returns([{}])
    get api_v1_get_merchant_offers_path, as: :json
    assert_response :unauthorized
  end

  test 'show_offers api request returns unauthorized when user is not signed in' do
    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns([{}])
    get lending_offer_path, as: :json
    assert_response :unauthorized
  end

  test 'get_offer_fee api request returns unauthorized when user is not signed in' do
    SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).returns([{}])
    get api_v1_lending_offers_fee_url, as: :json
    assert_response :unauthorized
  end

  # AS MERCHANT NEW

  test 'should return success when api request for get_offers as merchant_new is success' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_offers).returns({})
    get api_v1_get_merchant_offers_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_offers as a merchant_new' do
    [404, 401, 417, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_offers).raises(e)
      get api_v1_get_merchant_offers_url, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_offer as merchant_new is success' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns({})
    get lending_offer_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_offer as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).raises(e)
      get lending_offer_path, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_offer with supplier ID as merchant_new is success' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns({})
    get lending_offer_path('supplier_id=su_123'), as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_offer with supplier ID as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).raises(e)
      get lending_offer_path('supplier_id=su_123'), as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for getOfferFee as merchant_new is success' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).returns({})
    get api_v1_lending_offers_fee_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_offer_fee as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).raises(e)
      get api_v1_lending_offers_fee_url, as: :json
      assert_response http_code
    end
  end

  # AS MERCHANT ADMIN

  test 'should return success when api request for get_offers as merchant_admin is success' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_offers).returns({})
    get api_v1_get_merchant_offers_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_offers as a merchant_admin' do
    [404, 401, 417, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_offers).raises(e)
      get api_v1_get_merchant_offers_url, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_offer as merchant_admin is success' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns({})
    get lending_offer_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_offer as a merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).raises(e)
      get lending_offer_path, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_offer with supplier ID as merchant_admin is success' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns({})
    get lending_offer_path('supplier_id=su_123'), as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_offer with supplier ID as a merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).raises(e)
      get lending_offer_path('supplier_id=su_123'), as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for getOfferFee as merchant_admin is success' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).returns({})
    get api_v1_lending_offers_fee_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_offer_fee as a merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).raises(e)
      get api_v1_lending_offers_fee_url, as: :json
      assert_response http_code
    end
  end

  # IN DELEGATED ACCESS

  test 'should return success when api request for get_offers as delegated_access is success' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_offers).returns({})
    get api_v1_get_merchant_offers_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_offers as a delegated_access' do
    [404, 401, 417, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_offers).raises(e)
      get api_v1_get_merchant_offers_url, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_offer as delegated_access is success' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns({})
    get lending_offer_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_offer as a delegated_access' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).raises(e)
      get lending_offer_path, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for get_lending_offer with supplier ID as delegated_access is success' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).returns({})
    get lending_offer_path('supplier_id=su_123'), as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_offer with supplier ID as a delegated_access' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_lending_offer).raises(e)
      get lending_offer_path('supplier_id=su_123'), as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for getOfferFee as delegated_access is success' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).returns({})
    get api_v1_lending_offers_fee_url, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_offer_fee as a delegated_access' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_offer).raises(e)
      get api_v1_lending_offers_fee_url, as: :json
      assert_response http_code
    end
  end

  def lending_offer_path(query_params = nil)
    path = '/api/v1/lending_offers/get_offer/someId'
    path += "?#{query_params}" unless query_params.blank?

    path
  end
end
