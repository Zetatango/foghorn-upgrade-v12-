# frozen_string_literal: true

require 'test_helper'

class Api::V1::LendingApplicationsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'unauthorized access when access token missing' do
    stub_user_state(@merchant_admin)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_lending_applications_url, as: :json
    assert_response :unauthorized
  end

  # Unauthorized Users

  test 'unauthorized access for GET applications when user is not signed in' do
    get api_v1_lending_applications_url, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for GET show application when user is not signed in' do
    get lending_application_path, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for POST new application when user is not signed in' do
    post api_v1_lending_applications_url, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for GET application agreement pad when user is not signed in' do
    get lending_application_pad_agreement_path, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for GET application terms when user is not signed in' do
    get lending_application_terms_path, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for PUT accepting application when user is not signed in' do
    put lending_application_accept_path, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for PUT cancelling application when user is not signed in' do
    put lending_application_cancel_path, as: :json
    assert_response :unauthorized
  end

  # Delegated Access Users: delegated_mode

  test 'GET all lending applications for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_applications).returns([{}])
    get api_v1_lending_applications_url, as: :json
    assert_response :ok
  end

  test 'GET lending application for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_application).returns({})
    get lending_application_path, as: :json
    assert_response :ok
  end

  test 'unauthorized access to POST create new application for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    post api_v1_lending_applications_url, as: :json
    assert_response :unauthorized
  end

  test 'GET lending application terms for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_campaign_terms).returns({})
    get lending_application_terms_path, as: :json
    assert_response :ok
  end

  test 'GET lending application pad agreements for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:get_pad_agreement).returns({})
    get lending_application_pad_agreement_path, as: :json
    assert_response :ok
  end

  test 'unauthorized access to PUT accept lending application for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:accept_application).returns({})
    put lending_application_accept_path, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access to PUT cancel lending application for delegated access users' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    SwaggerClient::LendingApi.any_instance.stubs(:cancel_application).returns({})
    put lending_application_cancel_path, as: :json
    assert_response :unauthorized
  end

  # Merchant Admin Users: merchant_admin

  test 'GET all lending applications as merchant_admin' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:get_applications).returns([{}])
    get api_v1_lending_applications_url, as: :json
    assert_response :ok
  end

  test 'GET lending application as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:get_application).returns({})
    get lending_application_path, as: :json
    assert_response :ok
  end

  test 'POST request success for creating new application as merchant_admin' do
    stub_user_state(@merchant_admin)
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:create_application).returns({})
    post api_v1_lending_applications_url, as: :json
    assert_response :ok
  end

  test 'GET lending application terms as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:get_campaign_terms).returns({})
    get lending_application_terms_path, as: :json
    assert_response :ok
  end

  test 'GET lending application pad agreements as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:get_pad_agreement).returns({})
    get lending_application_pad_agreement_path, as: :json
    assert_response :ok
  end

  test 'PUT accept lending application as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:accept_application).returns(id: 'application_id')
    put lending_application_accept_path, as: :json
    assert_response :ok
  end

  test 'error on PUT accept lending application as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:accept_application).returns({})
    put lending_application_accept_path, as: :json
    assert_response :unprocessable_entity
  end

  test 'PUT cancel lending application as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:cancel_application).returns(id: 'application_id')
    put lending_application_cancel_path, as: :json
    assert_response :ok
  end

  test 'error on PUT cancel lending application as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:cancel_application).returns({})
    put lending_application_cancel_path, as: :json
    assert_response :unprocessable_entity
  end

  test 'fail to GET all lending applications as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_applications).raises(e)
      get api_v1_lending_applications_url, as: :json
      assert_response http_code
    end
  end

  test 'fail to GET lending application as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_application).raises(e)
      get lending_application_path, as: :json
      assert_response http_code
    end
  end

  test 'fail to POST new application as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      @merchant_admin.selected_profile = @merchant_admin_p_guid

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:create_application).raises(e)
      post api_v1_lending_applications_url, as: :json
      assert_response http_code
    end
  end

  test 'fail to GET lending application terms as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_campaign_terms).raises(e)
      get lending_application_terms_path, as: :json
      assert_response http_code
    end
  end

  test 'fail to GET lending application pad agreements as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_pad_agreement).raises(e)
      get lending_application_pad_agreement_path, as: :json
      assert_response http_code
    end
  end

  test 'fail to PUT accept lending application as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:accept_application).raises(e)
      put lending_application_accept_path, as: :json
      assert_response http_code
    end
  end

  test 'fail to PUT cancel lending application as merchant_admin' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:cancel_application).raises(e)
      put lending_application_cancel_path, as: :json
      assert_response http_code
    end
  end

  # Merchant New Users: merchant_new

  test 'GET all lending applications as merchant_new ' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_applications).returns([{}])
    get api_v1_lending_applications_url, as: :json
    assert_response :ok
  end

  test 'GET lending application as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_application).returns({})
    get lending_application_path, as: :json
    assert_response :ok
  end

  test 'POST create new application as merchant_new' do
    sign_in_user @merchant_new
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    SwaggerClient::LendingApi.any_instance.stubs(:create_application).returns({})
    post api_v1_lending_applications_url, as: :json
    assert_response :ok
  end

  test 'GET lending applications terms as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_campaign_terms).returns({})
    get lending_application_terms_path, as: :json
    assert_response :ok
  end

  test 'GET lending applications pad agreement as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:get_pad_agreement).returns({})
    get lending_application_pad_agreement_path, as: :json
    assert_response :ok
  end

  test 'authorized access to PUT accept application as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:accept_application).returns(something: 'something')
    put lending_application_accept_path, as: :json
    # assert_response :unauthorized # TODO: This need to be reverted once abilities are cleaned-up.
    assert_response :ok
  end

  test 'unauthorized access to PUT cancel application as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:cancel_application).returns(something: 'something')
    put lending_application_cancel_path, as: :json
    # assert_response :unauthorized # TODO: This need to be reverted once abilities are cleaned-up.
    assert_response :ok
  end

  test 'fail to GET all lending applications as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_applications).raises(e)
      get api_v1_lending_applications_url, as: :json
      assert_response http_code
    end
  end

  test 'fail on getting lending application as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_application).raises(e)
      get lending_application_path, as: :json
      assert_response http_code
    end
  end

  test 'fail to POST new application as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:create_application).raises(e)
      post api_v1_lending_applications_url, as: :json
      assert_response http_code
    end
  end

  test 'fail to GET lending application terms as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_campaign_terms).raises(e)
      get lending_application_terms_path, as: :json
      assert_response http_code
    end
  end

  test 'fail to GET lending application pad agreements as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:get_pad_agreement).raises(e)
      get lending_application_pad_agreement_path, as: :json
      assert_response http_code
    end
  end

  test 'authorized access to GET application fee as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_application).returns(fee: 100.00)
    get lending_application_fee_path, params: { principal_amount: 1000.00, loan_term_id: 'pt_123' }, as: :json
    assert_response :ok
    assert_equal 100.00, JSON.parse(response.body)['data']['fee']
  end

  test 'fail to get lending application fee as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:fee_for_lending_application).raises(e)
      get lending_application_fee_path, params: { principal_amount: 1000.00, loan_term_id: 'pt_123' }, as: :json
      assert_response http_code
    end
  end

  test 'authorized access to PUT amend application as merchant_new' do
    sign_in_user @merchant_new

    SwaggerClient::LendingApi.any_instance.stubs(:amend_application).returns(something: 'something')
    put lending_application_amend_path, params: { principal_amount: 1000.00, loan_term_id: 'pt_123' }, as: :json
    assert_response :ok
  end

  test 'fail to put lending application amend as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::LendingApi.any_instance.stubs(:amend_application).raises(e)
      put lending_application_amend_path, params: { principal_amount: 1000.00, loan_term_id: 'pt_123' }, as: :json
      assert_response http_code
    end
  end

  test 'error on PUT amend lending application as merchant_admin' do
    stub_user_state(@merchant_admin)

    SwaggerClient::LendingApi.any_instance.stubs(:amend_application).returns({})
    put lending_application_amend_path, params: { principal_amount: 1000.00, loan_term_id: 'pt_123' }, as: :json
    assert_response :unprocessable_entity
  end

  private

  def lending_application_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}"
  end

  def lending_application_terms_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}/terms"
  end

  def lending_application_pad_agreement_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}/pad_agreement"
  end

  def lending_application_fee_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}/fee"
  end

  def lending_application_accept_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}/accept"
  end

  def lending_application_amend_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}/amend"
  end

  def lending_application_cancel_path
    "#{api_v1_lending_applications_path}/#{SecureRandom.base58(16)}/cancel"
  end
end
