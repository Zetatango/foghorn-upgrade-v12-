# frozen_string_literal: true

require 'test_helper'

class QuickbooksControllerTest < ActionDispatch::IntegrationTest
  include OmniauthProviderHelper

  test '#start redirects to login if not signed in' do
    get quickbooks_start_path
    assert_redirected_to flow_result_path(status: QuickbooksController::FAILURE_STATUS)
  end

  test '#start redirects auth/quickbooks' do
    sign_in_user

    uuid = SecureRandom.uuid
    secure_token = SecureRandom.base58(16)

    SecureRandom.stubs(:uuid).returns(uuid)
    SecureRandom.stubs(:base58).returns(secure_token)

    get quickbooks_start_path

    assert_redirected_to "#{Rails.configuration.foghorn_url}auth/quickbooks?flow_id=#{uuid}&token=#{secure_token}"
  end

  test '#start saves context in Redis' do
    sign_in_user
    SecureRandom.stubs(:uuid).returns('123')
    access_token = SecureRandom.base58(32)
    ApplicationController.any_instance.stubs(:current_access_token).returns(access_token)
    get quickbooks_start_path
    expected_context = {
      merchant_id: @merchant_admin_m_guid,
      partner_id: @partner.id,
      return_url: 'http://acme-wlmp.zetatango.com/flow_result',
      access_token: access_token
    }
    assert_equal expected_context, Rails.cache.read('123', namespace: QuickbooksController::REDIS_NAMESPACE)
  end

  test '#callback redirects to flow_result with success status' do
    # add temp route to avoid omniauth to take over the callback
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    stub_post_merchant
    get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::SUCCESS_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback updates merchant info' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end

    Rails.cache.stubs(:read).returns(test_context)
    Timecop.freeze(Time.now) do
      stub_post_merchant
      get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
      assert_requested :put,
                       "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}",
                       headers: { Authorization: "Bearer #{test_bearer_token}" },
                       body: JSON.parse({
                         quickbooks_refresh_token: test_refresh_token,
                         quickbooks_refresh_token_expires_at: Time.now.utc + test_expires_in,
                         quickbooks_realm_id: test_realm_id
                       }.to_json),
                       times: 1
    end

    Rails.application.reload_routes!
  end

  test '#callback handles invalid api response' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    Timecop.freeze(Time.now) do
      stub_post_merchant_unauthenticated
      get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
    end
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback handles realm ID changed error in api response' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    Timecop.freeze(Time.now) do
      stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{test_context[:merchant_id]}")
        .to_return(status: 422, body: { status: 422, code: 20_008, message: '' }.to_json, headers: {})
      get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
    end
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}&message=REALM_ID_CHANGED"
    Rails.application.reload_routes!
  end

  test '#callback handles unknown error in api response' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    Timecop.freeze(Time.now) do
      stub_put_merchant_unknown_error
      get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
    end
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback handles api error response with bad json' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    Timecop.freeze(Time.now) do
      stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{test_context[:merchant_id]}")
        .to_return(status: 422, body: 'not a json {', headers: {})
      get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
    end
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback handles api exception' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Bugsnag.expects(:notify)
    Rails.cache.stubs(:read).returns(test_context)
    stub_post_merchant_exception
    get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }, params: { realmId: test_realm_id }
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback fails quickbook connect if realmId is not in parameters' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    Rails.logger.expects(:error).with("Unable to update merchant #{test_merchant_id}: Realm ID not specified in QuickBooks response")
    get quickbooks_callback_path, headers: { "omniauth.auth": test_omniauth_auth }
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback fails quickbook connect if refresh_token is not in the omniauth.auth' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    omniauth_params = test_omniauth_auth
    omniauth_params[:credentials][:refresh_token] = nil
    Rails.logger.expects(:error).with("Unable to update merchant #{test_merchant_id}: Refresh token not present in the QuickBook response")
    get quickbooks_callback_path, headers: { "omniauth.auth": omniauth_params }
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#callback fails quickbook connect if refresh_token expiry time is not in the omniauth.auth' do
    Rails.application.routes.draw do
      get '/quickbooks_callback', to: 'quickbooks#callback'
    end
    Rails.cache.stubs(:read).returns(test_context)
    omniauth_params = test_omniauth_auth
    omniauth_params[:extra][:raw_info][:x_refresh_token_expires_in] = nil
    Rails.logger.expects(:error).with("Unable to update merchant #{test_merchant_id}: x_refresh_token_expires_in missing from the QuickBooks response")
    get quickbooks_callback_path, headers: { "omniauth.auth": omniauth_params }
    assert_redirected_to "#{test_context[:return_url]}?status=#{QuickbooksController::FAILURE_STATUS}"
    Rails.application.reload_routes!
  end

  test '#failure redirects to flow_result with fail status' do
    return_url = 'http://example.com'
    Rails.cache.stubs(:read).returns(return_url: return_url)
    get auth_quickbooks_failure_path
    assert_redirected_to "#{return_url}?status=#{QuickbooksController::FAILURE_STATUS}"
  end

  private

  def test_omniauth_auth
    {
      credentials: {
        refresh_token: test_refresh_token
      },
      extra: {
        raw_info: {
          x_refresh_token_expires_in: test_expires_in
        }
      }
    }
  end

  def test_realm_id
    '123'
  end

  def test_refresh_token
    'test_refresh_token'
  end

  def test_expires_in
    1000
  end
end
