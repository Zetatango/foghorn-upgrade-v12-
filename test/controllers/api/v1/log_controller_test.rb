# frozen_string_literal: true

require 'test_helper'

class Api::V1::LogControllerTest < ActionDispatch::IntegrationTest
  def setup
    @parameters = {
      message: 'Test log message',
      severity: 'debug'
    }

    stub_vanity_host
    stub_users(@partner)
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'should return bad_request if missing message' do
    sign_in_user @merchant_admin
    post api_v1_log_path, params: @parameters.except(:message)
    assert_response :bad_request
  end

  test 'should return bad_request if missing severity' do
    sign_in_user @merchant_admin
    post api_v1_log_path, params: @parameters.except(:severity)
    assert_response :bad_request
  end

  test 'should return bad_request if unknown severity' do
    sign_in_user @merchant_admin
    @parameters[:severity] = 'unknown'
    post api_v1_log_path, params: @parameters
    assert_response :bad_request
  end

  test 'should return ok if valid request' do
    sign_in_user @merchant_admin
    post api_v1_log_path, params: @parameters
    assert_response :ok
  end

  test 'should log debug message' do
    sign_in_user @merchant_admin
    assert_logs(:debug, 'Test log message') do
      post api_v1_log_path, params: @parameters
      assert_response :ok
    end
  end

  test 'should log info message' do
    sign_in_user @merchant_admin
    @parameters[:severity] = 'info'
    assert_logs(:info, 'Test log message') do
      post api_v1_log_path, params: @parameters
      assert_response :ok
    end
  end

  test 'should log warning message' do
    sign_in_user @merchant_admin
    @parameters[:severity] = 'warn'
    assert_logs(:warn, 'Test log message') do
      post api_v1_log_path, params: @parameters
      assert_response :ok
    end
  end

  test 'should log error message' do
    sign_in_user @merchant_admin
    @parameters[:severity] = 'error'
    assert_logs(:error, 'Test log message') do
      post api_v1_log_path, params: @parameters
      assert_response :ok
    end
  end
end
