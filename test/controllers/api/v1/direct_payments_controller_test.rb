# frozen_string_literal: true

require 'test_helper'

class Api::V1::DirectPaymentsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @direct_payment_guid = "dp_#{SecureRandom.base58(16)}"

    @direct_payment_response = {
      id: @direct_payment_guid,
      correlation_type: 'BusinessPartner::Invoice',
      correlation_id: "bpiv_#{SecureRandom.base58(16)}",
      amount: 1000.00,
      currency: 'CAD',
      state: 'pending'
    }

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'GET /api/v1/direct_payments/{id} should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get direct_payment_api_path(@direct_payment_guid), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/direct_payments/{id} should return bad_request if bad direct payment guid (invalid length)' do
    sign_in_user @merchant_new
    get direct_payment_api_path('dp_test'), as: :json
    assert_response :bad_request
  end

  test 'GET /api/v1/direct_payments/{id} should return bad_request if bad direct payment guid (invalid prefix)' do
    sign_in_user @merchant_new
    get direct_payment_api_path("test_#{SecureRandom.base58(16)}"), as: :json
    assert_response :bad_request
  end

  test 'GET /api/v1/direct_payments/{id} should return ok on valid request' do
    SwaggerClient::DirectPaymentsApi.any_instance.stubs(:get_direct_payment).returns(@direct_payment_response)

    sign_in_user @merchant_new
    get direct_payment_api_path(@direct_payment_guid), as: :json
    assert_response :ok
  end

  test 'GET /api/v1/direct_payments/{id} should pass down http errors if failed' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::DirectPaymentsApi.any_instance.stubs(:get_direct_payment).raises(e)

      get direct_payment_api_path(@direct_payment_guid), as: :json
      assert_response http_code
    end
  end

  test 'GET /api/v1/direct_payments/{id} returns the direct payment entity as data' do
    SwaggerClient::DirectPaymentsApi.any_instance.stubs(:get_direct_payment).returns(@direct_payment_response)

    sign_in_user @merchant_new
    get direct_payment_api_path(@direct_payment_guid), as: :json

    entity = JSON.parse(response.body, symbolize_names: true)

    assert entity.key?(:data)
    assert entity[:data].key?(:id)
    assert entity[:data].key?(:correlation_type)
    assert entity[:data].key?(:correlation_id)
    assert entity[:data].key?(:amount)
  end

  test 'POST /api/v1/direct_payments should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post direct_payment_api_path, as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/direct_payments should return bad_request if missing merchant guid' do
    sign_in_user @merchant_new
    post direct_payment_api_path, params: { amount: 1000.00, invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return bad_request if missing amount is missing' do
    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: @merchant_new_m_guid, invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: 'm_test', amount: 1000.00, invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: "test_#{SecureRandom.base58(16)}", amount: 1000.00, invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return bad_request if bad payee_id (invalid length)' do
    SwaggerClient::DirectPaymentsApi.any_instance.stubs(:create_direct_payment).returns(@direct_payment_response)

    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: @merchant_new_m_guid, amount: 1000.00, payee_id: 'su_123' }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return bad_request if bad payee_id (invalid prefix)' do
    SwaggerClient::DirectPaymentsApi.any_instance.stubs(:create_direct_payment).returns(@direct_payment_response)

    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: @merchant_new_m_guid, amount: 1000.00, payee_id: "s_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return bad_request if bad amount' do
    SwaggerClient::DirectPaymentsApi.any_instance.stubs(:create_direct_payment).returns(@direct_payment_response)

    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: @merchant_new_m_guid, amount: 'abc.de', invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/direct_payments should return ok on valid requests' do
    SwaggerClient::DirectPaymentsApi.any_instance.stubs(:create_direct_payment).returns(@direct_payment_response)

    sign_in_user @merchant_new
    post direct_payment_api_path, params: { merchant_id: @merchant_new_m_guid, amount: 1000.00, invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
    assert_response :ok
  end

  test 'POST /api/v1/direct_payments should pass down http errors if failed to create direct payment' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::DirectPaymentsApi.any_instance.stubs(:create_direct_payment).raises(e)

      post direct_payment_api_path, params: { merchant_id: @merchant_new_m_guid, amount: 1000.00, invoice_id: "bpiv_#{SecureRandom.base58(16)}" }
      assert_response http_code
    end
  end

  private

  def direct_payment_api_path(guid = nil, action = nil)
    base = api_v1_direct_payments_path

    return base unless guid.present?
    return "#{base}/#{guid}" unless guid.present? && action.present?

    "#{base}/#{guid}/#{action}"
  end
end
