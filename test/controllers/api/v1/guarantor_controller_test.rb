# frozen_string_literal: true

require 'test_helper'

class Api::V1::GuarantorControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'unauthorized access when access token missing' do
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post api_v1_guarantor_url, as: :json
    assert_response :unauthorized
  end

  test 'unauthorized access for GET applications when user is not signed in' do
    post api_v1_guarantor_url, as: :json
    assert_response :unauthorized
  end

  test 'POST should fail if application_id is missing' do
    sign_in_user @merchant_new
    params = {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if first_name is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if last_name is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if date_of_birth is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if email is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if address_line_1 is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if city is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if state_province is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST should fail if country is missing' do
    sign_in_user @merchant_new
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      postal_code: 'A1A 1A1'
    }

    post api_v1_guarantor_url, params: params
    assert_response :bad_request
  end

  test 'POST create new guarantor for application as merchant_new' do
    sign_in_user @merchant_new
    @merchant_admin.selected_profile = @merchant_admin_p_guid

    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    SwaggerClient::GuarantorInfosApi.any_instance.stubs(:create_guarantor).returns({})
    post api_v1_guarantor_url, params: params, as: :json
    assert_response :success
  end

  test 'fail to POST new guarantor for application as merchant_new' do
    params = {
      application_id: 'lap_1',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '01-01-1985',
      phone_number: '(514) 555-5555',
      email: 'test@email.com',
      address_line_1: '4200 Dorchester',
      city: 'Montreal',
      state_province: 'Quebec',
      country: 'Canada',
      postal_code: 'A1A 1A1'
    }

    [404, 401, 422, 500].each do |http_code|
      sign_in_user @merchant_new

      e = SwaggerClient::ApiError.new(response_body: "{\"status\": #{http_code}, \"message\": \"\"}")
      SwaggerClient::GuarantorInfosApi.any_instance.stubs(:create_guarantor).raises(e)
      post api_v1_guarantor_url, params: params, as: :json
      assert_response http_code
    end
  end
end
