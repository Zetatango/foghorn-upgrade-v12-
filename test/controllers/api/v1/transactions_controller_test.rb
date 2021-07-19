# frozen_string_literal: true

require 'test_helper'

class Api::V1::TransactionsControllerTest < ActionDispatch::IntegrationTest
  include TransactionsHelper

  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  #
  # GET /api/v1/transactions
  #
  test 'GET /api/v1/transactions should return unauthorized when access token missing' do
    sign_in_user @merchant_new

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get transactions_api_path, as: :json

    assert_response :unauthorized
  end

  test 'GET /api/v1/transactions should return ok with no parameters' do
    SwaggerClient::TransactionsApi.any_instance.stubs(:get_transaction_history).returns({})

    sign_in_user @merchant_new

    get transactions_api_path

    assert_response :ok
  end

  test 'GET /api/v1/transactions should return ok on valid request' do
    SwaggerClient::TransactionsApi.any_instance.stubs(:get_transaction_history).returns({})

    sign_in_user @merchant_new

    get transactions_api_path, params: { offset: 0, limit: 10, order_by: :created_at, order_direction: :desc }

    assert_response :ok
  end

  test 'GET /api/v1/transactions should pass down http errors if failed to list transactions' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::TransactionsApi.any_instance.stubs(:get_transaction_history).raises(e)

      get transactions_api_path, params: { offset: 0, limit: 10 }

      assert_response http_code
    end
  end
end
