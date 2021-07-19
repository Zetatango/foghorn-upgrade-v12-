# frozen_string_literal: true

require 'test_helper'

class Api::V1::MerchantsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)
    stub_load_scss_variables

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  def api_pad_agreement_path
    '/api/v1/pad_agreement/app-id'
  end

  #
  # Describe GET /api/v1/merchants
  #
  test 'should fail when access token missing' do
    stub_user_state(@merchant_admin)

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_merchants_path, as: :json
    assert_response :unauthorized
  end

  test 'api request for merchants without being logged in redirects to root' do
    get api_v1_merchants_path, as: :json
    assert_response :unauthorized
  end

  test 'api request for merchants with merchant admin is successful' do
    stub_user_state(@merchant_admin)
    mock_merchant

    get api_v1_merchants_path
    assert_response :ok
  end

  test 'api request for merchants with merchant new user is successful' do
    stub_user_state(@merchant_new)
    mock_merchant

    get api_v1_merchants_path
    assert_response :ok
  end

  test 'api request for merchants with delegated access user is successful' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)
    mock_merchant

    get api_v1_merchants_path
    assert_response :ok
  end

  test 'should forward http error codes properly when calling get_lending_ubl as a delegated_access' do
    stub_user_state(@merchant_admin)
    [404, 401, 422, 500].each do |http_code|
      mock_merchant_error(http_code)
      get api_v1_merchants_path
      assert_response http_code
    end
  end

  #
  # Describe GET /api/v1/merchants/bundle
  #
  test 'bundle - should fail when access token missing' do
    stub_user_state(@merchant_admin)

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get bundle_api_v1_merchants_path, as: :json
    assert_response :unauthorized
  end

  test 'bundle - api request for merchants without being logged in redirects to root' do
    get bundle_api_v1_merchants_path, as: :json
    assert_response :unauthorized
  end

  test 'api request for merchants bundle with merchant admin is successful' do
    stub_user_state(@merchant_admin)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)

    get bundle_api_v1_merchants_path
    assert_response :ok
  end

  test 'api request for merchants bundle with merchant new user is successful' do
    stub_user_state(@merchant_new)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)

    get bundle_api_v1_merchants_path
    assert_response :ok
  end

  test 'api request for merchants bundle with delegated access user is successful' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)

    get bundle_api_v1_merchants_path
    assert_response :ok
  end

  test 'api request for merchants bundle when receiving code 0' do
    stub_user_state(@merchant_admin)

    mock_responses(0)
    get bundle_api_v1_merchants_path
    assert_response :service_unavailable
  end

  test 'api request for merchants bundle when receiving code 404' do
    stub_user_state(@merchant_admin)

    mock_responses(404)
    get bundle_api_v1_merchants_path
    assert_response :not_found
  end

  test 'api request for merchants bundle when receiving unknown error' do
    stub_user_state(@merchant_admin)

    mock_responses(401)
    get bundle_api_v1_merchants_path
    assert_response :unauthorized
  end

  #
  # Describe GET /api/v1/pad_agreement/
  #
  test 'api request with merchant admin for pad agreement when application is good' do
    stub_user_state(@merchant_admin)

    mock_merchant
    SwaggerClient::FinancingApi.any_instance.stubs(:get_pad_agreement).returns(pad_agreement)
    get api_pad_agreement_path
    assert_response :ok
  end

  test 'api request for delegated access user for pad agreement when application is good' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_pad_agreement).returns(pad_agreement)
    get api_pad_agreement_path
    assert_response :ok
  end

  test 'api request for pad agreement when application is bad' do
    stub_user_state(@merchant_admin)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::FinancingApi.any_instance.stubs(:get_pad_agreement).raises(e)
    get api_pad_agreement_path
    assert_response :not_found
  end

  #
  # Describe GET /api/v1/bank_account
  #
  # merchant new
  test 'the get request for getting a bank account as merchant_new' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::CommonApi.any_instance.stubs(:get_bank_account).returns(bank_accounts)

    get "#{api_v1_bank_accounts_path}/#{SecureRandom.base58(16)}"
    assert_response :ok
  end

  test 'passes down http errors if failed to get a bank account as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_new)
      mock_merchant
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::CommonApi.any_instance.stubs(:get_bank_account).raises(e)

      get "#{api_v1_bank_accounts_path}/#{SecureRandom.base58(16)}"
      assert_response http_code
    end
  end

  #
  # Describe GET /api/v1/bank_accounts
  #
  test 'api request for bank accounts when request is good' do
    sign_in_user @merchant_new

    mock_merchant
    SwaggerClient::CommonApi.any_instance.stubs(:get_bank_accounts).returns(bank_accounts)
    get api_v1_bank_accounts_path
    assert_response :ok
  end

  test 'api request for bank accounts with source param' do
    sign_in_user @merchant_new

    mock_merchant
    SwaggerClient::CommonApi.any_instance.stubs(:get_bank_accounts).returns(bank_accounts)
    get api_v1_bank_accounts_path('flinks')
    assert_response :ok
  end

  test 'api request for bank accounts when response is bad' do
    sign_in_user @merchant_new

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::CommonApi.any_instance.stubs(:get_bank_accounts).raises(e)
    get api_v1_bank_accounts_path
    assert_response :not_found
  end

  test 'api request for bank accounts when response is 404 logs a message' do
    sign_in_user @merchant_new

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": "unable to deal with this", "code": "20101"}')
    SwaggerClient::CommonApi.any_instance.stubs(:get_bank_accounts).raises(e)
    assert_logs(:warn, 'original exception msg: unable to deal with this status: 404 code: 20101') do
      get api_v1_bank_accounts_path
    end
    assert_response :not_found
  end

  #
  # Describe POST /api/v1/bank_account
  #
  # merchant new
  test 'the post request for creating new bank account as merchant_new' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_create_bank_account).returns(bank_accounts)

    post api_v1_bank_account_path
    assert_response :ok
  end

  test 'passes down http errors if failed to create bank account as merchant_new' do
    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_new)
      mock_merchant
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_create_bank_account).raises(e)

      post api_v1_bank_account_path, as: :json
      assert_response http_code
    end
  end

  #
  # Describe POST /api/v1/select_bank_account
  #
  # merchand_new
  test 'select bank account as merchant_new ' do
    stub_user_state(@merchant_new)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_select_bank_account).returns(bank_accounts)
    post api_v1_select_bank_account_path
    assert_response :ok
  end

  test 'passes down http errors if failed to select bank account as merchant_new' do
    stub_user_state(@merchant_new)

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_select_bank_account).raises(e)
    post api_v1_select_bank_account_path
    assert_response :not_found
  end

  # merchand_admin
  test 'select bank account as merchant_admin ' do
    stub_user_state(@merchant_admin)

    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_select_bank_account).returns(bank_accounts)
    post api_v1_select_bank_account_path
    assert_response :ok
  end

  test 'passes down http errors if failed to select bank account as merchant_admin' do
    stub_user_state(@merchant_admin)

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_select_bank_account).raises(e)
    post api_v1_select_bank_account_path
    assert_response :not_found
  end

  # delegated_access_mode
  test 'unauthorized to select bank account as delegated_access_mode' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_select_bank_account).returns(bank_accounts)
    post api_v1_select_bank_account_path, as: :json
    assert_response :unauthorized
  end

  #
  # Describe POST /api/v1/select_sales_volume_accounts
  #
  # merchant_new
  test 'select sales volume accounts as merchant_new ' do
    stub_user_state(@merchant_new)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_sales_volume_accounts).returns(good_merchant)
    post api_v1_select_sales_volume_accounts_path
    assert_response :ok
  end

  test 'passes down http errors if failed to select sales volume accounts as merchant_new' do
    stub_user_state(@merchant_new)

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_sales_volume_accounts).raises(e)
    post api_v1_select_sales_volume_accounts_path
    assert_response :not_found
  end

  # merchand_admin
  test 'select sales volume accounts as merchant_admin ' do
    stub_user_state(@merchant_admin)

    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_sales_volume_accounts).returns(bank_accounts)
    post api_v1_select_sales_volume_accounts_path
    assert_response :ok
  end

  test 'passes down http errors if failed to select sales volume accounts as merchant_admin' do
    stub_user_state(@merchant_admin)

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_sales_volume_accounts).raises(e)
    post api_v1_select_sales_volume_accounts_path
    assert_response :not_found
  end

  # delegated_access_mode
  test 'unauthorized to select sales volume accounts as delegated_access_mode' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_sales_volume_accounts).returns(bank_accounts)
    post api_v1_select_sales_volume_accounts_path, as: :json
    assert_response :unauthorized
  end

  #
  # Describe POST /api/v1/select_insights_bank_accounts
  #
  # merchant_new
  test 'select insights bank accounts as merchant_new ' do
    stub_user_state(@merchant_new)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_insights_bank_accounts).returns(bank_accounts)
    post api_v1_select_insights_bank_accounts_path
    assert_response :ok
  end

  test 'passes down http errors if failed to select insights bank accounts as merchant_new' do
    stub_user_state(@merchant_new)

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_insights_bank_accounts).raises(e)
    post api_v1_select_insights_bank_accounts_path
    assert_response :not_found
  end

  # merchant_admin
  test 'select insights bank accounts as merchant_admin ' do
    stub_user_state(@merchant_admin)

    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_insights_bank_accounts).returns(bank_accounts)
    post api_v1_select_insights_bank_accounts_path
    assert_response :ok
  end

  test 'passes down http errors if failed to select insights bank accounts as merchant_admin' do
    stub_user_state(@merchant_admin)

    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_insights_bank_accounts).raises(e)
    post api_v1_select_insights_bank_accounts_path
    assert_response :not_found
  end

  # delegated_access_mode
  test 'unauthorized to select insights bank accounts as delegated_access_mode' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_selected_insights_bank_accounts).returns(bank_accounts)
    post api_v1_select_insights_bank_accounts_path, as: :json
    assert_response :unauthorized
  end

  #
  # Describe GET /api/v1/invoices
  #
  test 'api request for invoices from merchant admin when invoices are good are successful' do
    stub_user_state(@merchant_admin)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_list_of_invoices).returns(invoices)
    stub_invoices_request(200)
    get api_v1_invoices_path
    assert_response :ok
  end

  test 'api request for invoices from delegated access user when invoices are good are successful' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_good_load_merchant(good_merchant, valid_offers, [good_application], [], campaigns)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_list_of_invoices).returns(invoices)
    stub_invoices_request(200)
    get api_v1_invoices_path
    assert_response :ok
  end

  test 'api request for invoices when invoices not found returns not found' do
    stub_user_state(@merchant_admin)
    mock_good_load_merchant(good_merchant, valid_offers, [good_application], advances, campaigns)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::FinancingApi.any_instance.stubs(:get_list_of_invoices).raises(e)
    get api_v1_invoices_path
    assert_response :not_found
  end

  #
  # Describe POST /delegated_logout
  #
  test 'cannot get any data after logout from delegated access mode' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)
    mock_good_load_merchant(good_merchant, valid_offers, [], [], campaigns)

    get merchant_path
    assert_template 'merchants/show'
    post delegated_logout_path
    mock_merchant_error(404)
    get api_v1_merchants_path
    assert_response :not_found
  end

  #
  # Describe GET  /api/v1/campaigns
  #
  test 'api request for campaigns from merchant admin are successful' do
    stub_user_state(@merchant_admin)
    mock_good_load_merchant

    get api_v1_campaigns_path
    assert_response :ok
  end

  test 'api request for campaigns from merchant new are successful' do
    stub_user_state(@merchant_new)
    mock_good_load_merchant

    get api_v1_campaigns_path
    assert_response :ok
  end

  test 'api request for campaigns from delegated access mode are successful' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)
    mock_good_load_merchant

    get api_v1_campaigns_path
    assert_response :ok
  end

  test 'api request for campaigns when campaigns are not found returns not found' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    mock_good_load_merchant(good_merchant, [], [], [], campaigns)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::FinancingApi.any_instance.stubs(:get_campaigns).raises(e)
    get api_v1_campaigns_path
    assert_response :not_found
  end

  #
  # Describe POST /api/v1/merchants
  #
  test 'when api request for creating merchant as new merchant is success correct payload is passed to SwaggerClient' do
    stub_user_state(@merchant_new)
    SwaggerClient::MerchantsApi.any_instance.expects(:create_merchant).with(sample_merchant_post.to_json).returns(good_merchant)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json

    assert_response :ok
  end

  test 'when api request for creating merchant as new merchant is success returns success' do
    stub_user_state(@merchant_new)
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).returns(good_merchant)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
  end

  test 'when api request for creating merchant as new merchant is success correct payload is passed to SwaggerClient with owner_since' do
    stub_user_state(@merchant_new)

    attrs = {
      owner_since: Time.now.utc
    }
    SwaggerClient::MerchantsApi.any_instance.expects(:create_merchant).with(sample_merchant_post(attrs).to_json).returns(good_merchant)

    post api_v1_merchants_path, params: sample_merchant_post(attrs), as: :json
    assert_response :ok
  end

  test 'when api request for creating merchant as new merchant with lead_guid is success returns success' do
    stub_user_state(@merchant_new)
    attrs = {
      lead_guid: "lead_#{SecureRandom.base58(16)}"
    }
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).returns(good_merchant)

    post api_v1_merchants_path, params: sample_merchant_post(attrs), as: :json
    assert_response :ok
  end

  test 'when api request for creating merchant as new merchant is not found returns not found' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 404, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).raises(e)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
    assert_response :not_found
  end

  test 'when api request for creating merchant as new merchant is service unavailable returns service unavailable' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 503, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).raises(e)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
    assert_response :service_unavailable
  end

  test 'when api request for creating merchant as new merchant is internal server error returns internal server error' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 500, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).raises(e)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
    assert_response :internal_server_error
  end

  test 'when api request for creating merchant as a new merchant is unprocessable entity returns unprocessable entity' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 422, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).raises(e)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
    assert_response :unprocessable_entity
  end

  test 'when api request for creating merchant as a merchant admin returns unauthorized' do
    stub_user_state(@merchant_admin)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 401, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).raises(e)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
    assert_response :unauthorized
  end

  test 'when api request for creating merchant when in delegated access mode returns unauthorized' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)
    e = SwaggerClient::ApiError.new(response_body: '{"status": 401, "message": ""}')
    SwaggerClient::MerchantsApi.any_instance.stubs(:create_merchant).raises(e)

    post api_v1_merchants_path, params: sample_merchant_post, as: :json
    assert_response :unauthorized
  end

  #
  # Describe GET /api/v1/merchant/:guid/agreement
  #
  test 'get agreement returns unauthorized when access token missing' do
    stub_user_state(@merchant_new)
    mock_merchant
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD' }
    assert_response :unauthorized
  end

  test 'get agreement gets the agreement for merchant' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).returns({})

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD' }
    assert_response :ok
  end

  test 'get agreement returns bad request when no type is supplied' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).returns({})

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: {}
    assert_response :bad_request
  end

  test 'get agreement returns bad request if an invalid supplier guid is supplied' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).returns({})

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD', supplier_id: 'su_invalid' }
    assert_response :bad_request
  end

  test 'get agreement returns unauthorized when the request to ZT returns unauthorized' do
    stub_user_state(@merchant_new)
    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: { status: 401, message: '' }.to_json)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).raises(e)

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD' }
    assert_response :unauthorized
  end

  test 'get agreement returns bad request when the request to ZT returns bad request' do
    stub_user_state(@merchant_new)
    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: { status: 400, message: '' }.to_json)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).raises(e)

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD' }
    assert_response :bad_request
  end

  test 'get agreement returns unprocessable entity when the request to ZT returns unprocessable entity' do
    stub_user_state(@merchant_new)
    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: { status: 422, message: '' }.to_json)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).raises(e)

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD' }
    assert_response :unprocessable_entity
  end

  test 'get agreement returns internal error when the request to ZT returns internal error' do
    stub_user_state(@merchant_new)
    mock_merchant
    e = SwaggerClient::ApiError.new(response_body: { status: 500, message: '' }.to_json)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_agreement).raises(e)

    id = "m_#{SecureRandom.base58(16)}"
    get agreement_api_v1_merchant_path(id), params: { type: 'PAD' }
    assert_response :internal_server_error
  end

  #
  # Describe POST /api/v1/request_assistance
  #
  test 'should be able to request for assistance as merchant_new' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_request_assistance).returns([])

    post api_v1_request_assistance_path, as: :json
    assert_response :ok
  end

  test 'should pass down http errors if failed to request for assistance as merchant_new' do
    stub_user_state(@merchant_new)
    mock_merchant

    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_new)
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_request_assistance).raises(e)

      post api_v1_request_assistance_path, as: :json
      assert_response http_code
    end
  end

  test 'should be able to request for assistance as merchant_admin' do
    stub_user_state(@merchant_admin)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_request_assistance).returns([])

    post api_v1_request_assistance_path, as: :json
    assert_response :ok
  end

  test 'should pass down http errors if failed to request for assistance as merchant_admin' do
    stub_user_state(@merchant_admin)
    mock_merchant

    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_admin)
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_request_assistance).raises(e)

      post api_v1_request_assistance_path, as: :json
      assert_response http_code
    end
  end

  test 'should be unauthorized to request for assistance as partner_admin' do
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_request_assistance).returns([])

    post api_v1_request_assistance_path, as: :json
    assert_response :unauthorized
  end

  test 'should be unauthorized to request for assistance as delegated_access user' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_request_assistance).returns([])

    post api_v1_request_assistance_path, as: :json
    assert_response :unauthorized
  end

  #
  # Describe POST /api/v1/increase_limit
  #
  test 'should be able to request a limit increase as merchant_new' do
    stub_user_state(@merchant_new)
    mock_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_increase_limit).returns([])

    post api_v1_increase_limit_path, as: :json
    assert_response :ok
  end

  test 'should pass down http errors if failed to request a limit increase as merchant_new' do
    mock_merchant

    [404, 401, 422, 500].each do |http_code|
      stub_user_state(@merchant_new)
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_increase_limit).raises(e)

      post api_v1_increase_limit_path, as: :json
      assert_response http_code
    end
  end

  #
  # Describe POST /api/v1/refresh_offers
  #

  test 'POST /api/v1/refresh_offers should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post api_v1_refresh_offers_path
    assert_response :unauthorized
  end

  test 'POST /api/v1/refresh_offers should return ok on valid requests' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_refresh_offers).returns([])

    stub_user_state(@merchant_new)
    mock_merchant
    post api_v1_refresh_offers_path
    assert_response :ok
  end

  test 'POST /api/v1/refresh_offers should pass down http errors if failed' do
    stub_user_state(@merchant_new)
    mock_merchant
    [401, 422, 500].each do |http_code|
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_merchant_refresh_offers).raises(e)

      post api_v1_refresh_offers_path
      assert_response http_code
    end
  end

  #
  # POST /api/v1/merchants/{id}/business_partner_branding
  #
  test 'POST /api/v1/merchants/{id}/business_partner_branding should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing vanity' do
    sign_in_user @merchant_new
    params = {
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing primary color' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing secondary color' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      logo: 'data:image/png;base64,aaaa'
    }

    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing logo' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831'
    }

    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if logo is an unsupported format' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'test_logo'
    }

    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    post merchant_api_path('m_test', 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    post merchant_api_path("test_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should return ok on valid requests' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_business_partner_branding).returns({})
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    sign_in_user @merchant_new
    post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :ok
  end

  test 'POST /api/v1/merchants/{id}/business_partner_branding should pass down http errors if failed to request to become business partner' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_business_partner_branding).raises(e)

      params = {
        vanity: 'my-vanity',
        primary_color: '#2d3d55',
        secondary_color: '#da3831',
        logo: 'data:image/png;base64,aaaa'
      }

      post merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
      assert_response http_code
    end
  end

  #
  # GET /api/v1/merchants/{id}/business_partner_branding
  #
  test 'GET /api/v1/merchants/{id}/business_partner_branding should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/merchants/{id}/business_partner_branding should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new

    get merchant_api_path('m_test', 'business_partner_branding')
    assert_response :bad_request
  end

  test 'GET /api/v1/merchants/{id}/business_partner_branding should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new

    get merchant_api_path("test_#{SecureRandom.base58(16)}", 'business_partner_branding')
    assert_response :bad_request
  end

  test 'GET /api/v1/merchants/{id}/business_partner_branding should return ok on valid requests' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_branding).returns({})

    sign_in_user @merchant_new
    get merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding')
    assert_response :ok
  end

  test 'GET /api/v1/merchants/{id}/business_partner_branding should pass down http errors if failed to retrieve business partner branding' do
    [401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_branding).raises(e)

      get merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding')
      assert_response http_code
    end
  end

  #
  # PUT /api/v1/merchants/{id}/business_partner_branding
  #
  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), as: :json
    assert_response :unauthorized
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing vanity' do
    sign_in_user @merchant_new
    params = {
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing primary color' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return bad_request if missing secondary color' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      logo: 'data:image/png;base64,aaaa'
    }

    put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return bad_request if logo is an unsupported format' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'test_logo'
    }

    put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    put merchant_api_path('m_test', 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    put merchant_api_path("test_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should return ok on valid requests' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:put_business_partner_branding).returns({})
    params = {
      vanity: 'my-vanity',
      primary_color: '#2d3d55',
      secondary_color: '#da3831',
      logo: 'data:image/png;base64,aaaa'
    }

    sign_in_user @merchant_new
    put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
    assert_response :ok
  end

  test 'PUT /api/v1/merchants/{id}/business_partner_branding should pass down http errors if failed to update business partner branding' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:put_business_partner_branding).raises(e)

      params = {
        vanity: 'my-vanity',
        primary_color: '#2d3d55',
        secondary_color: '#da3831',
        logo: 'data:image/png;base64,aaaa'
      }

      put merchant_api_path("m_#{SecureRandom.base58(16)}", 'business_partner_branding'), params: params
      assert_response http_code
    end
  end

  #
  # PUT /api/v1/merchants/{id}
  #
  test 'PUT /api/v1/merchants/{id} should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    put api_v1_merchant_path(@merchant_new_m_guid), params: { name: 'ACME Inc.' }
    assert_response :unauthorized
  end

  test 'PUT /api/v1/merchants/{id} should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    put api_v1_merchant_path('m_test')
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id} should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    put api_v1_merchant_path("test_#{SecureRandom.base58(16)}"), params: { name: 'ACME Inc.' }
    assert_response :bad_request
  end

  test 'PUT /api/v1/merchants/{id} should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:update_merchant).returns({})

    sign_in_user @merchant_new
    put api_v1_merchant_path(@merchant_new_m_guid), params: { name: 'ACME Inc.' }
    assert_response :ok
  end

  test 'PUT /api/v1/merchants/{id} passes all parameters' do
    stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{@merchant_new_m_guid}")
      .to_return(status: 200)

    sign_in_user @merchant_new

    params = {
      name: Faker::Name.name, doing_business_as: Faker::Name.name, business_num: SecureRandom.random_number(1_000_000).to_s,
      incorporated_in: 'CD', address_line_1: '35 Fitzgerald Rd.', address_line_2: 'Unit 400', postal_code: 'K2K1K2',
      city: 'Ottawa', state_province: 'ON', country: 'Canada', desired_bank_account_balance: SecureRandom.random_number * 10_000
    }

    put api_v1_merchant_path(@merchant_new_m_guid), params: params, as: :json

    assert_requested :put, "#{Rails.configuration.zetatango_url}api/merchants/#{@merchant_new_m_guid}",
                     body: JSON.parse(params.to_json)
  end

  test 'PUT /api/v1/merchants should pass down http errors if failed to update the profile' do
    [400, 401, 404, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:update_merchant).raises(e)

      put api_v1_merchant_path(@merchant_new_m_guid), params: { name: 'ACME Inc.' }
      assert_response http_code
    end
  end

  #
  # GET /api/v1/merchants/documents
  #
  test 'GET /api/v1/merchants/documents should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_merchants_documents_path, params: sample_documents_params
    assert_response :unauthorized
  end

  test 'GET /api/v1/merchants/documents should return ok on valid request' do
    stub_request(:get, "#{Rails.configuration.zetatango_url}api/merchants/m_unused")
      .to_return(status: 200)

    sign_in_user @merchant_new
    mock_merchant_documents

    get api_v1_merchants_documents_path, params: sample_documents_params
    assert_response :ok
  end

  test 'GET /api/v1/merchants/documents should return ok if no parameters are supplied' do
    stub_request(:get, "#{Rails.configuration.zetatango_url}api/merchants/m_unused")
      .to_return(status: 200)

    sign_in_user @merchant_new
    mock_merchant_documents

    get api_v1_merchants_documents_path
    assert_response :ok
  end

  test 'GET /api/v1/merchants/documents should return bad_request if upload_start_time is invalid' do
    stub_request(:get, "#{Rails.configuration.zetatango_url}api/merchants/m_unused")
      .to_return(status: 200)

    sign_in_user @merchant_new
    mock_merchant_documents

    get api_v1_merchants_documents_path, params: sample_bad_documents_params
    assert_response :bad_request
  end

  test 'GET /api/v1/merchants/documents should forward all parameters' do
    stub_request(:get, "#{Rails.configuration.zetatango_url}api/merchants/m_unused")
      .to_return(status: 200)

    stub_request(:get, "#{Rails.configuration.zetatango_url}api/merchant_documents")
      .with(query: sample_documents_params)
      .to_return(status: 200)

    sign_in_user @merchant_new

    get api_v1_merchants_documents_path, params: sample_documents_params
    assert_requested :get, "#{Rails.configuration.zetatango_url}api/merchant_documents",
                     query: JSON.parse(sample_documents_params.to_json)
  end

  test 'GET /api/v1/merchants/documents should forward all http errors' do
    stub_request(:get, "#{Rails.configuration.zetatango_url}api/merchants/m_unused")
      .to_return(status: 200)

    [400, 401, 404, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantDocumentsApi.any_instance.stubs(:get_merchant_documents).raises(e)

      get api_v1_merchants_documents_path, params: sample_documents_params
      assert_response http_code
    end
  end

  # Test Helpers

  # rubocop: disable Metrics/ParameterLists
  def mock_good_load_merchant(mocked_merchant = good_merchant, mocked_financing_offers = [],
                              mocked_financing_applications = [], mocked_financing_advances = [],
                              mocked_campaigns = campaigns)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(mocked_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(mocked_financing_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns(mocked_financing_applications)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns(mocked_financing_advances)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_campaigns).returns(mocked_campaigns)
  end
  # rubocop: enable Metrics/ParameterLists

  def mock_responses(error_code)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_list_of_invoices).returns([])
    e = SwaggerClient::ApiError.new(code: error_code, response_body: "{\"status\": #{error_code}, \"message\": \"\"}")
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).raises(e)
  end

  def mock_merchant(mocked_merchant = good_merchant)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(mocked_merchant)
  end

  def mock_merchant_documents(mocked_merchant_documents_listing = good_merchant_documents_listing)
    SwaggerClient::MerchantDocumentsApi.any_instance.stubs(:get_merchant_documents).returns(mocked_merchant_documents_listing)
  end

  def mock_merchant_error(error_code)
    e = SwaggerClient::ApiError.new(code: error_code)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).raises(e)
  end

  def stub_invoices_request(response)
    stub_request(:get, 'http://localhost:3000/api/invoices')
      .with(headers: { 'Accept' => 'application/json',
                       'Expect' => '',
                       'User-Agent' => 'Typhoeus - https://github.com/typhoeus/typhoeus' })
      .to_return(status: response, body: '', headers: {})
  end

  def stub_pad_agreement_request(response)
    stub_request(:get, 'http://localhost:3000/api/financing/applications/app-id/pad_agreement')
      .with(headers: { 'Accept' => 'application/json',
                       'Expect' => '',
                       'User-Agent' => 'Typhoeus - https://github.com/typhoeus/typhoeus' })
      .to_return(status: response, body: '', headers: {})
  end

  def stub_bank_account_request(response)
    stub_request(:get, 'http://localhost:3000/api/financing/financing/bank_accounts')
      .with(headers: { 'Accept' => 'application/json',
                       'Expect' => '',
                       'User-Agent' => 'Typhoeus - https://github.com/typhoeus/typhoeus' })
      .to_return(status: response, body: '', headers: {})
  end

  def stub_campaigns_request(response)
    stub_request(:get, 'http://localhost:3000/api/financing/campaigns')
      .with(headers: { 'Accept' => 'application/json',
                       'Expect' => '',
                       'User-Agent' => 'Typhoeus - https://github.com/typhoeus/typhoeus' })
      .to_return(status: response, body: '', headers: {})
  end

  def sample_merchant_post(custom_attrs = {})
    ret = {
      email: 'merchant@example.com',
      name: "Jake's Karate",
      phone_number: '6125551234',
      date_at_address: '01-01-1990',
      industry: 'Bar',
      avg_monthly_sales: '60 000',
      address_line_1: '99 rue Street',
      address_line_2: 'Unit 2',
      city: 'Ottawa',
      country: 'Canada',
      postal_code: 'b2b2b2',
      state_province: 'ON',
      business_num: '89046635BN01',
      doing_business_as: 'JAKEY INC',
      incorporated_in: 'ON',
      onboarding: true,
      self_attested_date_established: Time.new(2018, 12, 8, 0, 0),
      self_attested_average_monthly_sales: 10_000
    }
    ret[:lead_guid] = custom_attrs[:lead_guid] if custom_attrs[:lead_guid]
    ret[:owner_since] = custom_attrs[:owner_since] if custom_attrs[:owner_since]
    ret
  end

  def sample_documents_params
    {
      offset: 0,
      limit: 5,
      order_by: 'created_at',
      order_direction: 'desc',
      upload_start_time: (DateTime.now << 12).to_s
    }
  end

  def sample_bad_documents_params
    {
      offset: 0,
      limit: 5,
      order_by: 'created_at',
      order_direction: 'desc',
      upload_start_time: 0o1012020
    }
  end
end
