# frozen_string_literal: true

require 'test_helper'

class AuthenticationTest < ActionDispatch::IntegrationTest
  setup do
    stub_vanity_host
    stub_users(@partner)
    stub_load_scss_variables

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])

    @service = SessionManagerService.instance
    @service.delete_all
  end

  teardown do
    @service.delete_all
  end

  test 'root redirects to merchant path after merchant new authentication' do
    sign_in_user @merchant_new
    get root_path
    assert_redirected_to merchant_path
  end

  test 'when logging in through the endorsing partner root redirects to merchant path after merchant new authentication' do
    host! @endorsing_hostname
    sign_in_user @merchant_new
    get root_path
    assert_redirected_to merchant_path
  end

  test 'causes a partner lookup for the endorser' do
    sign_in_user @merchant_new
    get root_path
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}", times: 1
  end

  test 'when logging in through the endorsing partner causes a partner lookup for the endorser' do
    host! @endorsing_hostname
    sign_in_user @merchant_new
    get root_path
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@endorsing_partner.subdomain}", times: 1
  end

  test 'root redirects to merchant info after merchant admin authentication' do
    sign_in_user @merchant_admin
    get root_path
    assert_redirected_to merchant_path
  end

  test 'when logging in through the endorsing partner root redirects to merchant info after merchant admin authentication' do
    host! @endorsing_hostname
    sign_in_user @merchant_admin
    get root_path
    assert_redirected_to merchant_path
  end

  test 'redirects to the partner portal after partner admin authentication' do
    sign_in_user @partner_admin
    assert_redirected_to root_path
    follow_redirect!

    redirect_uri = URI.parse(response.location)

    assert_equal '/auth/user', redirect_uri.path
    assert_equal @partner.admin_vanity_url, redirect_uri.host
  end

  test 'when logging in through the endorsing partner redirects to the partner portal after partner admin authentication' do
    host! @endorsing_hostname
    sign_in_user @partner_admin
    assert_redirected_to root_path
    follow_redirect!

    redirect_uri = URI.parse(response.location)

    assert_equal '/auth/user', redirect_uri.path
    assert_equal @partner.admin_vanity_url, redirect_uri.host
  end

  test 'partner admin login then visit merchant page should redirect to the root page' do
    mocha_teardown
    sign_in_user @partner_admin
    get merchant_path
    assert_redirected_to root_path
  end

  test 'protected endpoint redirects to root without authentication' do
    get merchant_path
    assert_redirected_to root_path
  end

  test 'partner admin login should not request new token' do
    mocha_teardown
    sign_in_user @partner_admin
    get merchant_path
    assert_requested(:post, "#{Rails.configuration.roadrunner_url}/api/users/token", times: 0)
  end

  test 'protected resources should redirect after logout' do
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success
    get logout_path
    get merchant_path
    assert_redirected_to root_path
  end

  test 'subsequent logins should have different session tokens' do
    sign_in_user @merchant_admin
    session_id1 = session[:zetatango_session]
    get logout_path
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
    sign_in_user @merchant_admin
    session_id2 = session[:zetatango_session]
    assert_not_equal session_id1, session_id2
  end

  test 'should redirect on cookie replay' do
    sign_in_user @merchant_admin
    session_id = session[:zetatango_session]
    get logout_path
    session[:zetatango_user] = @merchant_admin
    session[:zetatango_session] = session_id
    get merchant_path
    assert_redirected_to root_path
  end

  test 'user session should have correct created_at time' do
    time = Time.now
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success
    assert check_time(time, @service.created_at(session[:zetatango_session]))
  end

  test 'user login has correct logout link for vanity' do
    sign_in_user @merchant_admin
    get merchant_path
    assert_select 'meta[name="logout_url"]' do |element|
      logout_uri = URI.parse(element.attr('content'))
      redirect_uri = URI.parse(CGI.parse(logout_uri.query)['redirect'].first)

      assert_equal @idp.vanity_url, logout_uri.host
      assert_equal @partner.wlmp_vanity_url, redirect_uri.host
    end
  end

  test 'user session should have consistent created_at time' do
    time = Time.now
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success
    assert check_time(time, @service.created_at(session[:zetatango_session]))

    Timecop.freeze(time + 1.minute) do
      get merchant_path
      assert_response :success
      assert check_time(time, @service.created_at(session[:zetatango_session]))
    end
  end

  test 'user session should have correct updated_at time' do
    time = Time.now
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success
    assert check_time(time, @service.updated_at(session[:zetatango_session]))
  end

  test 'user session should have updated updated_at time' do
    time = Time.now
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success
    assert check_time(time, @service.updated_at(session[:zetatango_session]))

    Timecop.freeze(time + 1.minute) do
      get merchant_path
      assert_response :success
      assert check_time(time + 1.minute, @service.updated_at(session[:zetatango_session]))
    end
  end

  test 'user sessions time out after inactivity timeout, and is redirected to welcome page' do
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success

    Timecop.freeze(Time.now + Rails.configuration.inactivity_timeout + 1.minute) do
      get merchant_path
      assert_redirected_to root_path

      follow_redirect!

      assert_redirected_to new_merchant_path
    end
  end

  test 'user sessions time out after inactivity timeout, and is redirected to sign in when welcome merchant is false' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success

    Timecop.freeze(Time.now + Rails.configuration.inactivity_timeout + 1.minute) do
      get merchant_path
      assert_redirected_to root_path

      follow_redirect!

      assert_redirected_to(/partner=#{@partner.id}/)
      assert_redirected_to(%r{users/sign_in})
    end
  end

  test 'user sessions automatically time out after 12 hours' do
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success

    Timecop.freeze(Time.now + Rails.configuration.session_timeout + 1.minute) do
      get merchant_path
      assert_redirected_to root_path
    end
  end

  test 'user sessions of active users are automatically timed out' do
    time = Time.now
    sign_in_user @merchant_admin

    inactivity = Rails.configuration.inactivity_timeout
    session = Rails.configuration.session_timeout

    Rails.configuration.inactivity_timeout = 1.minute
    Rails.configuration.session_timeout = 2.minutes

    4.times do |t|
      Timecop.freeze(time + (30.seconds * t)) do
        get merchant_path
        assert_response :success
      end
    end

    Timecop.freeze(time + 2.minutes + 10.seconds) do
      get merchant_path
      assert_redirected_to root_path
    end

    Rails.configuration.inactivity_timeout = inactivity
    Rails.configuration.session_timeout = session
  end

  test 'user can sign in again after session timeout' do
    sign_in_user @merchant_admin
    get merchant_path
    assert_response :success

    Timecop.freeze(Time.now + 12.hours) do
      get merchant_path
      assert_redirected_to root_path

      sign_in_user @merchant_admin
      get merchant_path
      assert_response :success
    end
  end

  test 'multiple user sessions is supported' do
    s1 = open_session
    s2 = open_session

    s1.host! @hostname
    s2.host! @hostname

    sign_in_user @merchant_admin, s1
    s1.process(:get, merchant_path)
    assert_equal 200, s1.response.status

    sign_in_user @merchant_admin, s2
    s2.process(:get, merchant_path)
    assert_equal 200, s2.response.status

    s1.process(:get, merchant_path)
    assert_equal 200, s1.response.status

    s2.process(:get, merchant_path)
    assert_equal 200, s2.response.status
  end

  test 'caching error should reset session' do
    sign_in_user @merchant_admin

    lock_manager = Redlock::Client.new([Rails.application.secrets.redis_url])
    lock_info = lock_manager.lock(session[:zetatango_session], 100_000)
    msg1 = 'Access denied (merchant -> show): You are not authorized to access this page.'
    msg2 = 'Destroying user session due to session exception during user sign in check: SessionManagerService::LockException'
    Rails.logger.expects(:warn).with(msg1).once
    Rails.logger.expects(:warn).with(msg2).once

    get merchant_path
    assert_redirected_to root_path

    lock_manager.unlock(lock_info)
  end

  test 'caching error on one session does not affect other' do
    s1 = open_session
    s2 = open_session

    s1.host! @hostname
    s2.host! @hostname

    sign_in_user @merchant_admin, s1
    s1.process(:get, merchant_path)
    assert_equal 200, s1.response.status

    sign_in_user @merchant_admin, s2
    s2.process(:get, merchant_path)
    assert_equal 200, s2.response.status

    lock_manager = Redlock::Client.new([Rails.application.secrets.redis_url])
    lock_info = lock_manager.lock(s1.session[:zetatango_session], 100_000)
    msg1 = 'Access denied (merchant -> show): You are not authorized to access this page.'
    msg2 = 'Destroying user session due to session exception during user sign in check: SessionManagerService::LockException'
    Rails.logger.expects(:warn).with(msg1).once
    Rails.logger.expects(:warn).with(msg2).once

    s1.process(:get, merchant_path)
    assert_equal 302, s1.response.status

    lock_manager.unlock(lock_info)

    s2.process(:get, merchant_path)
    assert_equal 200, s2.response.status
  end

  test 'caching error on login prevents login' do
    get merchant_path
    assert_redirected_to root_path

    msg1 = 'Access denied (merchant -> show): You are not authorized to access this page.'
    msg2 = 'Destroying user session due to session exception during user sign in: SessionManagerService::SessionManagerException'
    Rails.logger.expects(:warn).with(msg1).once
    Rails.logger.expects(:warn).with(msg2).once
    SessionManagerService.any_instance.stubs(:create_session).raises(SessionManagerService::SessionManagerException)

    sign_in_user @merchant_admin

    get merchant_path
    assert_redirected_to root_path
  end

  test 'LockException on login prevents login' do
    get merchant_path
    assert_redirected_to root_path

    msg1 = 'Access denied (merchant -> show): You are not authorized to access this page.'
    msg2 = 'Destroying user session due to session exception during user sign in: SessionManagerService::LockException'
    Rails.logger.expects(:warn).with(msg1).once
    Rails.logger.expects(:warn).with(msg2).once
    SessionManagerService.any_instance.stubs(:create_session).raises(SessionManagerService::LockException)

    sign_in_user @merchant_admin

    get merchant_path
    assert_redirected_to root_path
  end

  test 'caching error on logout still logs out' do
    sign_in_user @merchant_admin

    msg = 'Destroying user session due to session exception during user sign out: SessionManagerService::SessionManagerException'
    Rails.logger.expects(:warn).with(msg).once
    SessionManagerService.any_instance.stubs(:destroy_session).raises(SessionManagerService::SessionManagerException)

    get logout_path
    assert_redirected_to new_merchant_path
  end

  test 'access denied error when redis unavailable redirects to error page' do
    get merchant_path

    SessionManagerService.any_instance.stubs(:create_session).raises(CanCan::AccessDenied)
    ApplicationController.any_instance.stubs(:redis_unavailable?).returns(true)

    sign_in_user @merchant_admin
    assert_redirected_to '/503.html'
  end

  test 'logged in user has cached access token' do
    sign_in_user @merchant_admin

    user = session[:zetatango_user]

    assert_not_nil user.access_token
  end

  test 'sign in and select a merchant account requests a profile access token' do
    mocha_teardown
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.first_valid_profile_guid }

    assert_requested(:post, "#{Rails.configuration.roadrunner_url}/api/users/token", times: 1)
  end

  test 'sign in and select a merchant account redirects to merchant path' do
    mocha_teardown
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.first_valid_profile_guid }

    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
  end

  test 'when logging in through the endorsing partner sign in and select a merchant account redirects to merchant path' do
    host! @endorsing_hostname
    mocha_teardown
    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.first_valid_profile_guid }

    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
  end

  test 'when logging in through the endorsing partner sign in and select a partner account redirects to merchant path' do
    host! @endorsing_hostname
    mocha_teardown

    sign_in_user @multi_profile_user
    post accounts_path, params: { profile_uid: @multi_profile_user.find_partner_admin_profile_guid }

    redirect_uri = URI.parse(response.location)

    assert_equal '/auth/user', redirect_uri.path
    assert_equal @partner.admin_vanity_url, redirect_uri.host
  end

  test 'sign in from vanity host sets IdP host and redirect correct' do
    OmniAuth.config.test_mode = false

    get '/auth/user'

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal @idp.vanity_url, login_uri.host
    assert_equal host, redirect_uri.host
  end

  test 'sign in from vanity host sets partner and tracked object id' do
    OmniAuth.config.test_mode = false

    tracked_object_id = "obj_#{SecureRandom.base58(16)}"

    get "#{Rails.configuration.foghorn_url}/auth/user?partner=#{@partner.id}&tracked_object_id=#{tracked_object_id}"

    login_uri = URI.parse(response.location)
    query_params = CGI.parse(login_uri.query)

    assert_equal @partner.id, query_params['partner'].first
    assert_equal tracked_object_id, query_params['tracked_object_id'].first
  end

  test 'sign in from white label host is handled' do
    OmniAuth.config.test_mode = false

    host! URI.parse(Rails.configuration.foghorn_url).host

    get '/auth/user'

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal URI.parse(Rails.configuration.roadrunner_url).host, login_uri.host
    assert_equal URI.parse(Rails.configuration.foghorn_url).host, redirect_uri.host
  end

  test 'failure to look up IdP results in redirect to generic login' do
    IdPService.any_instance.stubs(:identity_provider_lookup).raises(IdPService::IdPServiceException)
    OmniAuth.config.test_mode = false

    get '/auth/user'

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal URI.parse(Rails.configuration.roadrunner_url).host, login_uri.host
    assert_equal host, redirect_uri.host
  end

  test 'not found on IdP look up results in redirect to generic login' do
    IdPService.any_instance.stubs(:identity_provider_lookup).returns(nil)
    OmniAuth.config.test_mode = false

    get '/auth/user'

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal URI.parse(Rails.configuration.roadrunner_url).host, login_uri.host
    assert_equal host, redirect_uri.host
  end

  test 'failure to look up partner results in redirect to generic login' do
    ZetatangoService.any_instance.stubs(:partner_lookup).raises(ZetatangoService::ZetatangoServiceException)
    OmniAuth.config.test_mode = false

    get '/auth/user'

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal URI.parse(Rails.configuration.roadrunner_url).host, login_uri.host
    assert_equal host, redirect_uri.host
  end

  test 'not found on partner look up results in redirect to generic login' do
    ZetatangoService.any_instance.stubs(:partner_lookup).returns(nil)
    OmniAuth.config.test_mode = false

    get '/auth/user'

    login_uri = URI.parse(response.location)
    redirect_uri = URI.parse(CGI.parse(login_uri.query)['redirect_uri'].first)

    assert_response :redirect
    assert_equal URI.parse(Rails.configuration.roadrunner_url).host, login_uri.host
    assert_equal host, redirect_uri.host
  end

  test 'sign out from vanity host clears session' do
    OmniAuth.config.test_mode = false
    sign_in_user @merchant_admin

    get new_on_boarding_path
    get logout_path

    assert_response :redirect
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
    assert_nil session[:return_to]
  end

  test 'sign out from white label host clears session' do
    OmniAuth.config.test_mode = false
    sign_in_user @merchant_admin

    host! URI.parse(Rails.configuration.foghorn_url).host

    get new_on_boarding_path
    get logout_path

    assert_response :redirect
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
    assert_nil session[:return_to]
  end

  test 'valid user signed into different vanity redirects to root page' do
    host! "#{@partner2.subdomain}.#{Rails.application.secrets.zetatango_domain}"
    sign_in_user @merchant_admin

    get merchant_path
    assert_redirected_to root_path
  end

  test 'valid user signed into different vanity clears session' do
    host! "#{@partner2.subdomain}.#{Rails.application.secrets.zetatango_domain}"
    sign_in_user @merchant_admin

    get merchant_path

    assert_response :redirect
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
    assert_nil session[:return_to]
  end

  test 'user making an unauthorized request to a controller endpoint is redirect to root page' do
    sign_in_user @merchant_admin

    get new_on_boarding_path
    assert_redirected_to root_path
  end

  test 'user making an unauthorized request to a controller endpoint has session cleared' do
    sign_in_user @merchant_admin

    get new_on_boarding_path

    assert_response :redirect
    assert_nil session[:zetatango_user]
    assert_nil session[:zetatango_session]
    assert_nil session[:return_to]
  end

  test 'user is re authenticated during certification flow' do
    # :find_profile will return values only if session variable has either merchant_guid or profile_guid
    # as we cannot stub session data, :find_profile is stubbed
    @custom_user = build :user, :merchant_onboarding, add_new_business: true, partner: @partner
    @merchant_new_profile_guid = @custom_user.first_valid_profile_guid

    stub_user_profile_token(@merchant_new_profile_guid)

    # First, a normal sign in will take the user to the profile picker page
    sign_in_user @custom_user
    redirected_url = URI.parse(response.location).request_uri

    assert_equal auto_choose_account_path(profile_uid: @merchant_new_profile_guid), redirected_url

    # Second, after selecting a merchant, the user will be re-logged in auto-choosing the new profile
    # that was created for that merchant. They wont see profile picker and will continue on certification flow
    # Ideally we'd stub the session with a merchant_guid value, then, then user_sessions#create will auto-login
    # session[:merchant_guid] = @merchant_guid # <= Ideally stubbed
    UserSessionsController.any_instance.stubs(:find_profile).returns(@merchant_new_profile_guid) # <= Not ideal
    auto_login

    # Third, after the user fill About You form, the new applicant will be added to the new profile (created after previous step)
    # The user will again be re-logged auto-choosing the corresponding profile
    # Ideally we'd stub the session with a profile_guid value, then, then user_sessions#create will auto-login
    # session[:profile_guid] = custom_user # <= Ideally stubbed
    UserSessionsController.any_instance.stubs(:find_profile).returns(@merchant_new_profile_guid) # <= Not ideal
    auto_login
  end

  test 'an exception is raised if no secure redirect token is present on link account request' do
    %w[facebook quickbooks].each do |provider|
      assert_raises OmniauthLinkAccountSetupHandler::OmniauthLinkAccountSetupTokenException do
        get "/auth/#{provider}"
      end
    end
  end

  test 'an exception is raised if secure redirect token is present but invalid on link account request' do
    %w[facebook quickbooks].each do |provider|
      assert_raises OmniauthLinkAccountSetupHandler::OmniauthLinkAccountSetupTokenException do
        get "/auth/#{provider}?token=#{SecureRandom.base58(16)}"
      end
    end
  end

  test 'no exception is raised on callback when no secure redirect token is present' do
    %w[facebook quickbooks].each do |provider|
      assert_nothing_raised do
        get "/auth/#{provider}/callback"
      end
    end
  end

  test 'user is redirected to provider if secure redirect token is present on link account request (facebook)' do
    token = OmniauthSecureRedirectService.instance.generate_secure_redirect_token

    get "/auth/facebook?token=#{token}"

    assert_response :redirect
  end

  test 'user is redirected to provider if secure redirect token is present on link account request (quickbooks)' do
    token = OmniauthSecureRedirectService.instance.generate_secure_redirect_token

    get "/auth/quickbooks?token=#{token}"

    assert_response :redirect
  end

  def auto_login
    sign_in_user @custom_user
    redirected_url = URI.parse(response.location).request_uri
    auto_choose_profile_url = auto_choose_account_path(profile_uid: @merchant_new_profile_guid)
    assert_equal auto_choose_profile_url, redirected_url
    follow_redirect!
    redirected_url = URI.parse(response.location).request_uri
    certification_url = certification_path
    assert_equal certification_url, redirected_url
  end
end
