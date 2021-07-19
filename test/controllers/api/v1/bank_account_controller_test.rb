# frozen_string_literal: true

require 'test_helper'

class Api::V1::BankAccountControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    stub_user_state
  end

  def stub_user_state
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_new)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))
  end

  test 'flinks api when logged in' do
    stub_flinks_logins_post_request
    get api_v1_bank_account_flinks_url
    redirect_uri = URI.parse(response.location)
    assert_equal @partner.wlmp_vanity_url, redirect_uri.host
  end

  test 'flinks api when logged in and returns an error' do
    stub_error_flinks_logins_post_request
    get api_v1_bank_account_flinks_url
    assert_response :bad_request
  end

  test '#flinks_request_state' do
    stub_flinks_logins_get_request
    get api_v1_bank_account_flinks_request_state_url('flinks-query-6utghW2hP8bv5zoh')
    assert_equal 200, JSON.parse(response.body)['status']
  end

  test '#flinks_request_state when no access token is available' do
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)
    stub_flinks_logins_get_request
    get api_v1_bank_account_flinks_request_state_url('flinks-query-6utghW2hP8bv5zoh')
    assert_equal 401, JSON.parse(response.code)
    assert_equal 'Access token is not available.', JSON.parse(response.body)['message']
  end

  test '#flinks_request_state - unprocessable entity' do
    stub_flinks_logins_get_request_unprocessable_entity
    get api_v1_bank_account_flinks_request_state_url('flinks-query-6utghW2hP8bv5zoh')
    assert_equal 422, JSON.parse(response.body)['status']
  end

  def stub_flinks_logins_post_request(owner_guid = nil)
    stub_request(:post, 'http://localhost:3000/api/flinks/logins')
      .with(
        body: { institution_name: nil, login_id: nil, owner_guid: owner_guid, owner: nil },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          Host: 'localhost:3000'
        }
      )
      .to_return(status: 200, body: '', headers: {})
  end

  def stub_error_flinks_logins_post_request(owner_guid = nil)
    stub_request(:post, 'http://localhost:3000/api/flinks/logins')
      .with(
        body: { institution_name: nil, login_id: nil, owner_guid: owner_guid, owner: nil },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          Host: 'localhost:3000'
        }
      )
      .to_raise(RestClient::BadRequest.new(RestClient::Response.new('{"status": 400, "code": 40010, "message": ""}')))
  end

  def stub_flinks_logins_get_request
    stub_request(:get, 'http://localhost:3000/api/flinks/logins/flinks-query-6utghW2hP8bv5zoh')
      .with(
        headers: {
          'Accept' => 'application/json',
          'Content-Type' => 'application/json',
          'Host' => 'localhost:3000'
        }
      )
      .to_return(status: 200, body: '', headers: {})
  end

  def stub_flinks_logins_get_request_unprocessable_entity
    stub_request(:get, 'http://localhost:3000/api/flinks/logins/flinks-query-6utghW2hP8bv5zoh')
      .to_raise(RestClient::UnprocessableEntity.new(RestClient::Response.new('{"status": 422, "code": 40010, "message": "Account is not a business account"}')))
  end
end
