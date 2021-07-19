# frozen_string_literal: true

require 'test_helper'
require 'ztt_client'

class MerchantsControllerTest < ActionDispatch::IntegrationTest
  def setup
    Rails.application.secrets.warn_unsupported_browsers = true
    stub_vanity_host
    stub_users(@partner)
    stub_load_scss_variables

    @valid_merchant_name = 'New User'
    @valid_merchant_email = 'test@example.com'
    @tracked_object_id = "obj_#{SecureRandom.base58(16)}"

    @merchant_add_profile = {
      uid: "prof_#{SecureRandom.base58(16)}",
      properties: {
        role: 'merchant_new',
        partner: @partner.id
      }
    }
  end

  test 'sign up page with subdomain sets subdomain' do
    get new_merchant_path
    assert_equal @partner.subdomain, session[:partner].subdomain
  end

  test 'sign up page with invoice sets invoice (conf_merchant_welcome is set to true)' do
    @partner.conf_merchant_welcome = true
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path(invoice_id: 'inv_123')

    assert_equal 'inv_123', session[:invoice_id]
  end

  test 'sign up page with invoice sets invoice_id in session (conf_merchant_welcome is set to false)' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path(invoice_id: 'inv_123')

    assert_equal 'inv_123', session[:invoice_id]
  end

  test 'sign up page with no invoice set leaves invoice_id blank' do
    get new_merchant_path
    assert_nil session[:invoice_id]
  end

  test 'landing page loads the correct layout and no angular assets' do
    get new_merchant_path

    assert_template layout: 'landing'
    refute_match 'Angular Embedding', response.body
  end

  test 'sign up page with flow sets flow (conf_merchant_welcome is set to true)' do
    @partner.conf_merchant_welcome = true
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path(flow: 'test_flow_name')

    assert_equal 'test_flow_name', session[:flow]
  end

  test 'sign up page with flow sets flow in session (conf_merchant_welcome is set to false)' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path(flow: 'test_flow_name')

    assert_equal 'test_flow_name', session[:flow]
  end

  test 'sign up page with no flow set leaves flow blank' do
    get new_merchant_path
    assert_nil session[:flow]
  end

  test 'sign up page redirects to 404 with invalid user parameter' do
    get new_merchant_path(user: '//example.org')
    assert_response :not_found
  end

  test 'landing page redirects the user in if already signed in' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))

    sign_in_user @merchant_new

    get new_merchant_path

    assert_response :redirect

    login_uri = URI.parse(response.location)
    query_params = CGI.parse(login_uri.query)

    assert_equal '/auth/user', login_uri.path
    assert_equal @partner.id, query_params['partner'].first
  end

  test 'landing page saves invoice id before redirecting the user in if already signed in' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))

    sign_in_user @merchant_new

    get new_merchant_path(invoice_id: 'inv_123')

    assert_equal 'inv_123', session[:invoice_id]
  end

  test 'landing page saves flow before redirecting the user in if already signed in' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))

    sign_in_user @merchant_new

    get new_merchant_path(flow: 'test_flow_name')

    assert_equal 'test_flow_name', session[:flow]
  end

  test 'landing page sends tracked object id to IdP if already signed in' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    sign_in_user @merchant_new

    get new_merchant_path, params: {
      tracked_object_id: @tracked_object_id
    }

    assert_response :redirect

    login_uri = URI.parse(response.location)
    query_params = CGI.parse(login_uri.query)

    assert_equal '/auth/user', login_uri.path
    assert_equal @partner.id, query_params['partner'].first
    assert_equal @tracked_object_id, query_params['tracked_object_id'].first
  end

  test 'landing page sign up links contain merchant email address as params for IDP when provided' do
    get new_merchant_path, params: {
      email: @valid_merchant_email
    }

    assert_response :success

    sign_up_link_matcher = @response.body.to_s.scan(/#{{ email: @valid_merchant_email }.to_query}/)
    assert_equal 3, sign_up_link_matcher.length
    sign_up_link_matcher.each do |match|
      uri = URI.parse(match)
      assert_equal({ email: @valid_merchant_email }.to_query.to_s, uri.to_s)
    end
  end

  test 'landing page sign in link contains merchant email address as param for IDP when provided' do
    get new_merchant_path, params: {
      email: @valid_merchant_email
    }

    assert_response :success

    sign_in_link_matcher = @response.body.to_s.scan(/#{{ login_hint: @valid_merchant_email }.to_query}/)
    assert_equal 1, sign_in_link_matcher.length
    uri = URI.parse(sign_in_link_matcher[0])
    assert_equal({ login_hint: @valid_merchant_email }.to_query.to_s, uri.to_s)
  end

  test 'landing page loads GTM if partner has gtm_container_id attribute set' do
    get new_merchant_path

    assert_response :success
    assert_match "data-gtm-container-id=\"#{@partner.gtm_container_id}\"", @response.body
  end

  test 'landing page does not load GTM if partner does not have gtm_container_id attribute set' do
    @partner.gtm_container_id = nil
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path

    assert_response :success
    assert_no_match 'data-gtm-container-id', @response.body
  end

  test 'root page is shown for a partner admin that is signed in' do
    sign_in_user @partner_admin

    get new_merchant_path

    assert_redirected_to root_path
  end

  test 'landing page contains language toggle with FR label by default' do
    get new_merchant_path

    assert_select 'input#lang-toggle' do |elements|
      assert_equal :en, I18n.locale
      assert_equal 1, elements.size
      assert_match 'FR', elements.first.attribute('value').value
    end
  end

  test 'landing page contains language toggle with EN label if locale is :fr' do
    get "#{new_merchant_path}?locale=fr"

    assert_select 'input#lang-toggle' do |elements|
      assert_equal :fr, I18n.locale
      assert_equal 1, elements.size
      assert_match 'EN', elements.first.attribute('value').value
    end
  end

  test 'landing page creates a clicked event for the tracked object when specified' do
    ZetatangoService.instance.expects(:add_tracked_object_event).with(@tracked_object_id, 'clicked')

    get new_merchant_path, params: { tracked_object_id: @tracked_object_id }
  end

  test 'landing page still renders if exception occurs registering click event' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).raises(ZetatangoService::ZetatangoServiceException)

    get new_merchant_path, params: { tracked_object_id: @tracked_object_id }

    assert_response :ok
  end

  test 'Ario default theme is loaded, when no partner theme is configured' do
    stub_config_render_css
    host! "#{@no_theme_partner.subdomain}.#{Rails.application.secrets.zetatango_domain}"

    get new_merchant_path

    assert_match("<meta name=\"theme\" content=\"#{ThemeSetup::DEFAULT_THEME_NAME}\">", response.body)
    assert_match(/LANDING STYLES/, response.body)
    assert_match(ThemeSetup::PARTNER_THEME_NOT_PRESENT_TEXT[4..-4], response.body)
    assert_match('#862890', response.body) # Landing $primary
    assert_match('#862890', response.body) # Landing theme-colors('accent')
  end

  test 'renders theme when partner has theme configured' do
    partner_theme = {
      primary_colour: '#2d3d55',
      secondary_colour: '#da3831',
      logo_url: 'https://s3.ca-central-1.amazonaws.com/theme_directory/logo.png',
      logo_height: 52,
      font: 'Open Sans'
    }

    stub_config_render_css
    stub_load_scss_variables(partner_theme)

    get new_merchant_path

    assert_match("<meta name=\"theme\" content=\"#{@partner.theme_name}\">", response.body)
    assert_match(/LANDING STYLES/, response.body)
    assert_no_match(ThemeSetup::PARTNER_THEME_NOT_PRESENT_TEXT[4..-4], response.body)
    assert_match(partner_theme[:primary_colour], response.body)
    assert_match(partner_theme[:secondary_colour], response.body)
    assert_match(partner_theme[:logo_url], response.body)
    assert_match(partner_theme[:logo_height].to_s, response.body)
    assert_match(partner_theme[:font], response.body)
  end

  test 'it raises a bugsnag on specified layout not being set or not being present' do
    ApplicationController.any_instance.stubs(:valid_layout?).raises(ThemeSetup::InvalidLayoutException)
    Bugsnag.expects(:notify)

    get new_merchant_path
  end

  test 'it raises a bugsnag on error retrieving malformed urls' do
    ApplicationController.any_instance.stubs(:load_scss_variables).raises(SocketError)
    Bugsnag.expects(:notify)

    get new_merchant_path
  end

  test 'it raises a bugsnag on OpenSSL error' do
    stub_config_render_css
    ApplicationController.any_instance.stubs(:load_scss_variables).raises(OpenSSL::OpenSSLError, 'OpenSSL Error')
    Bugsnag.expects(:notify)

    get new_merchant_path

    assert_match("<meta name=\"theme\" content=\"#{@partner.theme_name}\">", response.body)
    assert_match(/LANDING STYLES/, response.body)
    assert_match('#862890', response.body) # Ario $primary
    assert_match('#862890', response.body) # Ario theme-colors('accent')
  end

  test 'it raises a bugsnag on error SCSS syntax error' do
    stub_config_render_css
    ApplicationController.any_instance.stubs(:generate_css).raises(SassC::SyntaxError, 'Syntax Error')
    Bugsnag.expects(:notify)

    get new_merchant_path

    assert_match(ThemeSetup::THEME_COMPILATION_ERROR_TEXT, response.body)
  end

  test 'it raises a bugsnag on error retrieving file that does not exist' do
    stub_config_render_css
    URI::HTTP.any_instance.stubs(:open).returns(status: 403)
    Bugsnag.expects(:notify)

    get new_merchant_path

    assert_match("<meta name=\"theme\" content=\"#{@partner.theme_name}\">", response.body)
    assert_match(/LANDING STYLES/, response.body)
    assert_match('#862890', response.body) # Ario $primary
    assert_match('#862890', response.body) # Ario theme-colors('accent')
  end

  test 'it raises a bugsnag on error retrieving url that is gibberish' do
    stub_config_render_css
    ApplicationController.any_instance.stubs(:load_scss_variables).raises(NoMethodError)
    Bugsnag.expects(:notify)

    get new_merchant_path

    assert_match("<meta name=\"theme\" content=\"#{@partner.theme_name}\">", response.body)
    assert_match(/LANDING STYLES/, response.body)
    assert_match('#862890', response.body) # Ario $primary
    assert_match('#862890', response.body) # Ario theme-colors('accent')
  end

  test 'sign up page sign in link has partner guid' do
    get new_merchant_path
    assert_select ' a#link-sign-in-landing', href: /"#{@partner.id}"/
  end

  test 'sign up page with subdomain sets subdomain for complex URLs' do
    configuration_domain = Rails.application.secrets.zetatango_domain
    Rails.application.secrets.zetatango_domain = 'staging.alpha.zetatango.com'
    host! "#{@partner.subdomain}.staging.alpha.zetatango.com" # set the hostname for the request
    get new_merchant_path
    assert_equal @partner.subdomain, session[:partner].subdomain
    Rails.application.secrets.zetatango_domain = configuration_domain
  end

  test 'hitting the default wlmp url should not set the partner in session' do
    host! URI.parse(Rails.configuration.foghorn_url).host
    get new_merchant_path
    assert_nil session[:partner]
  end

  test 'hitting a vanity should set the partner in session' do
    get new_merchant_path
    assert_not_nil session[:partner]
  end

  test 'error looking up partner redirects and resets session' do
    ZetatangoService.any_instance.stubs(:partner_lookup).raises(ZetatangoService::ZetatangoServiceException)
    host! 'invalid.zetatango.com'
    get new_merchant_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.foghorn_url
  end

  test 'hitting an invalid subdomain redirects and resets session' do
    ZetatangoService.any_instance.stubs(:partner_lookup).returns(nil)
    host! 'invalid.zetatango.com'
    get new_merchant_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.sinkhole_vanity_url
  end

  test 'error looking up idp redirects and resets' do
    IdPService.any_instance.stubs(:identity_provider_lookup).raises(IdPService::IdPServiceException)
    get new_merchant_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.foghorn_url
  end

  test 'idp cannot be found redirects and resets' do
    IdPService.any_instance.stubs(:identity_provider_lookup).returns(nil)
    get new_merchant_path
    assert_nil session[:partner]
    assert_redirected_to Rails.configuration.foghorn_url
  end

  test 'hitting a vanity should set a valid partner object in the session' do
    get new_merchant_path
    assert_instance_of Partner, session[:partner]
    assert session[:partner].valid?
  end

  test 'hitting a vanity should set the partner guid and subdomain' do
    host! host # set the hostname for the request
    get new_merchant_path
    partner = session[:partner]
    assert_equal @partner.subdomain, partner.subdomain
    assert_equal @partner.id, partner.id
  end

  test 'hitting a vanity should set the partner idp and config' do
    get new_merchant_path
    idp = session[:partner].identity_provider
    assert_instance_of IdentityProvider, idp
    assert idp.valid?
    assert_equal @partner.conf_merchant_welcome, session[:partner].conf_merchant_welcome
  end

  test 'hitting a vanity should set the partner idp vanity and vanity URL' do
    get new_merchant_path
    idp = session[:partner].identity_provider
    assert_instance_of IdentityProvider, idp
    assert_equal @idp.id, idp.id
    assert_equal @idp.subdomain, idp.subdomain
    assert_equal @idp.vanity_url, idp.vanity_url
  end

  test 'sign up page for localhost does not set subdomain' do
    host! 'localhost' # set the hostname for the request
    get new_merchant_path
    assert_nil session[:partner]
  end

  test 'sign up page for non-zetatango.com does not set subdomain' do
    host! 'dreampayments.acme.com' # set the hostname for the request
    get new_merchant_path
    assert_nil session[:partner]
  end

  test 'visiting signup page without vanity url does not perform lookup' do
    configuration = Rails.configuration.foghorn_url
    Rails.configuration.foghorn_url = 'http://zt-wlmp.zetatango.com/'

    host! URI.parse(Rails.configuration.foghorn_url).host # set the hostname for the request
    get new_merchant_path

    Rails.configuration.foghorn_url = configuration

    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 0
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/zt-wlmp", times: 0
  end

  test 'visiting signup page with vanity url looks up partner' do
    get new_merchant_path
    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}", times: 1
  end

  test 'visiting signup page with vanity url multiple times looks up partner once' do
    get new_merchant_path
    get new_merchant_path
    get new_merchant_path
    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}", times: 1
  end

  test 'visiting signup page with vanity url sets partner' do
    get new_merchant_path
    assert_equal @partner.id, session[:partner].id
  end

  test 'visiting signup page with vanity url sets base url correctly' do
    https!
    get new_merchant_path
    assert_select "base[href='https://#{@partner.subdomain}.zetatango.com/']"
  end

  test 'sign up page with no partner results in all apply buttons disabled' do
    host! URI.parse(Rails.configuration.foghorn_url).host
    get new_merchant_path
    assert_response :ok

    assert_select 'a#link-sign-up-landing-1[disabled=disabled]'
    assert_select 'a#link-sign-up-landing-2[disabled=disabled]'
    assert_select 'a#link-sign-up-landing-3[disabled=disabled]'
  end

  test 'visiting the sign up page when conf_merchant_welcome is true returns ok response' do
    @partner.conf_merchant_welcome = true
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)
    get new_merchant_path
    assert_response :ok
  end

  test 'visiting the sign up page when conf_merchant_welcome is true sets the correct sign up url parameters' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)

    @referrer = 'myproduct'

    @partner.conf_merchant_welcome = true

    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path, params: {
      supplier: @referrer,
      tracked_object_id: @tracked_object_id
    }

    assert_response :ok

    # Apply now link
    apply_now_matcher = response.body.match(/href="(.+?)">Apply now/)

    apply_now_link = apply_now_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(apply_now_link).query)

    assert_equal @partner.id, query_params['partner'].first
    assert_equal @referrer, query_params['referrer'].first
    assert_equal @tracked_object_id, query_params['tracked_object_id'].first

    # Get started link
    get_started_matcher = response.body.match(/href="(.+?)">Get started/)

    get_started_link = get_started_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(get_started_link).query)

    assert_equal @partner.id, query_params['partner'].first
    assert_equal @referrer, query_params['referrer'].first
    assert_equal @tracked_object_id, query_params['tracked_object_id'].first
  end

  test 'visiting the sign up page when conf_merchant_welcome is true sets the correct sign in url parameters' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)

    @referrer = 'myproduct'
    @partner.conf_merchant_welcome = true

    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path, params: {
      supplier: @referrer,
      tracked_object_id: @tracked_object_id
    }

    assert_response :ok

    # Sign in link
    sign_in_matcher = response.body.match(/id="link-sign-in-landing" href="(.+?)"/)

    assert_not_nil sign_in_matcher[1]

    sign_in_link = sign_in_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(sign_in_link).query)

    assert_equal @partner.id, query_params['partner'].first
    assert_equal @tracked_object_id, query_params['tracked_object_id'].first
  end

  test 'visiting the sign up page when conf_merchant_welcome is true can set referrer parameter' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)

    @referrer = 'myproduct'

    @partner.conf_merchant_welcome = true

    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path, params: {
      referrer: @referrer,
      tracked_object_id: @tracked_object_id
    }

    assert_response :ok

    # Apply now link
    apply_now_matcher = response.body.match(/href="(.+?)">Apply now/)
    apply_now_link = apply_now_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(apply_now_link).query)

    assert_equal @referrer, query_params['referrer'].first

    # Get started link
    get_started_matcher = response.body.match(/href="(.+?)">Get started/)
    get_started_link = get_started_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(get_started_link).query)

    assert_equal @referrer, query_params['referrer'].first
  end

  test 'visiting the sign up page when conf_merchant_welcome is true does not set referrer if not specified' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)

    @referrer = 'myproduct'
    @partner.conf_merchant_welcome = true

    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path, params: {
      tracked_object_id: @tracked_object_id
    }

    assert_response :ok

    # Apply now link
    apply_now_matcher = response.body.match(/href="(.+?)">Apply now/)

    apply_now_link = apply_now_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(apply_now_link).query)

    assert_equal @partner.id, query_params['partner'].first
    assert_equal @tracked_object_id, query_params['tracked_object_id'].first
    refute query_params['referrer'].first

    # Get started link
    get_started_matcher = response.body.match(/href="(.+?)">Get started/)

    get_started_link = get_started_matcher[1].gsub(/&amp;/, '&')

    query_params = CGI.parse(URI.parse(get_started_link).query)

    assert_equal @partner.id, query_params['partner'].first
    assert_equal @tracked_object_id, query_params['tracked_object_id'].first
    refute query_params['referrer'].first
  end

  test 'visiting the sign up page when conf_merchant_welcome is false redirects to IdP sign up' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)
    get new_merchant_path
    assert_response :redirect

    redirect_uri = URI.parse(response.location)

    assert_equal @partner.identity_provider.vanity_url, redirect_uri.host
    assert_equal '/users/sign_up', redirect_uri.path
  end

  test 'landing page registers click event if set when conf_merchant_welcome is false' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    ZetatangoService.instance.expects(:add_tracked_object_event).with(@tracked_object_id, 'clicked')

    get new_merchant_path, params: { tracked_object_id: @tracked_object_id }
  end

  test 'landing page still redirects if exception occurs registering invite tracking' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    ZetatangoService.instance.stubs(:add_tracked_object_event).raises(ZetatangoService::ZetatangoServiceException)

    get new_merchant_path, params: { tracked_object_id: @tracked_object_id }

    assert_response :redirect
  end

  test 'visiting the sign up page when conf_merchant_welcome is false redirects to IdP with correct params (no referer)' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)
    get new_merchant_path
    assert_response :redirect

    assert_redirected_to(/partner=#{@partner.id}/)
  end

  test 'visiting the landing page when conf_merchant_welcome is false redirects to IdP with correct params (with referrer)' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)

    referrer = 'myproduct'
    invoice_id = "bpiv_#{SecureRandom.base58(16)}"
    flow = 'test_flow_name'
    email = 'test@example.com'
    name = 'merchant1'

    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path, params: {
      supplier: referrer,
      invoice_id: invoice_id,
      tracked_object_id: @tracked_object_id,
      flow: flow,
      email: email,
      name: name
    }

    assert_response :redirect

    assert_redirected_to(/partner=#{@partner.id}/)
    assert_redirected_to(/referrer=#{CGI.escape(referrer)}/)
    assert_redirected_to(/invoice_id=#{CGI.escape(invoice_id)}/)
    assert_redirected_to(/tracked_object_id=#{CGI.escape(@tracked_object_id)}/)
    assert_redirected_to(/flow=#{CGI.escape(flow)}/)
    assert_redirected_to(/email=#{CGI.escape(email)}/)
    assert_redirected_to(/name=#{CGI.escape(name)}/)
  end

  test 'visiting the landing page when conf_merchant_welcome is false redirects to IdP with correct params (with external_id)' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).returns(nil)

    referrer = 'myproduct'
    external_id = SecureRandom.uuid

    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get new_merchant_path, params: {
      supplier: referrer,
      external_id: external_id
    }

    assert_response :redirect

    assert_redirected_to(/partner=#{@partner.id}/)
    assert_redirected_to(/referrer=#{CGI.escape(referrer)}/)
    assert_redirected_to(/external_id=#{CGI.escape(external_id)}/)
  end

  test 'logging out merchant redirects to sign in page when conf_merchant_welcome is false with correct params' do
    @partner.conf_merchant_welcome = false
    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)

    get logout_path
    assert_response :redirect

    follow_redirect!

    assert_redirected_to(/partner=#{@partner.id}/)
    assert_redirected_to(%r{users/sign_in})
  end

  test 'logging out merchant redirects to welcome page when conf_merchant_welcome is true' do
    get logout_path
    assert_response :redirect

    follow_redirect!

    assert_redirected_to(%r{merchants/new})
  end

  test 'logging out merchant redirects to welcome page with same locale set' do
    get logout_path(locale: :fr)
    assert_response :redirect

    assert_includes request.query_parameters, :locale
    follow_redirect!

    assert_includes request.query_parameters, :locale
    follow_redirect!

    assert_match 'Bienvenue!', response.body
    assert_match 'locale=fr', request.original_fullpath
  end

  test 'sign up page requires name field' do
    post merchants_path, params: {
      partner: @partner.id,
      email: @valid_merchant_email
    }
    assert_template 'merchants/new'
    assert_equal 'Name cannot be blank', flash[:alert]
  end

  test 'sign up page requires email field' do
    post merchants_path, params: {
      partner: @partner.id,
      name: @valid_merchant_name
    }
    assert_template 'merchants/new'
    assert_equal 'Email cannot be blank', flash[:alert]
  end

  test 'sign up page requires valid partner' do
    host! URI.parse(Rails.configuration.foghorn_url).host
    post merchants_path, params: {
      name: @valid_merchant_name,
      email: @valid_merchant_email
    }
    assert_template 'merchants/new'
    assert_equal 'Please contact us through your partner', flash[:alert]
  end

  test 'sign up page requires valid email' do
    post merchants_path, params: {
      partner: @partner.id,
      name: @valid_merchant_name,
      email: 'thisisnotanemailaddress'
    }
    assert_template 'merchants/new'
    assert_equal 'Email is invalid', flash[:alert]
  end

  test 'valid parameters causes redirect to IdP' do
    get new_merchant_path
    post merchants_path, params: {
      partner: @partner.id,
      name: @valid_merchant_name,
      email: @valid_merchant_email
    }

    redirect_uri = URI.parse(response.location)

    assert_equal @idp.vanity_url, redirect_uri.host
    assert_equal '/users/sign_up', redirect_uri.path
    assert_redirected_to(/partner=/)
    assert_redirected_to(/name=/)
    assert_redirected_to(/email=/)
  end

  test 'user not signed in redirects to sign in' do
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(false)
    get merchant_path
    assert_redirected_to root_path
  end

  test 'nil access token renders error' do
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_admin)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)
    get merchant_path
    assert_response :not_found
  end

  test 'the meta value of partner_id is set properly' do
    stub_user_state

    stub_good_merchant_without_application

    get merchant_path
    assert_select "meta[name='partner_id']" do |elements|
      assert_equal 1, elements.size

      assert_equal @partner.id, elements.first.attributes['content'].value
    end
  end

  test 'can view offers in delegated access mode' do
    stub_user_state

    ApplicationController.any_instance.stubs(:redirected_user_signed_in?).returns(true)

    stub_good_merchant_without_application

    get merchant_path
    assert_response :ok
  end

  test 'no profile user is redirected to the root page' do
    ApplicationController.any_instance.stubs(:current_user).returns(@no_profile_user)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get merchant_path
    assert_redirected_to root_path
  end

  test 'partner admin is redirected to the root page' do
    ApplicationController.any_instance.stubs(:current_user).returns(@partner_admin)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))

    get merchant_path
    assert_redirected_to root_path
  end

  test 'merchant new is redirected to create a new application' do
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_new)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))

    get merchant_path
    assert_redirected_to new_on_boarding_path
  end

  test 'merchant new redirects with flow and invoice_id params' do
    @merchant_new.stubs(:selected_profile).returns(@merchant_new.profiles.first[:uid])

    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_new)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))

    get merchant_path(invoice_id: 'test_invoice_id', flow: 'test_flow_name')
    assert_redirected_to new_on_boarding_path(invoice_id: 'test_invoice_id', flow: 'test_flow_name')
  end

  test 'merchant new does not redirect with flow param when the merchant add profile is selected' do
    @merchant_new.stubs(:profiles).returns([@merchant_add_profile])
    @merchant_new.stubs(:selected_profile).returns(@merchant_add_profile[:uid])

    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_new)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))

    get merchant_path(invoice_id: 'test_invoice_id', flow: 'test_flow_name')
    assert_redirected_to new_on_boarding_path(invoice_id: 'test_invoice_id')
  end

  test 'User is redirected to the offers page when offers are present' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path
    assert_template 'merchants/show'
  end

  test 'User is redirected to the application page when offers are not present' do
    stub_user_state
    stub_bad_merchant

    get merchant_path
    assert_template 'layouts/application'
  end

  test 'User is rendered the warning page when no offers are present on an unsupported browser' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['chrome'] }
    assert_template layout: 'warning'
  end

  test 'User is rendered the warning page when offers are not present on an unsupported browser' do
    stub_user_state
    stub_bad_merchant

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['chrome'] }
    assert_template layout: 'warning'
  end

  test '#show with Bad request Format returns a 404' do
    stub_good_merchant_without_application

    get logout_path
    get "#{merchant_path}.dashboard"
    assert_equal 404, response.status
  end

  test 'Logged in user with application using supported browser renders merchant page' do
    stub_user_state
    stub_good_merchant_with_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['chrome'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user with application using unsupported browser renders warning page' do
    stub_user_state
    stub_good_merchant_with_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['chrome'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using Chrome 54+ renders merchant page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['chrome'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user using Chrome 53 renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['chrome'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using Firefox 55+ renders merchant page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['firefox'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user using Firefox 54 renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['firefox'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using Safari 11+ on iOS renders merchant page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['safari_ios'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user using Safari 10 on iOS renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['safari_ios'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using Safari 11+ on macOS renders merchant page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['safari_macos'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user using Safari 10 on macOS renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['safari_macos'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using Edge 77+ renders merchant page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['edge'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user using Edge 25 renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['edge'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using Samsung Browser 4 renders merchant page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => good_browsers['samsung'] }
    assert_template 'merchants/show'
  end

  test 'Logged in user using Samsung Browser 3 renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['samsung'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using webview based browser renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['webview'] }
    assert_template layout: 'warning'
  end

  test 'Logged in user using IE 6 renders warning page' do
    stub_user_state
    stub_good_merchant_without_application

    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['ie'] }
    assert_template layout: 'warning'
  end

  test 'No warning page is rendered when warning option is disabled' do
    stub_user_state
    stub_good_merchant_without_application

    Rails.application.secrets.warn_unsupported_browsers = false
    get merchant_path, headers: { 'USER_AGENT' => bad_browsers['ie'] }
    assert_template 'merchants/show'
  end

  test 'Not logged in user using Chrome 54 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => good_browsers['chrome'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Chrome 53 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['chrome'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Firefox 55 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => good_browsers['firefox'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Firefox 54 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['firefox'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Safari 11 on iOS is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => good_browsers['safari_ios'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Safari 10 on iOS is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['safari_ios'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Safari 11 on macOS is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => good_browsers['safari_macos'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Safari 10 on macOS is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['safari_macos'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Edge 77+ is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => good_browsers['edge'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Edge 25 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['edge'] }
    assert_template 'landing'
  end

  test 'Not logged in user using IE 6 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['ie'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Samsung Browser 4 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => good_browsers['samsung'] }
    assert_template 'landing'
  end

  test 'Not logged in user using Samsung Browser 3 is redirected to landing page' do
    get new_merchant_path, headers: { 'USER_AGENT' => bad_browsers['samsung'] }
    assert_template 'landing'
  end

  #
  # # GET /marketing
  #
  test 'returns 404 if user is not logged in' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns('')

    sign_in_user @merchant_new

    get marketing_path

    assert_response :not_found
  end

  test 'returns 200 if user is logged in' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))

    stub_good_merchant_with_application

    sign_in_user @merchant_new

    get marketing_path

    assert_response :ok
    assert_template :marketing
  end

  #
  # # GET /insights
  #
  test '#insights returns 404 if user is not logged in' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns('')

    sign_in_user @merchant_new

    get insights_path

    assert_response :not_found
  end

  test '#insights returns 200 if user is logged in and insights is enabled' do
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))
    Rails.application.secrets.stubs(:insights_enabled).returns('true')

    stub_good_merchant_with_application

    sign_in_user @merchant_new

    get insights_path

    assert_response :ok
    assert_template :insights
  end

  def stub_user_state
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_admin)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))
  end

  def stub_good_merchant_with_application
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([good_application])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])
  end

  def stub_good_merchant_without_application
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])
  end

  def stub_bad_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(bad_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])
  end

  def bad_merchant
    SwaggerClient::Merchant.new(id: 'm_badMerchant',
                                email: 'none',
                                partner_merchant_id: '234654',
                                business_num: '649728513',
                                name: 'Peter’s π Shoppe',
                                campaigns: [{ id: '1', name: 'Dream_Pilot_Demo', description: 'jewelers', partner_id: 1,
                                              total_capital: 250_000.0, currency: 'CAD', start_date: Date.today,
                                              end_date: Date.today + 1.year, max_merchants: 10, min_amount: 2000.0, max_amount: 10_000.0,
                                              remittance_rates: '[10, 15, 20, 25, 30]', state: 'active', terms_template: "\nSample\n" }])
  end

  def good_advance
    SwaggerClient::FinancingAdvance.new(
      id: 'fa_YD6ipnC1TXYcD4Tz',
      state: 'remitting',
      application_id: 'fap_d21xn72PghBPxm1W',
      merchant_id: 'm_n8bxcYr9khMSAbnR',
      merchant_account_id: 'a_sLk4VCtbvdc8Xpbo',
      terms: "\nThese are the terms and conditions\n",
      advance_amount: 4100.0,
      currency: 'CAD',
      factor_rate: 1.1,
      remittance_rate: 0.25,
      factor_amount: 410.0,
      advance_remitted_amount: 0.0,
      factor_remitted_amount: 0.0,
      advance_remaining_amount: 4100.0,
      factor_remaining_amount: 410.0,
      activated_at: Time.now.to_date - 20, # in local time, not UTC,
      advance_sent_at: Time.now.to_date - 1
    )
  end

  def good_browsers
    Rails.application.config.good_browsers
  end

  def bad_browsers
    Rails.application.config.bad_browsers
  end
end
