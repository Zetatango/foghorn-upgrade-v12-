# frozen_string_literal: true

require 'test_helper'

class Api::V1::BusinessPartnersMerchantsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @merchant_document_guid = "md_#{SecureRandom.base58(16)}"
    @business_partner_merchants_guid = "bpm_#{SecureRandom.base58(16)}"
    @business_partner_merchants_guids = Array.new(5) { "bpm_#{SecureRandom.base58(16)}" }

    @create_invoice_params = {
      invoice_number: SecureRandom.base58(16),
      account_number: SecureRandom.base58(16),
      amount: SecureRandom.random_number * 10_000,
      merchant_document_id: @merchant_document_guid,
      due_date: Time.now.utc + 7.days
    }

    @subscription_params = {
      business_partner_merchants_ids: @business_partner_merchants_guids,
      auto_send: true
    }

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  #
  # POST /api/v1/business_partner_merchants/{id}/invoice
  #
  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: @create_invoice_params, as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    post business_partner_merchants_api_path('bpm_test', :invoice), params: @create_invoice_params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    post business_partner_merchants_api_path("test_#{SecureRandom.base58(16)}", :invoice), params: @create_invoice_params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if invoice_number is missing' do
    params = @create_invoice_params
    params.delete(:invoice_number)

    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if account_number is missing' do
    params = @create_invoice_params
    params.delete(:account_number)

    resp = { code: 201, body: '{"status": 200, "message": ""}' }
    SwaggerClient::BusinessPartnerMerchantsApi.any_instance.stubs(:post_business_partner_merchant_invoice).returns(resp)
    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: params
    assert_response :created
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if amount is missing' do
    params = @create_invoice_params
    params.delete(:amount)

    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if merchant_document_id is missing' do
    params = @create_invoice_params
    params.delete(:merchant_document_id)

    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if bad document guid (invalid length)' do
    params = @create_invoice_params
    params[:merchant_document_id] = 'md_test'

    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return bad_request if bad document guid (invalid prefix)' do
    params = @create_invoice_params
    params[:merchant_document_id] = "test_#{SecureRandom.base58(16)}"

    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: params
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should return ok on valid request' do
    SwaggerClient::BusinessPartnerMerchantsApi.any_instance.stubs(:post_business_partner_merchant_invoice).returns([])

    sign_in_user @merchant_new
    post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: @create_invoice_params
    assert_response :created
  end

  test 'POST /api/v1/business_partner_merchants/{id}/invoice should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::BusinessPartnerMerchantsApi.any_instance.stubs(:post_business_partner_merchant_invoice).raises(e)

      post business_partner_merchants_api_path(@business_partner_merchants_guid, :invoice), params: @create_invoice_params
      assert_response http_code
    end
  end

  #
  # PUT /api/v1/business_partner_merchants/subscribe
  #
  test 'PUT /api/v1/business_partner_merchants/subscribe should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    put api_v1_business_partner_merchants_subscribe_path, params: { ids: ['bpm_test'] }
    assert_response :bad_request
  end

  test 'PUT /api/v1/business_partner_merchants/subscribe should return bad_request if bad merchant guids (invalid prefix)' do
    sign_in_user @merchant_new
    put api_v1_business_partner_merchants_subscribe_path, params: { ids: ["test_#{SecureRandom.base58(16)}"] }
    assert_response :bad_request
  end

  test 'PUT /api/v1/business_partner_merchants/subscribe should return ok on valid request' do
    SwaggerClient::BusinessPartnerMerchantsApi.any_instance.stubs(:put_business_partner_merchants_auto_send_subscribe).returns([])

    sign_in_user @merchant_new
    put api_v1_business_partner_merchants_subscribe_path, params: @subscription_params
    assert_response :created
  end

  test 'PUT /api/v1/business_partner_merchants/subscribe should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::BusinessPartnerMerchantsApi.any_instance.stubs(:put_business_partner_merchants_auto_send_subscribe).raises(e)

      put api_v1_business_partner_merchants_subscribe_path, params: @subscription_params
      assert_response http_code
    end
  end

  test 'PUT /api/v1/business_partner_merchants/subscribe should return bad_request if auto_send is missing' do
    params = @subscription_params
    params.delete(:auto_send)

    sign_in_user @merchant_new
    put api_v1_business_partner_merchants_subscribe_path, params: params
    assert_response :bad_request
  end
end
