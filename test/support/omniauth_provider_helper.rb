# frozen_string_literal: true

module OmniauthProviderHelper
  extend ActiveSupport::Concern

  private

  def sign_in_user
    stub_vanity_host
    stub_users(@partner)

    stub_user_state(@merchant_admin, user_signed_in: true)
    @merchant_admin.selected_profile = @merchant_admin_p_guid
  end

  def test_context
    {
      return_url: 'http://example.com',
      merchant_id: test_merchant_id,
      access_token: test_bearer_token
    }
  end

  def stub_post_merchant
    stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}")
      .to_return(status: 200, body: '', headers: {})
  end

  def stub_post_merchant_unauthenticated
    stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}")
      .to_return(status: 401, body: '', headers: {})
  end

  def stub_put_merchant_unknown_error
    stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}")
      .to_return(status: 500, body: { status: 500, code: 20_001, message: '' }.to_json, headers: {})
  end

  def stub_post_merchant_exception
    stub_request(:put, "#{Rails.configuration.zetatango_url}api/merchants/#{test_merchant_id}")
      .to_raise(Errno::ECONNREFUSED)
  end

  def test_bearer_token
    '123'
  end

  def test_merchant_id
    'm_123'
  end
end
