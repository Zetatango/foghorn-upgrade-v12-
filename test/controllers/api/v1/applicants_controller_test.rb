# frozen_string_literal: true

require 'test_helper'

class Api::V1::ApplicantsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'should fail init_authenticate when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post applicants_path, as: :json
    assert_response :unauthorized
  end

  test 'should fail authenticate when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    put applicants_path, as: :json
    assert_response :unauthorized
  end

  test 'init_authenticate api request returns unauthorized when user is not signed in' do
    SwaggerClient::ApplicantsApi.any_instance.stubs(:initiate_applicant_authentication).returns([{}])
    post applicants_path, as: :json
    assert_response :unauthorized
  end

  test 'authenticate api request returns unauthorized when user is not signed in' do
    SwaggerClient::ApplicantsApi.any_instance.stubs(:complete_applicant_authentication).returns([{}])
    put applicants_path, as: :json
    assert_response :unauthorized
  end

  # AS MERCHANT ADMIN

  test 'should return unauthorized when api request for init_authenticate as merchant_admin' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::ApplicantsApi.any_instance.stubs(:initiate_applicant_authentication).returns({})
    post applicants_path, as: :json
    assert_response :unauthorized
  end

  test 'should return unauthorized when api request for authenticate as merchant_admin' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::ApplicantsApi.any_instance.stubs(:complete_applicant_authentication).returns({})
    put applicants_path, as: :json
    assert_response :unauthorized
  end

  # AS MERCHANT NEW

  test 'should return success when api request for init_authenticate as merchant_new is success' do
    sign_in_user @merchant_new
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::ApplicantsApi.any_instance.stubs(:initiate_applicant_authentication).returns({})
    post applicants_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling init_authenticate as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      exc = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::ApplicantsApi.any_instance.stubs(:initiate_applicant_authentication).raises(exc)
      post applicants_path, as: :json
      assert_response http_code
    end
  end

  test 'should return success when api request for authenticate as merchant_new is success' do
    sign_in_user @merchant_new
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::ApplicantsApi.any_instance.stubs(:complete_applicant_authentication).returns({})
    put applicants_path, as: :json
    assert_response :ok
  end

  test 'should forward http error codes properly when calling authenticate as a merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      exc = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::ApplicantsApi.any_instance.stubs(:complete_applicant_authentication).raises(exc)
      put applicants_path, as: :json
      assert_response http_code
    end
  end

  # IN DELEGATED ACCESS

  test 'should return unauthorized when api request for init_authenticate as delegated_access' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::ApplicantsApi.any_instance.stubs(:initiate_applicant_authentication).returns({})
    post applicants_path, as: :json
    assert_response :unauthorized
  end

  test 'should return unauthorized when api request for authenticate as delegated_access' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::ApplicantsApi.any_instance.stubs(:complete_applicant_authentication).returns({})
    put applicants_path, as: :json
    assert_response :unauthorized
  end

  def applicants_path
    "/api/v1/applicants/#{SecureRandom.base58(16)}/authenticate"
  end
end
