# frozen_string_literal: true

require 'test_helper'
require 'minitest/mock'

class ApplicationHelperTest < ActionDispatch::IntegrationTest
  setup do
    assign_intercom_enabled(true)
  end

  teardown do
    assign_intercom_enabled(false)
  end

  def sign_in_and_load_user
    stub_vanity_host
    stub_users(@partner)
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
    sign_in_user @merchant_admin
  end

  test 'intercom must be defined in Rails secrets' do
    assert defined? Rails.application.secrets.intercom[:enabled]
  end

  test '#intercom_enabled returns true if secret is set and load_testing is not true' do
    Rails.application.secrets.stubs(:intercom).returns(enabled: true)
    Rails.application.secrets.stubs(:load_testing).returns(nil)

    assert intercom_enabled?
  end

  test '#intercom_enabled returns false if secret is not set' do
    sign_in_and_load_user
    assign_intercom_enabled(false)

    assert_not intercom_enabled?
  end

  test '#intercom_enabled returns false if no env vars set' do
    sign_in_and_load_user
    Rails.application.secrets.stubs(:intercom).returns({})
    Rails.application.secrets.stubs(:load_testing).returns(nil)

    assert_not intercom_enabled?
  end

  test '#intercom_enabled returns false when load_testing is true' do
    sign_in_and_load_user
    Rails.application.secrets.stubs(:intercom).returns(enabled: true)
    Rails.application.secrets.stubs(:load_testing).returns(true)

    assert_not intercom_enabled?
  end

  test '#embed_intercom returns true only if user is signed in and intercom[:enabled] is set' do
    sign_in_and_load_user

    assert embed_intercom?
  end

  test '#embed_intercom returns false if user is not signed in' do
    stubs(:user_signed_in?).returns(nil)

    assert_not embed_intercom?
  end

  test '#embed_intercom returns false if user signed in but intercom[:enabled] is not set' do
    sign_in_and_load_user
    assign_intercom_enabled(false)

    assert_not embed_intercom?
  end

  test '#merchant_info returns correct merchant info array if user is signed in' do
    sign_in_and_load_user

    stub_merchant_lookup_api(current_user.merchant_on_selected_profile)
    assert_equal merchant_array, merchant_info
  end

  test '#merchant_info returns nil if user has no merchant_on_selected_profile' do
    sign_in_and_load_user
    User.any_instance.stubs(:merchant_on_selected_profile).returns(nil)
    assert_nil merchant_info
  end

  test '#merchant_info returns nil if theres no user session' do
    stubs(:current_user).returns(nil)

    assert_nil merchant_info
  end

  test '#merchant_info does not return merchant name if merchant_request raises exception' do
    sign_in_and_load_user

    ZetatangoService.any_instance.stubs(:merchant_lookup).raises(ZetatangoService::ZetatangoServiceException)
    merchant_array_without_name = [merchant_array.first.except(:name)]

    assert_includes merchant_info, company_id: current_user.merchant_on_selected_profile
    assert_equal merchant_array_without_name, merchant_info
  end

  test '#gtm_container_id returns the current partners gtm_container_id' do
    sign_in_and_load_user

    assert_equal gtm_container_id, current_partner.gtm_container_id
  end

  test '#gtm_container_id returns nil if no current partner present' do
    stubs(:current_partner).returns(nil)
    sign_in_and_load_user

    assert_nil gtm_container_id
  end

  test '#intercom_config returns user info' do
    app_id = SecureRandom.uuid
    secret = SecureRandom.base58(32)

    Rails.application.secrets.stubs(:intercom).returns(
      enabled: true,
      app_id: app_id,
      identity_verification_secret: secret
    )

    sign_in_and_load_user

    config = intercom_config

    assert_equal @merchant_admin.name, config[:name]
    assert_equal @merchant_admin.email, config[:email]
    assert_equal @merchant_admin.uid, config[:user_id]
    assert_equal OpenSSL::HMAC.hexdigest('sha256', secret, @merchant_admin.uid), config[:user_hash]
  end

  test '#intercom_config returns no user info if no user is signed in' do
    stubs(:user_signed_in?).returns(nil)

    config = intercom_config

    assert_nil config[:name]
    assert_nil config[:email]
    assert_nil config[:user_id]
    assert_nil config[:user_hash]
  end

  private

  def assign_intercom_enabled(enabled)
    Rails.application.secrets.stubs(:intercom).returns(enabled: enabled)
    Rails.application.secrets.stubs(:load_testing).returns(!enabled)
  end

  def merchant_array
    [{ company_id: current_user.merchant_on_selected_profile, name: 'Merchant_1' }]
  end

  def stub_merchant_lookup_api(merchant_guid)
    response_body = {
      id: merchant_guid,
      partner_id: 'p_wSL1HoY9L3VrVh6x',
      email: 'mer1@example.com',
      partner_merchant_id: '12345678900',
      business_num: '12345678900',
      name: 'Merchant_1',
      address: '15 Fitzgerald Rd, Bells Corners, ON',
      incorporated_in: nil,
      campaigns: []
    }.to_json

    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{merchant_guid}")
      .with(
        headers: {
          authorization: "Bearer #{@idp_access_token}"
        }
      )
      .to_return(status: 200, body: response_body)
  end
end
