# frozen_string_literal: true

require 'test_helper'

class Api::V1::BorrowerInvoicesControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @invoice_guid = 'bpiv_1234567890'

    @invoice_resp = {
      account_number: '123',
      amount: 1234.00,
      id: 'bpiv_1234567890',
      invoice_number: '321',
      last_event: 'sent',
      last_event_at: '2019-01-01',
      sender_id: 'm_abc123',
      receiver_id: 'm_def456',
      supplier_entity: {
        name: 'Supplier 1',
        id: 'su_789'
      },
      merchant_document_id: 'md_0987654321',
      tracked_object_id: 'obj_11111111'
    }

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  #
  # GET /api/v1/borrower_invoices
  #
  test 'GET /api/v1/borrower_invoices should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_borrower_invoices_path, as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/borrower_invoices should return ok on valid request' do
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_received_business_partner_invoices).returns(@invoice_resp)

    sign_in_user @merchant_new
    get api_v1_borrower_invoices_path, params: { id: 1, offset: 0, limit: 10, order_by: :created_at, order_direction: :desc, filter: 'Alice' }
    assert_response :ok
  end

  test 'GET /api/v1/borrower_invoices should pass down http errors if failed to request to get an invoice' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_received_business_partner_invoices).raises(e)

      get api_v1_borrower_invoices_path
      assert_response http_code
    end
  end

  #
  # GET /api/v1/borrower_invoice/{id}
  #
  test 'GET /api/v1/borrower_invoice/{id} should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_borrower_invoice_path(@invoice_guid), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/borrower_invoice/{id} should return ok on valid request' do
    SwaggerClient::BusinessPartnerInvoicesApi.any_instance.stubs(:get_business_partner_merchant_invoice).returns(@invoice_resp)

    sign_in_user @merchant_new
    get api_v1_borrower_invoice_path(@invoice_guid)
    assert_response :ok
  end

  test 'GET /api/v1/borrower_invoice/{id} should pass down http errors if failed to request to get an invoice' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::BusinessPartnerInvoicesApi.any_instance.stubs(:get_business_partner_merchant_invoice).raises(e)

      get api_v1_borrower_invoice_path(@invoice_guid)
      assert_response http_code
    end
  end
end
