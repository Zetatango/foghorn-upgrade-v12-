# frozen_string_literal: true

require 'test_helper'

class RackAttackTest < ActionDispatch::IntegrationTest
  include Rack::Test::Methods

  def setup
    ENV['FIREWALL'] = 'true'
    ENV['CHECK_UA'] = 'false'
    Rails.env = 'production'
    ENV['SPACE_OUTBOUND_IPS'] = '1.2.3.6'
    ENV['WHITELISTED_IP_ADDRESSES'] = '127.0.0.1'
    ENV['WHITELISTED_IP_RANGES'] = '192.168.1.0/24'
    ENV['WHITELISTED_COUNTRIES'] = 'CA'
    ENV['BLACKLISTED_IP_ADDRESSES'] = '8.8.8.8'
    ENV['BLACKLISTED_COUNTRIES'] = 'CN,KP,RU'
    @internal_ip = '1.2.3.6'
    @external_ip = '99.9.9.0'
    @anonymous_ip = '74.82.9.224'
    @localhost = '127.0.0.1'
    @whitelisted_ip = '206.47.89.121' # Known Canadian IP address
    @whitelisted_ip_in_range = '192.168.1.137'
    @blacklisted_ip = '8.8.8.8'
    @blacklisted_ip2 = '106.114.66.249' # Known Chinese IP address
    @throttle_ip = '9.8.7.6'
    @blank_user_agent = ''
    Rack::Attack.cache.prefix = "rack::attack_#{SecureRandom.uuid}"
  end

  def teardown
    ENV['FIREWALL'] = 'false'
    Rails.env = 'test'

    # Clear the Rack Attack cache to reset throttle counts to not affect test cases.
    Rails.cache.clear
  end

  test 'allow connection from secure port, outside ranges, in production' do
    get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @external_ip
    assert last_response.redirect?
  end

  test 'allow connection from port 80, outside ranges, in production' do
    assert_logs :info, "Request to endpoint / from IP address #{@external_ip} was blocked for violating the platform blocklist" do
      get '/', {}, 'HTTPS' => 'off', 'REMOTE_ADDR' => @external_ip
      assert last_response.not_found?
    end
  end

  # Can't directly make this call, but Rack::Attack spits out 404s, so any other response means it's not being
  # blocked by Rack::Attack.
  test 'allow connection from port 443, logout, internal ranges, in production' do
    post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @internal_ip
    assert last_response.bad_request?
  end

  test 'block connection from port 443, logout, external ranges, in production' do
    assert_logs :info, "Request to endpoint /backchannel_logout from IP address #{@external_ip} was blocked for violating the platform blocklist" do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @external_ip
      assert last_response.not_found?
    end
  end

  test 'allow connection from port 80, outside ranges , in production' do
    assert_logs :info, "Request to endpoint / from IP address #{@external_ip} was blocked for violating the platform blocklist" do
      get '/', {}, 'HTTPS' => 'off', 'REMOTE_ADDR' => @external_ip
      assert last_response.not_found?
    end
  end

  test 'block connection from secure port, our app ip, in production' do
    assert_logs :info, "Request to endpoint / from IP address #{@internal_ip} was blocked for violating the platform blocklist" do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @internal_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from blacklisted IP address, merchants, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint /merchants from IP address #{@blacklisted_ip} was blocked for violating the IP address blacklist" do
      get '/merchants', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @blacklisted_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from blacklisted IP address, /, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint / from IP address #{@blacklisted_ip} was blocked for violating the IP address blacklist" do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @blacklisted_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from blacklisted IP address, backchannel_logout, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint /backchannel_logout from IP address #{@blacklisted_ip} was blocked for violating the IP address blacklist" do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @blacklisted_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from blacklisted country, merchants, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint /merchants from IP address #{@blacklisted_ip2} was blocked for violating the country blacklist" do
      get '/merchants', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @blacklisted_ip2
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from blacklisted country, /, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint / from IP address #{@blacklisted_ip2} was blocked for violating the country blacklist" do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @blacklisted_ip2
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from blacklisted country, backchannel_logout, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint /backchannel_logout from IP address #{@blacklisted_ip2} was blocked for violating the country blacklist" do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @blacklisted_ip2
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from anonymous IP address, merchants, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint /merchants from IP address #{@anonymous_ip} was blocked for originating from an anonymous IP address" do
      get '/merchants', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @anonymous_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from anonymous IP address, /, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint / from IP address #{@anonymous_ip} was blocked for originating from an anonymous IP address" do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @anonymous_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443; HTTPS on; from anonymous IP address, backchannel_logout, block due to blocked IP address' do
    assert_logs :info, "Request to endpoint /backchannel_logout from IP address #{@anonymous_ip} was blocked for originating from an anonymous IP address" do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @anonymous_ip
      assert last_response.not_found?
    end
  end

  test 'when coming from port 443, HTTPS on, from single whitelisted IP address, /, do not throttle' do
    5.times do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @localhost
      assert last_response.redirect?
    end

    get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @localhost
    assert last_response.redirect?
  end

  test 'when coming from port 443, HTTPS on, from IP in whitelisted range, /, do not throttle' do
    5.times do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip_in_range
      assert last_response.redirect?
    end

    get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip_in_range
    assert last_response.redirect?
  end

  test 'when coming from port 443, HTTPS on, from whitelisted IP address, /backchannel_logout, do not throttle' do
    # Because we are not currently logged in, this will generate a bad request, but this still indicates that we were not blocked/throttled
    5.times do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @localhost
      assert last_response.bad_request?
    end

    post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @localhost
    assert last_response.bad_request?
  end

  test 'when coming from port 443; HTTPS on; from whitelisted country, /, do not throttle' do
    5.times do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip
      assert last_response.redirect?
    end

    get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip
    assert last_response.redirect?
  end

  test 'when coming from port 443, HTTPS on, from whitelisted country, /backchannel_logout, do not throttle' do
    # Because we are not currently logged in, this will generate a bad request, but this still indicates that we were not blocked/throttled
    5.times do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip
      assert last_response.bad_request?
    end

    post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip
    assert last_response.bad_request?
  end

  test 'when coming from port 443; HTTPS on; from unknown IP address, /, throttle then block' do
    5.times do
      assert_logs :info, "Request to endpoint / from IP address #{@throttle_ip} was throttled" do
        get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
        assert last_response.redirect?
      end
    end

    # Throttle limit exceeded, we are now blocked
    get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
    assert last_response.not_found?
  end

  test 'when coming from port 443; HTTPS on; from unknown IP address, /csp_reports, do not throttle or block' do
    5.times do
      post '/csp_reports', {}, 'RAW_POST_DATA' => '{}', 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
      assert last_response.ok?
    end

    post '/csp_reports', {}, 'RAW_POST_DATA' => '{}', 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
    assert last_response.ok?
  end

  test 'when coming from port 443; HTTPS on; from unknown IP address, init_authenticate, throttle then block' do
    guid = "app_#{SecureRandom.base58(16)}"
    ApplicationController.any_instance.expects(:redis_unavailable?).returns(false).twice

    2.times do
      assert_logs :info, "Request to endpoint /api/v1/applicants/#{guid}/authenticate from IP address #{@throttle_ip} was throttled" do
        post "/api/v1/applicants/#{guid}/authenticate", {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
        assert last_response.redirect?
      end
    end

    # Throttle limit exceeded, we are now blocked
    post "/api/v1/applicants/#{guid}/authenticate", {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
    assert last_response.not_found?
  end

  test 'when coming from port 443, HTTPS on, from unknown IP address, authenticate, throttle then block' do
    guid = "app_#{SecureRandom.base58(16)}"
    ApplicationController.any_instance.expects(:redis_unavailable?).returns(false).twice

    2.times do
      assert_logs :info, "Request to endpoint /api/v1/applicants/#{guid}/authenticate from IP address #{@throttle_ip} was throttled" do
        put "/api/v1/applicants/#{guid}/authenticate", {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
        assert last_response.redirect?
      end
    end

    # Throttle limit exceeded, we are now blocked
    put "/api/v1/applicants/#{guid}/authenticate", {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @throttle_ip
    assert last_response.not_found?
  end

  test 'when coming from port 443, HTTPS on, from unknown IP address, /backchannel_logout, throttle then block' do
    5.times do
      assert_logs :info, "Request to endpoint /backchannel_logout from IP address #{@internal_ip} was throttled" do
        post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @internal_ip
        assert last_response.bad_request?
      end
    end

    # Throttle limit exceeded, we are now blocked
    post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @internal_ip
    assert last_response.not_found?
  end

  test 'when coming from port 443; HTTPS on; with an empty user agent, merchants, block due to having no user agent' do
    ENV['CHECK_UA'] = 'true'
    assert_logs :info, "Request to endpoint /merchants from IP address #{@whitelisted_ip} was blocked due to empty user agent" do
      get '/merchants', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip, 'HTTP_USER_AGENT' => @blank_user_agent
      assert last_response.not_found?
    end
    ENV['CHECK_UA'] = 'false'
  end

  test 'when coming from port 443; HTTPS on; with an empty user agent, /, block due to having no user agent' do
    ENV['CHECK_UA'] = 'true'
    assert_logs :info, "Request to endpoint / from IP address #{@whitelisted_ip} was blocked due to empty user agent" do
      get '/', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip, 'HTTP_USER_AGENT' => @blank_user_agent
      assert last_response.not_found?
    end
    ENV['CHECK_UA'] = 'false'
  end

  test 'when coming from port 443; HTTPS on; with an empty user agent, backchannel_logout, block due to having no user agent' do
    ENV['CHECK_UA'] = 'true'
    assert_logs :info, "Request to endpoint /backchannel_logout from IP address #{@whitelisted_ip} was blocked due to empty user agent" do
      post '/backchannel_logout', {}, 'HTTPS' => 'on', 'REMOTE_ADDR' => @whitelisted_ip, 'HTTP_USER_AGENT' => @blank_user_agent
      assert last_response.not_found?
    end
    ENV['CHECK_UA'] = 'false'
  end
end
