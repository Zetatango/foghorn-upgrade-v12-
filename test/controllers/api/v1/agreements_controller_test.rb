# frozen_string_literal: true

require 'test_helper'

class Api::V1::AgreementsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  def api_v1_agreement_path(id)
    "#{Rails.configuration.foghorn_url}/api/v1/agreements/#{id}"
  end

  #
  # Describe get /api/v1/agreements/:guid
  #

  test 'get agreement accept returns unauthorized when access token missing' do
    stub_user_state(@merchant_new)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    id = "agr_#{SecureRandom.base58(16)}"
    get api_v1_agreement_path(id)
    assert_response :unauthorized
  end

  test 'get agreement with valid id is successful' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:get_agreement).returns({})

    id = "agr_#{SecureRandom.base58(16)}"
    get api_v1_agreement_path(id)
    assert_response :ok
  end

  test 'get agreement returns the expected agreement entity' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:get_agreement).returns(content: 'Terms and Conditions')

    id = "agr_#{SecureRandom.base58(16)}"
    get api_v1_agreement_path(id)
    entity = JSON.parse(response.body, symbolize_names: true)[:data]
    assert_equal 'Terms and Conditions', entity[:content]
  end

  test 'get agreement with show_terms returns the expected agreement entity' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:get_agreement).returns(content: 'Terms and Conditions')

    id = "agr_#{SecureRandom.base58(16)}"
    get api_v1_agreement_path(id), params: { show_terms: true }
    entity = JSON.parse(response.body, symbolize_names: true)[:data]
    assert_equal 'Terms and Conditions', entity[:content]
  end

  test 'get agreement returns bad request if the agreement guid is malformed' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:get_agreement).returns({})

    id = 'agr_invalid'
    get api_v1_agreement_path(id)
    assert_response :bad_request
  end

  test 'get agreement returns not found error if ZT responds with not found error' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 404, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:get_agreement).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    get api_v1_agreement_path(id)
    assert_response :not_found
  end

  test 'get agreement returns internal server error if ZT responds with internal server error' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 500, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:get_agreement).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    get api_v1_agreement_path(id)
    assert_response :internal_server_error
  end

  #
  # Describe PUT /api/v1/agreements/:guid/accept
  #

  test 'put agreement accept returns unauthorized when access token missing' do
    stub_user_state(@merchant_new)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/accept"
    assert_response :unauthorized
  end

  test 'put agreement accept with valid parameters is successful' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:accept).returns({})

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/accept"
    assert_response :ok
  end

  test 'put agreement accept returns bad request if the agreement guid is malformed' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:accept).returns({})

    id = 'agr_invalid'
    put "#{api_v1_agreement_path(id)}/accept"
    assert_response :bad_request
  end

  test 'put agreement accept returns bad request if ZT responds with bad request' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 400, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:accept).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/accept"
    assert_response :bad_request
  end

  test 'put agreement accept returns unprocessable entity if ZT responds with unprocessable entity' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 422, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:accept).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/accept"
    assert_response :unprocessable_entity
  end

  test 'put agreement accept returns internal server error if ZT responds with internal server error' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 500, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:accept).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/accept"
    assert_response :internal_server_error
  end

  #
  # Describe PUT /api/v1/agreements/:guid/decline
  #

  test 'put agreement decline returns unauthorized when access token missing' do
    stub_user_state(@merchant_new)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/decline"
    assert_response :unauthorized
  end

  test 'put agreement decline with valid parameters is successful' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:decline).returns({})

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/decline"
    assert_response :ok
  end

  test 'put agreement decline returns bad request if the agreement guid is malformed' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:decline).returns({})

    id = 'agr_invalid'
    put "#{api_v1_agreement_path(id)}/decline"
    assert_response :bad_request
  end

  test 'put agreement decline returns bad request if ZT responds with bad request' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 400, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:decline).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/decline"
    assert_response :bad_request
  end

  test 'put agreement decline returns unprocessable entity if ZT responds with unprocessable entity' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 422, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:decline).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/decline"
    assert_response :unprocessable_entity
  end

  test 'put agreement decline returns internal server error if ZT responds with internal server error' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 500, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:decline).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/decline"
    assert_response :internal_server_error
  end

  #
  # Describe PUT /api/v1/agreements/:guid/opt_out
  #

  test 'put agreement opt_out returns unauthorized when access token missing' do
    stub_user_state(@merchant_new)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/opt_out"
    assert_response :unauthorized
  end

  test 'put agreement opt_out with valid parameters is successful' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:opt_out).returns({})

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/opt_out"
    assert_response :ok
  end

  test 'put agreement opt_out returns bad request if the agreement guid is malformed' do
    stub_user_state(@merchant_new)
    SwaggerClient::AgreementsApi.any_instance.stubs(:opt_out).returns({})

    id = 'agr_invalid'
    put "#{api_v1_agreement_path(id)}/opt_out"
    assert_response :bad_request
  end

  test 'put agreement opt_out returns bad request if ZT responds with bad request' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 400, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:opt_out).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/opt_out"
    assert_response :bad_request
  end

  test 'put agreement opt_out returns unprocessable entity if ZT responds with unprocessable entity' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 422, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:opt_out).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/opt_out"
    assert_response :unprocessable_entity
  end

  test 'put agreement opt_out returns internal server error if ZT responds with internal server error' do
    stub_user_state(@merchant_new)
    e = SwaggerClient::ApiError.new(response_body: { status: 500, message: '' }.to_json)
    SwaggerClient::AgreementsApi.any_instance.stubs(:opt_out).raises(e)

    id = "agr_#{SecureRandom.base58(16)}"
    put "#{api_v1_agreement_path(id)}/opt_out"
    assert_response :internal_server_error
  end
end
