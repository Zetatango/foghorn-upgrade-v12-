# frozen_string_literal: true

require 'test_helper'

class Api::V1::BusinessPartnersControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @tracked_object_guid = "obj_#{SecureRandom.base58(16)}"

    @application_response = {
      id: "bpap_#{SecureRandom.base58(16)}",
      merchant_id: @merchant_new_m_guid,
      state: :pending,
      terms: 'SAAS SERVICES ORDER FORM'
    }

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  #
  # GET /api/v1/business_partners/{id}
  #
  test 'GET /api/v1/business_partners/{id} should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get business_partner_api_path(@merchant_new_m_guid), params: { show_terms: true }, as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/business_partners/{id} should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    get business_partner_api_path('m_test'), params: { show_terms: true }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id} should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    get business_partner_api_path("test_#{SecureRandom.base58(16)}"), params: { show_terms: true }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id} should return bad_request if show_terms is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid)
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id} should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).returns(@application_response)

    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid), params: { show_terms: true }
    assert_response :ok
  end

  test 'GET /api/v1/business_partners/{id} should pass down http errors if failed to request to become business partner' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).raises(e)

      get business_partner_api_path(@merchant_new_m_guid), params: { show_terms: true }
      assert_response http_code
    end
  end

  test 'GET /api/v1/business_partners/{id} returns the application entity as data' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).returns(@application_response)

    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid), params: { show_terms: true }

    entity = JSON.parse(response.body, symbolize_names: true)

    assert entity.key?(:data)
    assert entity[:data].key?(:id)
    assert entity[:data].key?(:merchant_id)
    assert entity[:data].key?(:terms)
    assert entity[:data].key?(:state)
  end

  #
  # POST /api/v1/business_partners
  #
  test 'POST /api/v1/business_partners should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post business_partner_api_path, as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/business_partners should return bad_request if missing merchant guid' do
    sign_in_user @merchant_new
    post business_partner_api_path
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    post business_partner_api_path, params: { merchant_guid: 'm_test' }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    post business_partner_api_path, params: { merchant_guid: "test_#{SecureRandom.base58(16)}" }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners should return ok on valid requests' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_business_partner_application).returns([])

    sign_in_user @merchant_new
    post business_partner_api_path, params: { merchant_guid: @merchant_new_m_guid }
    assert_response :ok
  end

  test 'POST /api/v1/business_partners should pass down http errors if failed to request to become business partner' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_business_partner_application).raises(e)

      post business_partner_api_path, params: { merchant_guid: @merchant_new_m_guid }
      assert_response http_code
    end
  end

  #
  # POST /api/v1/business_partners/{id}/invite
  #
  test 'POST /api/v1/business_partners/{id}/invite should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post business_partner_api_path(@merchant_new_m_guid, 'invite'), as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/business_partners/{id}/invite should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    post business_partner_api_path('m_test', 'invite'), params: { email: 'test@user.com', name: 'Test', send_invite: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners/{id}/invite should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    post business_partner_api_path("test_#{SecureRandom.base58(16)}", 'invite'), params: { email: 'test@user.com', name: 'Test', send_invite: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners/{id}/invite should return bad_request if name is missing' do
    sign_in_user @merchant_new
    post business_partner_api_path(@merchant_new_m_guid, 'invite'), params: { email: 'test@user.com', send_invite: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners/{id}/invite should return bad_request if email is missing' do
    sign_in_user @merchant_new
    post business_partner_api_path(@merchant_new_m_guid, 'invite'), params: { name: 'Test', send_invite: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners/{id}/invite should return bad_request if send_invite is missing' do
    sign_in_user @merchant_new
    post business_partner_api_path(@merchant_new_m_guid, 'invite'), params: { email: 'test@user.com', name: 'Test' }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners/{id}/invite should return bad_request if email is invalid' do
    sign_in_user @merchant_new
    post business_partner_api_path(@merchant_new_m_guid, 'invite'), params: { email: 'test', name: 'Test', send_invite: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/business_partners/{id}/invite should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:post_business_partner_merchant).returns([])

    sign_in_user @merchant_new
    post business_partner_api_path(@merchant_new_m_guid, 'invite'), params: { email: 'test@user.com', name: 'Test', send_invite: true }
    assert_response :ok
  end

  test 'POST /api/v1/business_partners/{id}/invite should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:post_business_partner_merchant).raises(e)

      post business_partner_api_path(@merchant_new_m_guid, 'invite'), params: { email: 'test@user.com', name: 'Test', send_invite: true }
      assert_response http_code
    end
  end

  #
  # GET /api/v1/business_partners/{id}/business_partner_merchant
  #
  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get business_partner_api_path(@merchant_new_m_guid, :business_partner_merchant), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    get business_partner_api_path('m_test', :business_partner_merchant), params: { offset: 0, limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    get business_partner_api_path("test_#{SecureRandom.base58(16)}", :business_partner_merchant), params: { offset: 0, limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should return bad_request if offset is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :business_partner_merchant), params: { limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should return bad_request if limit is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :business_partner_merchant), params: { offset: 0 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_merchants).returns({})

    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :business_partner_merchant), params: { offset: 0, limit: 10, order_by: :created_at,
                                                                                               order_direction: :desc, filter: 'Alice' }
    assert_response :ok
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_merchant should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_merchants).raises(e)

      get business_partner_api_path(@merchant_new_m_guid, :business_partner_merchant), params: { offset: 0, limit: 10 }
      assert_response http_code
    end
  end

  #
  # GET /api/v1/business_partners/{id}/received_business_partner_invoices
  #
  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get business_partner_api_path(@merchant_new_m_guid, :received_business_partner_invoices), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    get business_partner_api_path('m_test', :received_business_partner_invoices), params: { offset: 0, limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    get business_partner_api_path("test_#{SecureRandom.base58(16)}", :received_business_partner_invoices), params: { offset: 0, limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should return bad_request if offset is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :received_business_partner_invoices), params: { limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should return bad_request if limit is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :received_business_partner_invoices), params: { offset: 0 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_received_business_partner_invoices).returns({})

    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :received_business_partner_invoices), params: { offset: 0, limit: 10, order_by: :created_at,
                                                                                                        order_direction: :desc, filter: 'Alice' }
    assert_response :ok
  end

  test 'GET /api/v1/business_partners/{id}/received_business_partner_invoices should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_received_business_partner_invoices).raises(e)

      get business_partner_api_path(@merchant_new_m_guid, :received_business_partner_invoices), params: { offset: 0, limit: 10 }
      assert_response http_code
    end
  end

  #
  # GET /api/v1/business_partners/{id}/sent_business_partner_invoices
  #
  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get business_partner_api_path(@merchant_new_m_guid, :sent_business_partner_invoices), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    get business_partner_api_path('m_test', :sent_business_partner_invoices), params: { offset: 0, limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    get business_partner_api_path("test_#{SecureRandom.base58(16)}", :sent_business_partner_invoices), params: { offset: 0, limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should return bad_request if offset is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :sent_business_partner_invoices), params: { limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should return bad_request if limit is missing' do
    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :sent_business_partner_invoices), params: { offset: 0 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_sent_business_partner_invoices).returns({})

    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :sent_business_partner_invoices), params: { offset: 0, limit: 10, order_by: :created_at,
                                                                                                    order_direction: :desc, filter: 'Alice' }
    assert_response :ok
  end

  test 'GET /api/v1/business_partners/{id}/sent_business_partner_invoices should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_sent_business_partner_invoices).raises(e)

      get business_partner_api_path(@merchant_new_m_guid, :sent_business_partner_invoices), params: { offset: 0, limit: 10 }
      assert_response http_code
    end
  end

  #
  # GET /api/v1/business_partners/{id}/business_partner_profile
  #
  test 'GET /api/v1/business_partners/{id}/business_partner_profile should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get business_partner_api_path(@merchant_new_m_guid, :business_partner_profile), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_profile should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    get business_partner_api_path('m_test', :business_partner_profile)
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_profile should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    get business_partner_api_path("test_#{SecureRandom.base58(16)}", :business_partner_profile)
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_profile should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_profile).returns({})

    sign_in_user @merchant_new
    get business_partner_api_path(@merchant_new_m_guid, :business_partner_profile)
    assert_response :ok
  end

  test 'GET /api/v1/business_partners/{id}/business_partner_profile should pass down http errors if failed to retrieve the profile' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_profile).raises(e)

      get business_partner_api_path(@merchant_new_m_guid, :business_partner_profile)
      assert_response http_code
    end
  end

  #
  # PUT /api/v1/business_partners/{id}/business_partner_profile
  #
  test 'PUT /api/v1/business_partners/{id}/business_partner_profile should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    put business_partner_api_path(@merchant_new_m_guid, :business_partner_profile), as: :json
    assert_response :unauthorized
  end

  test 'PUT /api/v1/business_partners/{id}/business_partner_profile should return bad_request if bad merchant guid (invalid length)' do
    sign_in_user @merchant_new
    put business_partner_api_path('m_test', :business_partner_profile)
    assert_response :bad_request
  end

  test 'PUT /api/v1/business_partners/{id}/business_partner_profile should return bad_request if bad merchant guid (invalid prefix)' do
    sign_in_user @merchant_new
    put business_partner_api_path("test_#{SecureRandom.base58(16)}", :business_partner_profile)
    assert_response :bad_request
  end

  test 'PUT /api/v1/business_partners/{id}/business_partner_profile should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:put_business_partner_profile).returns({})

    sign_in_user @merchant_new
    put business_partner_api_path(@merchant_new_m_guid, :business_partner_profile)
    assert_response :ok
  end

  test 'PUT /api/v1/business_partners/{id}/business_partner_profile should pass down http errors if failed to update the profile' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:put_business_partner_profile).raises(e)

      put business_partner_api_path(@merchant_new_m_guid, :business_partner_profile)
      assert_response http_code
    end
  end
end
