# frozen_string_literal: true

require 'test_helper'

class FacebooksControllerTest < ActionDispatch::IntegrationTest
  include OmniauthProviderHelper

  test '#start redirects to login if not signed in' do
    get facebook_start_path

    assert_redirected_to flow_result_path(status: FacebookController::FAILURE_STATUS)
  end

  test '#start redirects auth/facebook' do
    sign_in_user

    uuid = SecureRandom.uuid
    secure_token = SecureRandom.base58(16)

    SecureRandom.stubs(:uuid).returns(uuid)
    SecureRandom.stubs(:base58).returns(secure_token)

    get facebook_start_path

    assert_redirected_to "#{Rails.configuration.foghorn_url}auth/facebook?flow_id=#{uuid}&token=#{secure_token}"
  end

  test '#start saves context in Redis' do
    sign_in_user

    SecureRandom.stubs(:uuid).returns('123')

    access_token = SecureRandom.base58(32)

    ApplicationController.any_instance.stubs(:current_access_token).returns(access_token)

    get facebook_start_path

    expected_context = {
      merchant_id: @merchant_admin_m_guid,
      partner_id: @partner.id,
      return_url: 'http://acme-wlmp.zetatango.com/flow_result',
      access_token: access_token
    }

    assert_equal expected_context, Rails.cache.read('123', namespace: FacebookController::REDIS_NAMESPACE)
  end

  test '#callback redirects to flow_result with success status' do
    # add temp route to avoid omniauth to take over the callback
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    stub_post_merchant

    get facebook_callback_path, headers: { "omniauth.auth": test_omniauth_auth }

    assert_redirected_to "#{test_context[:return_url]}?status=#{FacebookController::SUCCESS_STATUS}"

    Rails.application.reload_routes!
  end

  test '#callback updates merchant info' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    Timecop.freeze(Time.now) do
      stub_post_merchant

      get facebook_callback_path, headers: { "omniauth.auth": test_omniauth_auth }

      assert_requested :put,
                       "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}",
                       headers: { Authorization: "Bearer #{test_bearer_token}" },
                       body: JSON.parse({
                         facebook_access_token: test_access_token,
                         facebook_access_token_expires_at: test_access_token_expires_at
                       }.to_json),
                       times: 1
    end

    Rails.application.reload_routes!
  end

  test '#callback handles invalid api response' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    Timecop.freeze(Time.now) do
      stub_post_merchant_unauthenticated

      get facebook_callback_path, headers: { "omniauth.auth": test_omniauth_auth }
    end

    assert_redirected_to "#{test_context[:return_url]}?status=#{FacebookController::FAILURE_STATUS}"

    Rails.application.reload_routes!
  end

  test '#callback handles api exception' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Bugsnag.expects(:notify)

    Rails.cache.stubs(:read).returns(test_context)

    stub_post_merchant_exception

    get facebook_callback_path, headers: { "omniauth.auth": test_omniauth_auth }

    assert_redirected_to "#{test_context[:return_url]}?status=#{FacebookController::FAILURE_STATUS}"

    Rails.application.reload_routes!
  end

  test '#callback fails facebook connect if token is not in the omniauth.auth' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    omniauth_params = test_omniauth_auth
    omniauth_params[:credentials][:token] = nil

    Rails.logger.expects(:error).with("Unable to update merchant #{test_merchant_id}: Access token not present in the Facebook response")

    get facebook_callback_path, headers: { "omniauth.auth": omniauth_params }

    assert_redirected_to "#{test_context[:return_url]}?status=#{FacebookController::FAILURE_STATUS}"

    Rails.application.reload_routes!
  end

  test '#callback fails facebook connect if expires is not in the omniauth.auth ' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    omniauth_params = test_omniauth_auth
    omniauth_params[:credentials][:expires] = nil

    Rails.logger.expects(:error).with("Unable to update merchant #{test_merchant_id}: expires missing from the Facebook response")

    get facebook_callback_path, headers: { "omniauth.auth": omniauth_params }

    assert_redirected_to "#{test_context[:return_url]}?status=#{FacebookController::FAILURE_STATUS}"

    Rails.application.reload_routes!
  end

  test '#callback fails facebook connect if access_token expires at is not in the omniauth.auth and expires is true' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    omniauth_params = test_omniauth_auth
    omniauth_params[:credentials][:expires_at] = nil
    omniauth_params[:credentials][:expires] = true

    Rails.logger.expects(:error).with("Unable to update merchant #{test_merchant_id}: expires_at missing from the Facebook response")

    get facebook_callback_path, headers: { "omniauth.auth": omniauth_params }

    assert_redirected_to "#{test_context[:return_url]}?status=#{FacebookController::FAILURE_STATUS}"

    Rails.application.reload_routes!
  end

  test '#callback does not fail facebook connect if access_token expires at is not in the omniauth.auth and expires is false' do
    Rails.application.routes.draw do
      get '/facebook_callback', to: 'facebook#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)

    omniauth_params = test_omniauth_auth
    omniauth_params[:credentials][:expires_at] = nil
    omniauth_params[:credentials][:expires] = false

    Timecop.freeze(Time.now) do
      stub_post_merchant

      get facebook_callback_path, headers: { "omniauth.auth": omniauth_params }

      assert_requested :put,
                       "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}",
                       headers: { Authorization: "Bearer #{test_bearer_token}" },
                       body: JSON.parse({
                         facebook_access_token: test_access_token
                       }.to_json),
                       times: 1
    end

    Rails.application.reload_routes!
  end

  test '#failure redirects to flow_result with fail status' do
    return_url = 'http://example.com'

    Rails.cache.stubs(:read).returns(return_url: return_url)

    get auth_facebook_failure_path

    assert_redirected_to "#{return_url}?status=#{FacebookController::FAILURE_STATUS}"
  end

  private

  def test_omniauth_auth
    {
      credentials: {
        token: test_access_token,
        expires_at: Time.now.to_i,
        expires: true
      }
    }
  end

  def test_access_token
    'test_acccess_token'
  end

  def test_access_token_expires_at
    Time.now.utc.to_i
  end
end
