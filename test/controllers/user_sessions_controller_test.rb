# frozen_string_literal: true

require 'test_helper'

class UserSessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    stub_vanity_host
    stub_users(@partner)

    stub_load_scss_variables

    @service = SessionManagerService.instance
    @service.delete_all

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
  end

  teardown do
    @service.delete_all
  end

  test 'login with no user profile clears the session and redirects' do
    sign_in_user @no_profile_user
    assert_equal 3, session.keys.count # Session ID, partner from vanity will always be there
    assert_equal 401, response.status
  end

  test 'login with merchant new profile logs the user in' do
    sign_in_user @merchant_new
    assert_not_nil session[:zetatango_user]
    assert_not_nil session[:zetatango_session]
  end

  test 'omniauth has proper params configured (partner)' do
    get "#{Rails.configuration.foghorn_url}/auth/user?partner=#{@partner.id}"
    assert_equal @partner.id, request.env['omniauth.strategy'].options['partner']
  end

  test 'omniauth has proper params configured (tracked_object_id)' do
    tracked_object_id = "obj_#{SecureRandom.base58(16)}"

    get "#{Rails.configuration.foghorn_url}/auth/user?partner=#{@partner.id}&tracked_object_id=#{tracked_object_id}"

    assert_equal tracked_object_id, request.env['omniauth.strategy'].options['tracked_object_id']
  end

  test 'login with merchant passes the endorsing partner context' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .to_return(status: 201, body: { access_token: 'token', expires_in: 7200 }.to_json)
    ProfileAccessTokenService.any_instance.unstub(:api_access_token)
    sign_in_user @merchant_new
    assert_requested(:post, "#{Rails.configuration.roadrunner_url}/api/users/token", times: 1) do |req|
      Rack::Utils.parse_nested_query(req.body).key? 'context'
    end
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
  end

  test 'login with merchant new profile should have valid session in cache' do
    sign_in_user @merchant_new
    assert @service.valid?(session[:zetatango_session], @merchant_new)
  end

  test 'login with merchant new profile redirects to root path' do
    sign_in_user @merchant_new
    assert_redirected_to root_path
  end

  test 'login with partner_admin should set session correct' do
    sign_in_user @partner_admin
    assert_not_nil session[:zetatango_user]
    assert_not_nil session[:zetatango_session]
  end

  test 'login with merchant_admin should set session correct' do
    sign_in_user @merchant_admin
    assert_not_nil session[:zetatango_user]
    assert_not_nil session[:zetatango_session]
  end

  test 'login should set access token correctly, and be nil' do
    sign_in_user @merchant_admin
    assert_nil @api_access_token
    assert_nil session[:zetatango_user].access_token
  end

  test 'login should have valid session in cache' do
    sign_in_user @merchant_admin
    assert @service.valid?(session[:zetatango_session], @merchant_admin)
  end

  test 'login with failure to get profile access token should redirect to homepage' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).raises(ProfileAccessTokenService::ProfileAccessTokenServiceException.new('Test'))
    sign_in_user @merchant_admin
    assert_equal 401, response.status
  end

  test 'user session should have created and last updated time' do
    sign_in_user @merchant_admin
    assert check_time(Time.now, @service.created_at(session[:zetatango_session]))
    assert check_time(Time.now, @service.updated_at(session[:zetatango_session]))
  end

  test 'sign out redirection' do
    sign_in_user @merchant_admin
    get logout_path
    assert_redirected_to new_merchant_path
  end

  test '#destroy with Bad request Format returns a 404' do
    sign_in_user @merchant_admin
    get logout_path
    get "#{logout_path}.cfm"
    assert_equal 404, response.status
  end

  test 'unsolicited sign out redirects to root page' do
    get logout_path
    assert_redirected_to root_path
  end

  test 'double sign out results in redirect to root' do
    sign_in_user @merchant_admin
    get logout_path
    assert_redirected_to new_merchant_path
    get logout_path
    assert_redirected_to root_path
  end

  test 'sign in single profile user makes them a merchant admin' do
    sign_in_user @merchant_admin
    assert @merchant_admin.merchant_admin?
  end

  test 'sign in merchant new sets preferred language (English)' do
    merchant_new = build :user, :merchant_new, :english_language, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)

    sign_in_user merchant_new
    assert_equal 'en', session[:zetatango_user].preferred_language
  end

  test 'sign in merchant new sets preferred language (French)' do
    merchant_new = build :user, :merchant_new, :french_language, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)

    sign_in_user merchant_new
    assert_equal 'fr', session[:zetatango_user].preferred_language
  end

  test 'sign in merchant new sets insights preference (opt in)' do
    merchant_new = build :user, :merchant_new, :insights_opt_in, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)

    sign_in_user merchant_new
    assert session[:zetatango_user].insights_preference
  end

  test 'sign in merchant new sets insights preference (opt out)' do
    merchant_new = build :user, :merchant_new, :insights_opt_out, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)

    sign_in_user merchant_new
    refute session[:zetatango_user].insights_preference
  end

  test 'sign in merchant new sets insights preference (not set)' do
    merchant_new = build :user, :merchant_new, :insights_not_set, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)

    sign_in_user merchant_new
    assert_nil session[:zetatango_user].insights_preference
  end

  test 'sign in with multi-profile account stores user but not session' do
    sign_in_user @multi_profile_user
    assert_not_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
  end

  test 'switching accounts should load the proper user profile' do
    profile_1_guid = @multi_profile_user.profile_info[1][:uid]
    profile_2_guid = @multi_profile_user.profile_info[2][:uid]

    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: profile_1_guid }

    assert session[:zetatango_user].selected_profile = profile_1_guid
    assert_not_nil session[:zetatango_session]

    get switch_account_path, params: { profile_uid: profile_2_guid }

    assert session[:zetatango_user].selected_profile = profile_2_guid
    assert_not_nil session[:zetatango_session]
  end

  test 'switching accounts with an invalid profile guid should redirect to root path' do
    sign_in_user @multi_profile_user

    assert_not_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]

    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[1][:uid] }
    get switch_account_path, params: { profile_uid: 'm_invalidGuid' }

    assert_redirected_to root_path
  end

  test 'signing in with multi accounts with no merchant sends you to the accounts page' do
    user = build :user, :partner_admin, add_new_business: true, partner: @partner
    sign_in_user user
    assert_redirected_to accounts_path
  end

  test 'sign in with multi-profile account does not set selected profile' do
    sign_in_user @multi_profile_user
    assert_nil @multi_profile_user.selected_profile
  end

  test 'sign in with multi-profile account does not make user a merchant_admin' do
    sign_in_user @multi_profile_user

    assert_not @multi_profile_user.merchant_admin?
  end

  test 'sign in with multi-profile account redirects to account picker' do
    sign_in_user @multi_profile_user
    assert_redirected_to accounts_path
  end

  test 'sign in with multi-profile account shows account picker' do
    sign_in_user @multi_profile_user
    follow_redirect!

    assert_select 'button[class*="picker-element"]', @multi_profile_user.filtered_profile_info(@partner).count
  end

  test 'sign in with multi-partner account shows only accounts for partner' do
    sign_in_user @multi_partner_user
    follow_redirect!

    assert_select 'button[class*="picker-element"]', @multi_partner_user.filtered_profile_info(@partner).count
  end

  test 'sign in and select a merchant account sets the user session' do
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid] }

    assert_not_nil session[:zetatango_user]
    assert_not_nil session[:zetatango_session]
  end

  test 'post to choose account sets context on token request' do
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid] }

    assert_not_nil session[:partner]
  end

  test 'sign in and select a merchant account sets selected profile' do
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid] }

    assert_not_nil session[:zetatango_user].selected_profile
    assert_equal @multi_profile_user.profile_info[2][:uid], session[:zetatango_user].selected_profile
  end

  test 'sign in and select a merchant_new account makes the user a merchant_new' do
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[1][:uid] }

    assert session[:zetatango_user].merchant_new?
  end

  test 'sign in and select a partner account redirects to zetatango' do
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[3][:uid] }

    redirect_uri = URI.parse(response.location)

    assert_equal '/auth/user', redirect_uri.path
    assert_equal @partner.admin_vanity_url, redirect_uri.host
  end

  test 'post to random account logs out user' do
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: "prof_#{SecureRandom.base58(16)}" }

    assert_redirected_to root_path
  end

  test 'post to choose account redirects to new merchant page' do
    post accounts_path, params: { profile_uid: "prof_#{SecureRandom.base58(16)}" }
    assert_redirected_to new_merchant_path
  end

  test 'post without account redirects to new merchant page' do
    post accounts_path
    assert_redirected_to new_merchant_path
  end

  test 'post with invalid authenticity token' do
    # User is logged in
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid] }
    assert_not_nil session[:zetatango_user]
    assert_not_nil session[:zetatango_session]

    # CSRF is disabled in the test environment, so we need to enable it
    # User makes a POST with an invalid authenticity token
    ActionController::Base.allow_forgery_protection = true
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid], authenticity_token: 'foo' }
    assert_redirected_to '/auth/user'

    ActionController::Base.allow_forgery_protection = false

    # User is no longer logged in
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
  end

  test 'post with invalid authenticity token as json' do
    # User is logged in
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid] }
    assert_not_nil session[:zetatango_user]
    assert_not_nil session[:zetatango_session]

    # CSRF is disabled in the test environment, so we need to enable it
    # User makes a POST with an invalid authenticity token
    ActionController::Base.allow_forgery_protection = true
    post accounts_path, params: { profile_uid: @multi_profile_user.profile_info[2][:uid], authenticity_token: 'foo' }, as: :json
    assert_response :unauthorized

    ActionController::Base.allow_forgery_protection = false

    # User is no longer logged in
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
  end

  test 'with single profile user redirects to root' do
    sign_in_user @merchant_admin
    post accounts_path, params: { profile_uid: "prof_#{SecureRandom.base58(16)}" }
    assert_redirected_to root_path
  end

  test 'sign in with a single profile for different partner shows unauthorized' do
    merchant_new = User.new(
      uid: "u_#{SecureRandom.base58(16)}", name: 'Merchant User', email: 'merchant@example.com', enabled: true, created_at: Time.now,
      profile_partner_filter: @partner.id, properties: { language: 'EN' },
      profiles: [{ uid: "prof_#{SecureRandom.base58(16)}", properties: { role: 'merchant_new', partner: "p_#{SecureRandom.base58(16)}" } }]
    )

    sign_in_user merchant_new

    assert_equal 401, response.status
  end

  test 'sign in with multiple profiles for different partner shows unauthorized' do
    merchant_new = User.new(
      uid: "u_#{SecureRandom.base58(16)}", name: 'Merchant User', email: 'merchant@example.com', enabled: true, created_at: Time.now,
      profile_partner_filter: @partner.id, properties: { language: 'EN' },
      profiles: [
        { uid: "prof_#{SecureRandom.base58(16)}", properties: { role: 'mercahnt_new', partner: "p_#{SecureRandom.base58(16)}" } },
        { uid: "prof_#{SecureRandom.base58(16)}", properties: { role: 'mercahnt_new', partner: "p_#{SecureRandom.base58(16)}" } },
        { uid: "prof_#{SecureRandom.base58(16)}", properties: { role: 'mercahnt_new', partner: "p_#{SecureRandom.base58(16)}" } }
      ]
    )

    sign_in_user merchant_new

    assert_equal 401, response.status
  end

  test 'sign in multiple times only looks up merchant once' do
    sign_in_user @multi_profile_user
    follow_redirect!
    get logout_path
    sign_in_user @multi_profile_user
    follow_redirect!

    assert_requested(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@multi_profile_user.profile_info[2][:properties][:merchant]}", times: 1)
  end

  test 'sign in with single profile does not look up merchants' do
    sign_in_user @merchant_admin
    assert_requested(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_admin_m_guid}", times: 0)
  end

  test 'sign in with multiple profiles and lookup error renders no buttons' do
    ZetatangoService.any_instance.stubs(:merchant_lookup).raises(ZetatangoService::ZetatangoServiceException)
    sign_in_user @multi_profile_user
    follow_redirect!
    assert_select 'button[class*="picker-element"]', 0
  end

  test 'sign in with multiple profiles and merchant not found renders no buttons' do
    ZetatangoService.any_instance.stubs(:merchant_lookup).returns(nil)
    sign_in_user @multi_profile_user
    follow_redirect!
    assert_select 'button[class*="picker-element"]', 0
  end

  test 'sign in with multiple profiles looks up correct number of merchants (merchant_new, merchant_admin)' do
    sign_in_user @multi_profile_user
    follow_redirect!

    @multi_profile_user.profile_info.each do |profile|
      next unless %w[merchant_admin merchant_new].include?(profile.dig(:properties, :role))

      merchant_guid = profile.dig(:properties, :merchant)
      next if merchant_guid.blank?

      assert_requested(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{merchant_guid}", times: 1)
    end
  end

  test '#show_accounts with no user redirects to home page' do
    get accounts_path
    assert_redirected_to new_merchant_path
  end

  test '#show_accounts with merchant admin redirects to home page' do
    sign_in_user @merchant_admin
    get accounts_path
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
  end

  test '#show_accounts multi profile user shows correct buttons' do
    sign_in_user @multi_profile_user
    follow_redirect!

    assert_select 'h5', text: 'Partner Portal', count: 1
    assert_select 'h5', text: 'Continue On Boarding', count: 1
    assert_select 'h5', text: 'Add New Business', count: 1
    assert_select 'button', count: 4
  end

  test '#show_accounts multi profile user shows correct buttons when partner conf_allow_multiple_businesses is false' do
    stub_partner_chain
    sign_in_user @multi_profile_user
    follow_redirect!

    assert_select 'h5', text: 'Partner Portal', count: 1
    assert_select 'h5', text: 'Continue On Boarding', count: 1
    assert_select 'h5', text: 'Add New Business', count: 0
    assert_select 'button', count: 3
  end

  test '#show_accounts multi profile(without partner admin) user shows correct buttons' do
    sign_in_user @multi_profile_user2
    follow_redirect!

    assert_select 'h5', text: 'Continue On Boarding', count: 1
    assert_select 'h5', text: 'Add New Business', count: 1
    assert_select 'button', count: 4
  end

  test '#show_accounts multi profile(without partner admin) user shows correct buttons when partner conf_allow_multiple_businesses is false' do
    stub_partner_chain

    sign_in_user @multi_profile_user2
    follow_redirect!

    assert_select 'h5', text: 'Continue On Boarding', count: 1
    assert_select 'h5', text: 'Add New Business', count: 0
    assert_select 'button', count: 3
  end

  test '#show_accounts when only completed about businesss autochooses that profile' do
    sign_in_user @completed_about_business_user
    follow_redirect!

    assert_equal request.original_fullpath, auto_choose_account_path(profile_uid: @completed_about_business_user.profiles.last[:uid])
  end

  test '#show_accounts when only completed about businesss redirects to application' do
    sign_in_user @completed_about_business_user
    follow_redirect!

    assert_redirected_to certification_path
  end

  test '#show_accounts with merchant onboarded shows the correct messages' do
    sign_in_user @multi_profile_user
    follow_redirect!

    assert_select 'h5', text: 'merchant_new'
    assert_select 'p', text: 'Business Number 12345678900'
  end

  test '#show_accounts with merchant partially onboarded shows the correct messages' do
    sign_in_user @multi_profile_user
    follow_redirect!

    assert_select 'h5', text: 'Continue On Boarding'
    assert_select 'p', text: 'merchant_new'
  end

  test '#show_accounts with completed about_business profile redirects past profile picker' do
    sign_in_user @completed_about_business_user
    follow_redirect!

    assert_redirected_to certification_path
  end

  test '##show_accounts with completed about_business profile redirects past profile picker when partner conf_allow_multiple_businesses is false' do
    stub_partner_chain

    sign_in_user @completed_about_business_user
    follow_redirect!

    assert_redirected_to certification_path
  end

  test '#show_accounts with completed about_you redirects past profile picker' do
    sign_in_user @completed_about_you_user
    follow_redirect!

    assert_redirected_to certification_path
  end

  test '#show_accounts with completed about_you redirects past profile picker when partner conf_allow_multiple_businesses is false' do
    stub_partner_chain

    sign_in_user @completed_about_you_user
    follow_redirect!

    assert_redirected_to certification_path
  end

  test '#show_accounts with merchant_onboarding redirects past profile picker' do
    sign_in_user @merchant_onboarding
    follow_redirect!

    assert_redirected_to merchant_path
  end

  test '#show_accounts with merchant_new does redirects past profile picker' do
    sign_in_user @merchant_new
    follow_redirect!

    assert_redirected_to merchant_path
  end

  test 'do not add new business when there is no placeholder blank merchant_new profile' do
    no_add_business_user = build :user, merchant_new: 2, partner: @partner

    sign_in_user no_add_business_user
    follow_redirect!

    assert_select 'h5', text: 'Add New Business', count: 0
    assert_select 'h5', text: 'Choose a profile'
  end

  test '#backchannel_logout is successful' do
    stub_jwks_response
    sign_in_user @merchant_admin

    s1 = open_session
    s1.process(:post, backchannel_logout_path, params: { logout_token: access_token(subject: @merchant_admin.uid) })
    assert 200, s1.response.status
  end

  test '#backchannel_logout replay results in bad_request' do
    stub_jwks_response
    sign_in_user @merchant_admin
    jwt = access_token(subject: @merchant_admin.uid)

    s1 = open_session
    s1.process(:post, backchannel_logout_path, params: { logout_token: jwt })
    assert 200, s1.response.status

    s2 = open_session
    s2.process(:post, backchannel_logout_path, params: { logout_token: jwt })
    assert 400, s2.response.status
  end

  test '#backchannel_logout logout error results in not_implemented' do
    Rails.cache.stubs(:delete).raises(Redlock::LockError.new("u_#{SecureRandom.base58(16)}"))

    stub_jwks_response
    sign_in_user @merchant_admin

    s1 = open_session
    s1.process(:post, backchannel_logout_path, params: { logout_token: access_token(subject: @merchant_admin.uid) })
    assert 501, s1.response.status
  end

  test '#backchannel_logout without token results in bad_request' do
    stub_jwks_response
    sign_in_user @merchant_admin
    s1 = open_session
    s1.process(:post, backchannel_logout_path)
    assert 400, s1.response.status
  end

  test 'logout from delegated mode' do
    ApplicationController.any_instance.stubs(:current_user).returns(nil)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(false)
    ApplicationController.any_instance.stubs(:redirected_user_signed_in?).returns(true)

    post '/delegated_logout'
    assert_response :ok
  end

  test 'confirm_login redirects to idp with auth_options set when user is signed in' do
    sign_in_user @merchant_admin

    OmniAuth.config.test_mode = false # disable test mode to get the redirect location

    get confirm_login_path
    follow_redirect!

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_equal '/reauth/user/callback', redirect_uri.path
  end

  test 'confirm login sets hostnames correctly' do
    sign_in_user @merchant_admin

    OmniAuth.config.test_mode = false # disable test mode to get the redirect location

    get confirm_login_path
    follow_redirect!

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal @idp.vanity_url, login_uri.host
    assert_equal host, redirect_uri.host
  end

  test 'confirm login sets prompt correctly' do
    sign_in_user @merchant_admin

    OmniAuth.config.test_mode = false # disable test mode to get the redirect location

    get confirm_login_path
    follow_redirect!

    login_uri = URI.parse(response.location)
    prompt = CGI.parse(login_uri.query)['prompt'].first

    assert_equal 'login', prompt
  end

  test 'confirm login sets locale correctly' do
    sign_in_user @merchant_admin

    OmniAuth.config.test_mode = false # disable test mode to get the redirect location

    get confirm_login_path, params: { locale: 'fr-CA' }
    follow_redirect!
    login_uri = URI.parse(response.location)
    locale = CGI.parse(login_uri.query)['ui_locales'].first

    assert_equal 'fr-CA', locale
  end

  test 'confirm_login redirects to root page when user is signed out' do
    get confirm_login_path
    assert_redirected_to root_path
  end

  # Note, we can't test the redirect to WCA flow as it is no longer possible to manipulate the session in Rails 5.
  test 'redirect to UBL certification when reauthenticated' do
    sign_in_user @merchant_admin

    get reauth_user_callback_path
    assert_redirected_to '/#/certification'
  end

  test 'sign in for defined profile will auto choose corresponding profile' do
    UserSessionsController.any_instance.stubs(:find_profile).returns('prof_KAsUtxiCQTWHQ4Aq')
    sign_in_user @multi_profile_user
    auto_choose_profile_url = auto_choose_account_path(profile_uid: 'prof_KAsUtxiCQTWHQ4Aq')
    redirected_url = URI.parse(response.location).request_uri
    assert_equal auto_choose_profile_url, redirected_url
  end

  test '/auto_choose_account redirects to logout when user is not signed in' do
    get auto_choose_account_path(profile_uid: 'prof_KAsUtxiCQTWHQ4Aq')
    assert_redirected_to new_merchant_path
  end

  test '/accounts redirects to logout when user is not signed in' do
    get accounts_path
    assert_redirected_to new_merchant_path
  end

  test '#/auth/failure redirects to public 500 page' do
    get auth_user_failure_path

    assert_response :redirect
    assert_redirected_to '/500.html'
  end

  def stub_partner_chain
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner, @partner, @partner, @partner, @partner2)
  end
end
