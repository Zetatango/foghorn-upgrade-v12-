# frozen_string_literal: true

require 'test_helper'

class Api::V1::TrackedObjectsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @tracked_object_guid = "obj_#{SecureRandom.base58(16)}"

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  #
  # GET /api/v1/tracked_objects/{tracked_object_id}/tracked_object_events
  #
  test 'GET /api/v1/tracked_objects/{tracked_object_id}/tracked_object_events should return unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_tracked_objects_path(@tracked_object_guid, :tracked_object_events), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/business_partners/{id}/tracked_object/ should return bad_request if bad tracked object guid (invalid length)' do
    sign_in_user @merchant_new
    get api_tracked_objects_path('obj_test', :tracked_object_events), params: { limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/business_partners/{id}/tracked_object/ should return bad_request if bad tracked object guid (invalid prefix)' do
    sign_in_user @merchant_new
    get api_tracked_objects_path("invite_#{SecureRandom.base58(16)}", :tracked_object_events), params: { limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/tracked_objects/{tracked_object_id}/tracked_object_events should return bad_request if offset is missing' do
    sign_in_user @merchant_new
    get api_tracked_objects_path(@tracked_object_guid, :tracked_object_events), params: { limit: 10 }
    assert_response :bad_request
  end

  test 'GET /api/v1/tracked_objects/{tracked_object_id}/tracked_object_events should return bad_request if limit is missing' do
    sign_in_user @merchant_new
    get api_tracked_objects_path(@tracked_object_guid, :tracked_object_events), params: { offset: 0 }
    assert_response :bad_request
  end

  test 'GET /api/v1/tracked_objects/{tracked_object_id}/tracked_object_events should return ok on valid request' do
    SwaggerClient::TrackedObjectsApi.any_instance.stubs(:get_tracked_object_events).returns({})

    sign_in_user @merchant_new
    get api_tracked_objects_path(@tracked_object_guid, :tracked_object_events), params: { offset: 0, limit: 10, order_by: :created_at,
                                                                                          order_direction: :desc, filter: 'Alice' }
    assert_response :ok
  end

  test 'GET /api/v1/business_partners/{id}/tracked_object should pass down http errors if failed to invite a borrower' do
    [400, 401, 404, 500].each do |http_code|
      sign_in_user @merchant_new
      e = SwaggerClient::ApiError.new(code: http_code, response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::TrackedObjectsApi.any_instance.stubs(:get_tracked_object_events).raises(e)

      get api_tracked_objects_path(@tracked_object_guid, :tracked_object_events), params: { offset: 0, limit: 10 }
      assert_response http_code
    end
  end

  private

  def api_tracked_objects_path(tracked_object_guid, action)
    "/api/v1/tracked_objects/#{tracked_object_guid}/#{action}"
  end
end
