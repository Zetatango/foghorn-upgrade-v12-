# frozen_string_literal: true

require 'test_helper'

class Api::V1::MarketingCampaignsControllerTest < ActionDispatch::IntegrationTest
  include MarketingCampaignsHelper

  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))

    @marketing_campaign_guid = 'mktcmp_123'
  end

  #
  # POST /api/v1/marketing_campaigns
  #
  test 'POST /api/v1/marketing_campaigns should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post marketing_campaigns_api_path, as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/marketing_campaigns should return bad request when scheduled_at is too early' do
    SwaggerClient::MarketingApi.any_instance.stubs(:create_marketing_campaign).returns({})

    sign_in_user @merchant_new
    post marketing_campaigns_api_path, params: { scheduled_at: DateTime.now.utc.end_of_day }
    assert_response :bad_request
  end

  test 'POST /api/v1/marketing_campaigns should return bad request when scheduled_at is too far' do
    SwaggerClient::MarketingApi.any_instance.stubs(:create_marketing_campaign).returns({})

    sign_in_user @merchant_new
    post marketing_campaigns_api_path, params: { scheduled_at: 31.days.from_now }
    assert_response :bad_request
  end

  test 'POST /api/v1/marketing_campaigns should return ok on valid requests' do
    SwaggerClient::MarketingApi.any_instance.stubs(:create_marketing_campaign).returns({})

    sign_in_user @merchant_new
    post marketing_campaigns_api_path, params: { scheduled_at: 3.days.from_now }
    assert_response :ok
  end

  test 'POST /api/v1/marketing_campaigns should pass down http errors if failed to create marketing campaign' do
    [401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MarketingApi.any_instance.stubs(:create_marketing_campaign).raises(e)

      post marketing_campaigns_api_path, params: { scheduled_at: 2.days.from_now }
      assert_response http_code
    end
  end

  #
  # GET /api/v1/marketing_campaigns
  #
  test 'GET /api/v1/marketing_campaigns should return unauthorized when access token missing' do
    sign_in_user @merchant_new

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get marketing_campaigns_api_path, as: :json

    assert_response :unauthorized
  end

  test 'GET /api/v1/marketing_campaigns should return ok' do
    SwaggerClient::MarketingApi.any_instance.stubs(:get_marketing_campaigns).returns({})

    sign_in_user @merchant_new

    get marketing_campaigns_api_path

    assert_response :ok
  end

  test 'GET /api/v1/marketing_campaigns should pass down http errors if failed to list campaigns' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MarketingApi.any_instance.stubs(:get_marketing_campaigns).raises(e)

      get marketing_campaigns_api_path, params: { offset: 0, limit: 10 }

      assert_response http_code
    end
  end

  #
  # GET /api/v1/marketing_campaigns/{id}
  #
  test 'GET /api/v1/marketing_campaigns/{id} should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get marketing_campaigns_api_path(@marketing_campaign_guid), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/marketing_campaigns/{id} should return ok on valid request' do
    SwaggerClient::MarketingApi.any_instance.stubs(:get_marketing_campaign).returns(@invoice_resp)

    sign_in_user @merchant_new
    get marketing_campaigns_api_path(@marketing_campaign_guid)
    assert_response :ok
  end

  test 'GET /api/v1/marketing_campaigns/{id} should pass down http errors if failed to request to get a marketing campaign' do
    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MarketingApi.any_instance.stubs(:get_marketing_campaign).raises(e)

      get marketing_campaigns_api_path(@marketing_campaign_guid)
      assert_response http_code
    end
  end

  #
  # DELETE /api/v1/marketing_campaigns/{id}
  #
  test 'DELETE /api/v1/marketing_campaigns/{id} should return unauthorized when access token missing' do
    sign_in_user @merchant_new

    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    delete marketing_campaigns_api_path(@marketing_campaign_guid), as: :json

    assert_response :unauthorized
  end

  test 'DELETE /api/v1/marketing_campaigns/{id} should return ok' do
    SwaggerClient::MarketingApi.any_instance.stubs(:delete_marketing_campaign).returns({})

    sign_in_user @merchant_new

    delete marketing_campaigns_api_path(@marketing_campaign_guid)

    assert_response :ok
  end

  test 'DELETE /api/v1/marketing_campaigns/{id} should pass down http errors if failed to delete campaign' do
    [400, 401, 404, 422, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::MarketingApi.any_instance.stubs(:delete_marketing_campaign).raises(e)

      delete marketing_campaigns_api_path(@marketing_campaign_guid)

      assert_response http_code
    end
  end
end
