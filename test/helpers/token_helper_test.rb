# frozen_string_literal: true

require 'test_helper'

class TokenHelperTest < ActionDispatch::IntegrationTest
  include TokenHelper

  #
  # #owner_guid_from_token
  #
  test 'returns nil when token is not present' do
    jwt = nil

    assert_equal(nil, owner_guid_from_token(jwt))
  end

  test 'returns merchant_guid from token' do
    merchant_guid = "m_#{SecureRandom.base58(16)}"
    jwt = access_token(properties: { merchant: merchant_guid })

    assert_equal(merchant_guid, owner_guid_from_token(jwt))
  end

  test 'returns lead_guid from token' do
    lead_guid = "lead_#{SecureRandom.base58(16)}"
    jwt = access_token(properties: { lead: lead_guid })

    assert_equal(lead_guid, owner_guid_from_token(jwt))
  end
end
