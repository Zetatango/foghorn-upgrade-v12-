# frozen_string_literal: true

require 'test_helper'

class Api::V1::ConfigurationControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @service = SessionManagerService.instance
    @service.delete_all

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
  end

  teardown do
    @service.delete_all
    assign_address_autocomplete('')
  end

  def setup_configuration
    sign_in_user @merchant_new
    get api_v1_configuration_path
    assert_response :ok
    JSON.parse(response.body).deep_symbolize_keys
  end

  def setup_app_version
    sign_in_user @merchant_new
    get api_v1_app_version_path
    assert_response :ok
    JSON.parse(response.body).deep_symbolize_keys
  end

  test 'config when logged in as merchant new returns ok' do
    sign_in_user @merchant_new
    get api_v1_configuration_path
    assert_response :ok
  end

  test 'config when logged in as merchant admin returns ok' do
    sign_in_user @merchant_admin
    get api_v1_configuration_path
    assert_response :ok
  end

  test 'config when in delegated access returns ok' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    get api_v1_configuration_path

    assert_response :ok
  end

  test 'config when not logged in redirects to root' do
    get api_v1_configuration_path
    assert_redirected_to root_path
  end

  test 'config returns address_autocomplete_enabled as true when it is enabled' do
    assign_address_autocomplete('abc123')
    config = setup_configuration
    assert_equal true, config[:address_autocomplete_enabled]
  end

  test 'config returns adddress_autocomplete_enabled as false when it is not enabled' do
    assign_address_autocomplete('')
    config = setup_configuration
    assert_equal false, config[:address_autocomplete_enabled]
  end

  test 'config returns flinks_max_polling interval when it is enabled' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_poll_interval: '8000')
    config = setup_configuration
    assert_equal '8000', config[:flinks][:poll_interval]
  end

  test 'config returns flinks_poll_interval as zero when it is not enabled' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_poll_interval: nil)
    config = setup_configuration
    assert_equal 0, config[:flinks][:poll_interval]
  end

  test 'config returns flinks_max_polling when it is enabled' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_max_polling: '45')
    config = setup_configuration
    assert_equal '45', config[:flinks][:max_polling]
  end

  test 'config returns flinks_url when env var is set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_url: 'https://test-iframe.private.fin.ag/')
    config = setup_configuration
    assert_equal 'https://test-iframe.private.fin.ag/', config[:flinks][:flinks_url]
  end

  test 'config returns flinks_url as empty string when env var is not set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_url: nil)
    config = setup_configuration
    assert_equal '', config[:flinks][:flinks_url]
  end

  test 'config returns flinks_creds when env var is set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_creds: 'Credential/MitsubishiGinkou')
    config = setup_configuration
    assert_equal 'Credential/MitsubishiGinkou', config[:flinks][:flinks_creds]
  end

  test 'config returns flinks_creds as empty string when env var is not set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_creds: nil)
    config = setup_configuration
    assert_equal '', config[:flinks][:flinks_creds]
  end

  test 'config returns flinks_opts when env var is set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_opts: '?demo=true')
    config = setup_configuration
    assert_equal '?demo=true', config[:flinks][:flinks_opts]
  end

  test 'config returns flinks_opts as empty string when env var is not set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_opts: nil)
    config = setup_configuration
    assert_equal '', config[:flinks][:flinks_opts]
  end

  test 'config returns flinks_uri when env var set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_uri: ':urn:isbn:0-486-27557-4')
    config = setup_configuration
    assert_equal ':urn:isbn:0-486-27557-4', config[:flinks][:flinks_uri]
  end

  test 'config returns flinks_uri as empty string when env var is not set' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_uri: nil)
    config = setup_configuration
    assert_equal '', config[:flinks][:flinks_uri]
  end

  test 'config returns flinks_max_polling as nil when it is not enabled' do
    Rails.application.secrets.stubs(:flinks).returns(flinks_max_polling: nil)
    config = setup_configuration
    assert_equal 0, config[:flinks][:max_polling]
  end

  test 'config returns empty string for calendly url if environment variable is not set' do
    Rails.application.secrets.stubs(:calendly_url).returns(nil)
    config = setup_configuration
    assert_equal('', config[:calendly_url])
  end

  test 'config returns calendly url if environment variable is set' do
    Rails.application.secrets.stubs(:calendly_url).returns('https://calendly.com')
    config = setup_configuration
    assert_equal('https://calendly.com', config[:calendly_url])
  end

  test 'config returns empty string for sales training calendly url if environment variable is not set' do
    Rails.application.secrets.stubs(:sales_calendly_url).returns(nil)
    config = setup_configuration
    assert_equal('', config[:sales_calendly_url])
  end

  test 'config returns sales training calendly url if environment variable is set' do
    Rails.application.secrets.stubs(:sales_calendly_url).returns('https://calendly.com')
    config = setup_configuration
    assert_equal('https://calendly.com', config[:sales_calendly_url])
  end

  test 'config returns empty string for file_encryption_type if environment variable is not set' do
    Rails.application.secrets.stubs(:file_encryption_type).returns(nil)
    config = setup_configuration
    assert_equal('', config[:file_encryption_type])
  end

  test 'config returns file_encryption_type if environment variable is set' do
    Rails.application.secrets.stubs(:file_encryption_type).returns('none')
    config = setup_configuration
    assert_equal('none', config[:file_encryption_type])
  end

  test 'config returns true if PAF environment variable is set to true (string)' do
    Rails.application.secrets.stubs(:pre_authorized_financing_enabled).returns('true')
    config = setup_configuration
    assert(config[:pre_authorized_financing_enabled] == 'true')
  end

  test 'config returns false if PAF environment variable is set to false (string)' do
    Rails.application.secrets.stubs(:pre_authorized_financing_enabled).returns('false')
    config = setup_configuration
    refute(config[:pre_authorized_financing_enabled] == 'true')
  end

  test 'config returns true if PAF environment variable is set to true' do
    Rails.application.secrets.stubs(:pre_authorized_financing_enabled).returns(true)
    config = setup_configuration
    assert(config[:pre_authorized_financing_enabled])
  end

  test 'config returns false if PAF environment variable is set to false' do
    Rails.application.secrets.stubs(:pre_authorized_financing_enabled).returns(false)
    config = setup_configuration
    refute(config[:pre_authorized_financing_enabled])
  end

  test 'config returns false if PAF environment variable is not set' do
    Rails.application.secrets.stubs(:pre_authorized_financing_enabled).returns(nil)
    config = setup_configuration
    refute(config[:pre_authorized_financing_enabled])
  end

  test 'config returns true if weekly payment environment variable is set to true (string)' do
    Rails.application.secrets.stubs(:weekly_frequency_enabled).returns('true')
    config = setup_configuration
    assert(config[:weekly_repayment_enabled] == 'true')
  end

  test 'config returns false if weekly payment environment variable is set to false (string)' do
    Rails.application.secrets.stubs(:weekly_frequency_enabled).returns('false')
    config = setup_configuration
    refute(config[:weekly_repayment_enabled] == 'true')
  end

  test 'config returns true if weekly payment environment variable is set to true' do
    Rails.application.secrets.stubs(:weekly_frequency_enabled).returns(true)
    config = setup_configuration
    assert(config[:weekly_repayment_enabled])
  end

  test 'config returns false if weekly payment environment variable is set to false' do
    Rails.application.secrets.stubs(:weekly_frequency_enabled).returns(false)
    config = setup_configuration
    refute(config[:weekly_repayment_enabled])
  end

  test 'config returns false if weekly payment environment variable is not set' do
    Rails.application.secrets.stubs(:weekly_frequency_enabled).returns(nil)
    config = setup_configuration
    refute(config[:weekly_repayment_enabled])
  end

  test 'config returns true if enhanced branding environment variable is set to true (string)' do
    Rails.application.secrets.stubs(:enhanced_branding_enabled).returns('true')
    config = setup_configuration
    assert(config[:enhanced_branding_enabled] == 'true')
  end

  test 'config returns false if enhanced branding environment variable is set to false (string)' do
    Rails.application.secrets.stubs(:enhanced_branding_enabled).returns('false')
    config = setup_configuration
    refute(config[:enhanced_branding_enabled] == 'true')
  end

  test 'config returns true if enhanced branding environment variable is set to true' do
    Rails.application.secrets.stubs(:enhanced_branding_enabled).returns(true)
    config = setup_configuration
    assert(config[:enhanced_branding_enabled])
  end

  test 'config returns false if enhanced branding environment variable is set to false' do
    Rails.application.secrets.stubs(:enhanced_branding_enabled).returns(false)
    config = setup_configuration
    refute(config[:enhanced_branding_enabled])
  end

  test 'config returns false if enhanced branding environment variable is not set' do
    Rails.application.secrets.stubs(:enhanced_branding_enabled).returns(nil)
    config = setup_configuration
    refute(config[:enhanced_branding_enabled])
  end

  test 'config returns quickbooks_connect_enabled when it is enabled' do
    Rails.application.secrets.stubs(:quickbooks_connect_enabled).returns(true)
    config = setup_configuration
    assert config[:quickbooks_connect_enabled]
  end

  test 'config returns quickbooks_connect_enabled as nil when it is not enabled' do
    Rails.application.secrets.stubs(:quickbooks_connect_enabled).returns(nil)
    config = setup_configuration
    refute config[:quickbooks_connect_enabled]
  end

  #
  # #marketing_enabled
  #
  test 'config returns true if marketing_enabled variable is set to true (string)' do
    Rails.application.secrets.stubs(:marketing_enabled).returns('true')
    config = setup_configuration
    assert config[:marketing_enabled] == 'true'
  end

  test 'config returns false if marketing_enabled variable is set to false (string)' do
    Rails.application.secrets.stubs(:marketing_enabled).returns('false')
    config = setup_configuration
    refute config[:marketing_enabled] == 'true'
  end

  test 'config returns true if marketing_enabled variable is set to true' do
    Rails.application.secrets.stubs(:marketing_enabled).returns(true)
    config = setup_configuration
    assert config[:marketing_enabled]
  end

  test 'config returns false if marketing_enabled variable is set to false' do
    Rails.application.secrets.stubs(:marketing_enabled).returns(false)
    config = setup_configuration
    refute config[:marketing_enabled]
  end

  test 'config returns false if marketing_enabled variable is not set' do
    Rails.application.secrets.stubs(:marketing_enabled).returns(nil)
    config = setup_configuration
    refute config[:marketing_enabled]
  end

  #
  # #marketing_calendly_url
  #
  test 'config returns empty string for marketing_calendly_url if environment variable is not set' do
    Rails.application.secrets.stubs(:marketing_calendly_url).returns(nil)
    config = setup_configuration
    assert_equal '', config[:marketing_calendly_url]
  end

  test 'config returns marketing_calendly_url if environment variable is set' do
    Rails.application.secrets.stubs(:marketing_calendly_url).returns('https://calendly.com')
    config = setup_configuration
    assert_equal 'https://calendly.com', config[:marketing_calendly_url]
  end

  #
  # #marketing_sample_blog_url
  #
  test 'config returns empty string for marketing_sample_blog_url if environment variable is not set' do
    Rails.application.secrets.stubs(:marketing_sample_blog_url).returns(nil)
    config = setup_configuration
    assert_equal '', config[:marketing_sample_blog_url]
  end

  test 'config returns marketing_sample_blog_url if environment variable is set' do
    Rails.application.secrets.stubs(:marketing_sample_blog_url).returns('https://arioplatform.com/blog')
    config = setup_configuration
    assert_equal 'https://arioplatform.com/blog', config[:marketing_sample_blog_url]
  end

  #
  # #marketing_schedule_campaign_enabled
  #
  test 'config returns true if schedule_marketing_campaign_enabled variable is set to true (string)' do
    Rails.application.secrets.stubs(:schedule_marketing_campaign_enabled).returns('true')
    config = setup_configuration
    assert config[:schedule_marketing_campaign_enabled] == 'true'
  end

  test 'config returns false if schedule_marketing_campaign_enabled variable is set to false (string)' do
    Rails.application.secrets.stubs(:schedule_marketing_campaign_enabled).returns('false')
    config = setup_configuration
    refute config[:schedule_marketing_campaign_enabled] == 'true'
  end

  test 'config returns true if schedule_marketing_campaign_enabled variable is set to true' do
    Rails.application.secrets.stubs(:schedule_marketing_campaign_enabled).returns(true)
    config = setup_configuration
    assert config[:schedule_marketing_campaign_enabled]
  end

  test 'config returns false if schedule_marketing_campaign_enabled variable is set to false' do
    Rails.application.secrets.stubs(:schedule_marketing_campaign_enabled).returns(false)
    config = setup_configuration
    refute config[:schedule_marketing_campaign_enabled]
  end

  test 'config returns false if schedule_marketing_campaign_enabled variable is not set' do
    Rails.application.secrets.stubs(:schedule_marketing_campaign_enabled).returns(nil)
    config = setup_configuration
    refute config[:schedule_marketing_campaign_enabled]
  end

  #
  # #merchant_self_edit_enabled
  #
  test 'config returns true if merchant_self_edit_enabled variable is set to true (string)' do
    Rails.application.secrets.stubs(:merchant_self_edit_enabled).returns('true')
    config = setup_configuration
    assert config[:merchant_self_edit_enabled] == 'true'
  end

  test 'config returns false if merchant_self_edit_enabled variable is set to false (string)' do
    Rails.application.secrets.stubs(:merchant_self_edit_enabled).returns('false')
    config = setup_configuration
    refute config[:merchant_self_edit_enabled] == 'true'
  end

  test 'config returns true if merchant_self_edit_enabled variable is set to true' do
    Rails.application.secrets.stubs(:merchant_self_edit_enabled).returns(true)
    config = setup_configuration
    assert config[:merchant_self_edit_enabled]
  end

  test 'config returns false if merchant_self_edit_enabled variable is set to false' do
    Rails.application.secrets.stubs(:merchant_self_edit_enabled).returns(false)
    config = setup_configuration
    refute config[:merchant_self_edit_enabled]
  end

  test 'config returns false if merchant_self_edit_enabled variable is not set' do
    Rails.application.secrets.stubs(:merchant_self_edit_enabled).returns(nil)
    config = setup_configuration
    refute config[:merchant_self_edit_enabled]
  end

  test 'config returns loc_enabled as true when it is enabled' do
    Rails.application.secrets.stubs(:loc_enabled).returns(true)
    config = setup_configuration
    assert_equal true, config[:loc_enabled]
  end

  test 'config returns loc_enabled as false when it is not enabled' do
    Rails.application.secrets.stubs(:loc_enabled).returns(nil)
    config = setup_configuration
    assert_equal false, config[:loc_enabled]
  end

  test 'config returns intercom_enabled as true when it is enabled' do
    Api::V1::ConfigurationController.any_instance.stubs(:intercom_enabled).returns(true)
    config = setup_configuration
    assert_equal true, config[:intercom_enabled]
  end

  test 'config returns intercom_enabled as false when it is not enabled' do
    Api::V1::ConfigurationController.any_instance.stubs(:intercom_enabled).returns(false)
    config = setup_configuration
    assert_equal false, config[:intercom_enabled]
  end

  #
  # #app_version
  #
  test 'config returns value if app_version variable is set to true (string)' do
    app_version = 'c3298yu4fb'
    Rails.application.secrets.stubs(:app_version).returns(app_version)
    config = setup_configuration
    assert_equal app_version, config[:app_version]
  end

  test 'config returns empty string if app_version variable is not set' do
    Rails.application.secrets.stubs(:app_version).returns(nil)
    config = setup_configuration
    assert_equal '', config[:app_version]
  end

  #
  # #insights_enabled
  #
  test 'config returns true if insights_enabled variable is set to true (string)' do
    Rails.application.secrets.stubs(:insights_enabled).returns('true')
    config = setup_configuration
    assert config[:insights_enabled] == 'true'
  end

  test 'config returns false if insights_enabled variable is set to false (string)' do
    Rails.application.secrets.stubs(:insights_enabled).returns('false')
    config = setup_configuration
    refute config[:insights_enabled] == 'true'
  end

  test 'config returns true if insights_enabled variable is set to true' do
    Rails.application.secrets.stubs(:insights_enabled).returns(true)
    config = setup_configuration
    assert config[:insights_enabled]
  end

  test 'config returns false if insights_enabled variable is set to false' do
    Rails.application.secrets.stubs(:insights_enabled).returns(false)
    config = setup_configuration
    refute config[:insights_enabled]
  end

  test 'config returns false if insights_enabled variable is not set' do
    Rails.application.secrets.stubs(:insights_enabled).returns(nil)
    config = setup_configuration
    refute config[:insights_enabled]
  end

  #
  # #insights_api_enabled
  #
  test 'config returns true if insights_api_enabled variable is set to true (string)' do
    Rails.application.secrets.stubs(:insights_api_enabled).returns('true')
    config = setup_configuration
    assert config[:insights_api_enabled] == 'true'
  end

  test 'config returns false if insights_api_enabled variable is set to false (string)' do
    Rails.application.secrets.stubs(:insights_api_enabled).returns('false')
    config = setup_configuration
    refute config[:insights_api_enabled] == 'true'
  end

  test 'config returns true if insights_api_enabled variable is set to true' do
    Rails.application.secrets.stubs(:insights_api_enabled).returns(true)
    config = setup_configuration
    assert config[:insights_api_enabled]
  end

  test 'config returns false if insights_api_enabled variable is set to false' do
    Rails.application.secrets.stubs(:insights_api_enabled).returns(false)
    config = setup_configuration
    refute config[:insights_api_enabled]
  end

  test 'config returns false if insights_api_enabled variable is not set' do
    Rails.application.secrets.stubs(:insights_api_enabled).returns(nil)
    config = setup_configuration
    refute config[:insights_api_enabled]
  end

  #
  # # business_partner_enabled
  #
  test 'config returns true if business_partner_enabled variable is set to true (string)' do
    Rails.application.secrets.stubs(:business_partner_enabled).returns('true')
    config = setup_configuration
    assert config[:business_partner_enabled] == 'true'
  end

  test 'config returns false if business_partner_enabled variable is set to false (string)' do
    Rails.application.secrets.stubs(:business_partner_enabled).returns('false')
    config = setup_configuration
    refute config[:business_partner_enabled] == 'true'
  end

  #
  # #max_uploads
  #
  test 'config returns secret value if max_uploads variable is set' do
    Rails.application.secrets.stubs(:max_uploads).returns(12)
    config = setup_configuration
    assert config[:max_uploads] == 12
  end

  test 'config returns 1 if max_uploads variable is not set' do
    Rails.application.secrets.stubs(:max_uploads).returns(nil)
    config = setup_configuration
    assert config[:max_uploads] == 1
  end

  #
  # #jurisdiction_enabled
  #
  test 'config returns true if jurisdiction_enabled variable is true' do
    Rails.application.secrets.stubs(:jurisdiction_enabled).returns(true)
    config = setup_configuration
    assert config[:jurisdiction_enabled]
  end

  test 'config returns false if jurisdiction_enabled variable is false' do
    Rails.application.secrets.stubs(:jurisdiction_enabled).returns(false)
    config = setup_configuration
    refute config[:jurisdiction_enabled]
  end

  test 'config returns false if jurisdiction_enabled variable is not set' do
    Rails.application.secrets.stubs(:jurisdiction_enabled).returns(nil)
    config = setup_configuration
    refute config[:jurisdiction_enabled]
  end

  #
  # #version
  #
  test 'version returns value of app_version' do
    app_version = 'p8736yu4fb'
    Rails.application.secrets.stubs(:app_version).returns(app_version)
    response = setup_app_version
    assert_equal app_version, response[:app_version]
  end

  private

  def assign_address_autocomplete(value)
    ENV['GOOGLE_PLACES_KEY'] = value
  end
end
