# frozen_string_literal: true

require 'minitest/autorun'

require 'test_helper'

class RequestValidatorTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test 'GET with a valid path with an invalid encoding returns not_found' do
    get '/logout.cfm%DE~%C7%1FY'
    assert_response :not_found
  end

  test 'GET with invalid path with an invalid encoding returns not_found' do
    get '/assets/jquery.js%DE~%C7%1FY'
    assert_response :not_found
  end

  test 'GET with a valid path and a parameter with invalid encoding strips the parameters' do
    get '/logout?param=cfm%DE~%C7%1FY'
    assert_response :not_found
  end

  test 'GET with a valid path and a parameter with null byte returns not_found' do
    get "/logout?param=\u0000value"
    assert_response :not_found
  end

  test 'GET with a valid path and a parameter with no value returns redirect' do
    get '/logout?param='
    assert_response :redirect
  end

  test 'Get with a valid path with a valid binary encoding returns success' do
    class ::FoobarController < ActionController::Base
      skip_parameter_encoding :foobar
      def foobar
        render inline: 'Hello, world!'
      end
    end

    Rails.application.routes.draw do
      get 'foobar', to: 'foobar#foobar'
    end

    get '/foobar.%DE~%C7%1FY'
    assert_response :success
    assert_match 'Hello, world!', response.body
  ensure
    Rails.application.reload_routes!
  end

  test 'GET with a path containing a null byte returns not_found' do
    get '/assets/application.jspasswd%00'
    assert_response :not_found
  end

  test 'GET with an invalid mime type returns not_found' do
    get '/utils/root', headers: { HTTP_ACCEPT: '../../../../../../../../../../../../../../../../e*c/p*s*d{{' }
    assert_response :not_found
  end

  test 'GET with content type with an invalid mime type returns not found' do
    get '/utils/root', headers: { CONTENT_TYPE: '../../../../../../../../../../../../../../../../e*c/p*s*d{{' }
    assert_response :not_found
  end

  test 'POST with content type with an invalid mime type returns not found' do
    post '/utils/root', headers: { CONTENT_TYPE: '../../../../../../../../../../../../../../../../e*c/p*s*d{{' }
    assert_response :not_found
  end

  test 'POST with parse error returns not found' do
    sign_in_user @merchant_admin
    params = '{"message":"Test log message","severity":"info%00'

    post api_v1_log_path, headers: { CONTENT_TYPE: 'application/json' }, params: params
    assert_response :not_found
  end

  test 'POST to CSP create report endpoint with JSON parse error returns not found' do
    params = '{'

    post csp_reports_path, params: params
    assert_response :not_found
  end
end
