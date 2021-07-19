# frozen_string_literal: true

require 'test_helper'

class UtilsControllerTest < ActionDispatch::IntegrationTest
  setup do
    stub_vanity_host
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))

    stub_users(@partner)
  end

  test 'root should redirect to new merchant page' do
    get root_path
    assert_redirected_to new_merchant_path
  end

  test 'root should redirect to protected path for signed in user with no profiles' do
    sign_in_user @no_profile_user
    get root_path
    assert_equal 3, session.keys.count # Session ID and partner vanity will always be there
    assert_redirected_to new_merchant_path
  end

  test 'root should redirect to protected path for signed in merchant new' do
    sign_in_user @merchant_new
    get root_path
    assert_redirected_to merchant_path
  end

  test 'root should redirect to protected path for signed in merchant admin' do
    sign_in_user @merchant_admin
    get root_path
    assert_redirected_to merchant_path
  end

  test 'root should redirect to protected path for signed in partner admin' do
    sign_in_user @partner_admin
    get root_path
    assert_equal '/auth/user', URI.parse(response.location).path
    assert_equal @partner.admin_vanity_url, URI.parse(response.location).host
  end

  test 'root should redirect to protected path for delegated access user' do
    ApplicationController.any_instance.stubs(:redirected_user_signed_in?).returns(true)
    get root_path
    assert_redirected_to merchant_path
  end

  test 'root with invoice param should redirect to new merchant page' do
    get root_path(invoice_id: 'inv_123')
    assert_redirected_to new_merchant_path(invoice_id: 'inv_123')
  end

  test 'root with no invoice param should redirect to new merchant page' do
    get root_path
    assert_redirected_to new_merchant_path
  end

  test 'error looking up partner redirects and resets session' do
    ZetatangoService.any_instance.stubs(:partner_lookup).raises(ZetatangoService::ZetatangoServiceException)
    host! 'invalid.zetatango.com'
    get root_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.foghorn_url
  end

  test 'hitting an invalid subdomain redirects and resets session' do
    ZetatangoService.any_instance.stubs(:partner_lookup).returns(nil)
    host! 'invalid.zetatango.com'
    get root_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.sinkhole_vanity_url
  end

  test 'error looking up idp redirects and resets session' do
    IdPService.any_instance.stubs(:identity_provider_lookup).raises(IdPService::IdPServiceException)
    get root_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.foghorn_url
  end

  test 'idp cannot be found redirects and resets session' do
    IdPService.any_instance.stubs(:identity_provider_lookup).returns(nil)
    get root_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.foghorn_url
  end

  test 'visiting root should set partner and identity provider' do
    get root_path
    assert session[:partner].valid?
    assert session[:partner].identity_provider.valid?
    assert_not session[:partner].conf_merchant_welcome.nil?
  end
end
