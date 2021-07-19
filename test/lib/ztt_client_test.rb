# frozen_string_literal: true

require 'test_helper'
require 'ztt_client'

class ZttClientTest < ActionDispatch::IntegrationTest
  test 'nil api access token throws error' do
    assert_raise ZttClient::ApiAccessTokenException do
      ZttClient.new('')
    end
  end

  test 'can create ztt client' do
    assert_not_nil ZttClient.new(SecureRandom.base58(32))
  end

  test 'ztt client can access financing api' do
    assert_not_nil ZttClient.new(SecureRandom.base58(32)).financing_api
  end

  test 'ztt client can access merchants api' do
    assert_not_nil ZttClient.new(SecureRandom.base58(32)).merchants_api
  end

  test 'ztt client can access merchant documents api' do
    assert_not_nil ZttClient.new(SecureRandom.base58(32)).merchant_documents_api
  end

  test 'ztt client can access lending api' do
    assert_not_nil ZttClient.new(SecureRandom.base58(32)).lending_api
  end
end
