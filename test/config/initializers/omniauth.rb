# frozen_string_literal: true

require 'test_helper'

class OmniauthTest < ActionDispatch::IntegrationTest
  include Rack::Test::Methods

  test 'redirects to 500.html on user auth failure' do
    get "/auth/user/callback?code=#{SecureRandom.base58(32)}&state=#{SecureRandom.base58(32)}"
    follow_redirect!
    assert last_response.redirect?
    assert last_response.original_headers['Location'].ends_with?('500.html')
  end
end
