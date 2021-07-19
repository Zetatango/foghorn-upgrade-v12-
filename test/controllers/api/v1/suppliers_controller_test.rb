# frozen_string_literal: true

require 'test_helper'

class Api::V1::SuppliersControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'fail when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_suppliers_url, as: :json

    assert_response :unauthorized
  end

  test 'get all suppliers for merchant admins' do
    stub_user_state(@merchant_admin)

    SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).returns([{}])
    get api_v1_suppliers_url, as: :json

    assert_response :ok
  end

  test 'get all suppliers for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).returns([{}])
    get api_v1_suppliers_url, as: :json

    assert_response :ok
  end

  test 'api request returns unauthorized when user is not signed in' do
    SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).returns([{}])
    get api_v1_suppliers_path, as: :json

    assert_response :unauthorized
  end

  test 'get all suppliers when merchant new is signed in' do
    sign_in_user @merchant_new

    SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).returns([{}])
    get api_v1_suppliers_path, as: :json

    assert_response :ok
  end

  test 'fail to get all suppliers as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).raises(e)
      get api_v1_suppliers_url, as: :json
      assert_response http_code
    end
  end

  test 'fail to get all suppliers as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).raises(e)
      get api_v1_suppliers_url, as: :json
      assert_response http_code
    end
  end

  test 'get suppliers for merchant admins' do
    stub_user_state(@merchant_admin)

    SwaggerClient::SuppliersApi.any_instance.stubs(:get_list_of_suppliers).returns({})
    get api_v1_suppliers_path, as: :json
    assert_response :ok
  end
end
