# frozen_string_literal: true

require 'test_helper'
require 'ztt_client'

class OnBoardingControllerTest < ActionDispatch::IntegrationTest
  setup do
    stub_vanity_host
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(16))

    stub_users(@partner)
    stub_load_scss_variables
  end

  test 'root should redirect to new merchant page' do
    get new_on_boarding_path
    assert_redirected_to root_path
  end

  test 'onboarding with invoice should pass argument to angular' do
    sign_in_user @merchant_new
    get new_on_boarding_path(invoice_id: 'inv_123')
    assert_response :ok
    assert_match 'invoice_id=inv_123', response.body
  end

  test 'onboarding with invoice should pass empty argument to angular if feature not enabled' do
    sign_in_user @merchant_new
    Rails.application.secrets.invoice_handling_enabled = false
    get new_on_boarding_path(invoice_id: 'inv_123')
    assert_response :ok
    Rails.application.secrets.invoice_handling_enabled = true
    assert_match 'invoice_id=>', response.body
  end

  test 'onboarding with no invoice should pass empty argument to angular' do
    sign_in_user @merchant_new
    get new_on_boarding_path
    assert_response :ok
    assert_match 'invoice_id=>', response.body
  end

  test 'onboarding with flow should pass argument to angular' do
    sign_in_user @merchant_new
    get new_on_boarding_path(flow: 'test_flow_name')
    assert_response :ok
    assert_match 'flow="test_flow_name"', response.body
  end

  test 'onboarding with no flow should default to passing "onboarding" as an argument to angular' do
    sign_in_user @merchant_new
    get new_on_boarding_path
    assert_response :ok
    assert_match 'flow="onboarding', response.body
  end

  test 'root should redirect to protected path for signed in user with no profiles' do
    sign_in_user @merchant_new
    get new_on_boarding_path
    assert_template 'on_boarding/new'
  end

  test 'merchant query api call for new user' do
    sign_in_user @merchant_new
    stub_merchant_query_request(200)
    post on_boarding_query_merchant_path
    assert_response :ok
  end

  test 'merchant query api call for new user should strip whitespace' do
    sign_in_user @merchant_new
    stub_merchant_query_request(200)
    post_query_merchant
    assert_response :ok
  end

  test 'merchant query api call logs params with PIIs filtered' do
    logged_message = '  Parameters: {"name"=>"Merchant 1", "address_line_1"=>"[FILTERED]", "city"=>"[FILTERED]", "state_province"=>"[FILTERED]",'\
                     ' "postal_code"=>"[FILTERED]", "country"=>"[FILTERED]", "address_line_2"=>"[FILTERED]", "phone_number"=>"[FILTERED]"}'

    sign_in_user @merchant_new
    stub_merchant_query_request(200)

    Rails.logger.expects(:info).at_least_once
    Rails.logger.expects(:info).with(logged_message).once

    post_query_merchant
  end

  test 'select merchant api call' do
    sign_in_user @merchant_new
    stub_select_merchant_request(200)
    post_select_merchant
    assert_response :ok
  end

  test 'select merchant api call with lead_guid' do
    sign_in_user @merchant_new
    lead_guid = "lead_#{SecureRandom.base58(16)}"
    SwaggerClient::MerchantsApi.any_instance.stubs(:select_merchant_query_result).returns(post_select_merchant(lead_guid))
    stub_select_merchant_request(200)
    post_select_merchant(lead_guid)
    assert_response :ok
  end

  test 'submit applicant api call' do
    sign_in_user @merchant_new
    stub_submit_applicant_request(200)
    post_submit_applicant
    assert_response :ok
  end

  test 'submit applicant api call should strip any whitespace characters' do
    sign_in_user @merchant_new
    stub_submit_applicant_request(200)
    post_submit_applicant(add_whitespace: true)
    assert_response :ok
  end

  test 'submit applicant api call logs params with PII filtered' do
    logged_message = '  Parameters: {"merchant_guid"=>"          m_548rvKRDbavsY3Dt          ", "first_name"=>"[FILTERED]", "last_name"=>"[FILTERED]",'\
                     ' "middle_initial"=>"[FILTERED]", "suffix"=>"[FILTERED]", "date_of_birth"=>"[FILTERED]", "address_line1"=>"[FILTERED]",'\
                     ' "city"=>"[FILTERED]", "province"=>"[FILTERED]", "country"=>"[FILTERED]", "sin"=>"[FILTERED]", "annual_income"=>"[FILTERED]",'\
                     ' "email"=>"[FILTERED]", "address_line2"=>"[FILTERED]", "postal_code"=>"[FILTERED]", "phone_number"=>"[FILTERED]"}'

    sign_in_user @merchant_new
    stub_submit_applicant_request(200)

    Rails.logger.expects(:info).at_least_once
    Rails.logger.expects(:info).with(logged_message).once

    post_submit_applicant(add_whitespace: true)
  end

  test 'merchant query api call for new user when the call fails' do
    sign_in_user @merchant_new
    stub_merchant_query_request(401)
    post on_boarding_query_merchant_path
    assert_response :unauthorized
  end

  test 'select merchant api call when the call fails' do
    sign_in_user @merchant_new
    stub_select_merchant_request(401)
    post_select_merchant
    assert_response :unauthorized
  end

  test 'submit applicant api call when the call fails' do
    sign_in_user @merchant_new
    stub_submit_applicant_request(401)
    post_submit_applicant
    assert_response :unauthorized
  end

  test 'unauthorized merchant query for redirecting to login' do
    post on_boarding_query_merchant_path
    assert_response :found
  end

  test 'merchant query when no access token' do
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_new)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)
    post on_boarding_query_merchant_path
    assert_response :unauthorized
  end

  test 'auto_login redirects to idp to authenticate' do
    sign_in_user @merchant_new
    get on_boarding_auto_login_path(merchant_guid: 'm_452QhurHMGA65qh1')
    redirected_host = URI.parse(response.location).host
    assert_equal @partner.wlmp_vanity_url, redirected_host
  end

  test 'on boarding page loads angular assets and layout' do
    stub_user_state

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])

    get merchant_path

    assert_template layout: 'application'
    assert_match 'Angular Embedding', response.body
  end

  test 'theme setup loads assets properly from default' do
    stub_user_state

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])

    get merchant_path

    assert_select "meta[name='theme']", count: 1
  end

  test 'theme setup loads assets properly from partner.partner_theme' do
    themed_partner = create :partner, identity_provider: @idp
    stub_partner_lookup_by_partner(themed_partner)
    @hostname = "#{themed_partner.subdomain}.#{Rails.application.secrets.zetatango_domain}"
    host! @hostname

    stub_user_state

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])

    get merchant_path

    assert_select "meta[name='theme']" do |elements|
      assert_equal 1, elements.size
      assert_match themed_partner.theme_name, elements.first.attribute('content').value
    end
  end

  test 'logout url is set correctly when logged in' do
    stub_user_state

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])

    get merchant_path

    assert_select "meta[name='logout_url']" do |elements|
      assert_equal 1, elements.size

      logout_uri = URI.parse(elements.first.attribute('content'))
      redirect_uri = URI.parse(CGI.parse(logout_uri.query)['redirect'].first)

      assert_equal @idp.vanity_url, logout_uri.host
      assert_equal host, redirect_uri.host
    end
  end

  test 'account info url is set correctly when logged in' do
    stub_user_state

    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])
    get merchant_path

    assert_select "meta[name='account_info_url']" do |elements|
      assert_equal 1, elements.size

      account_info_uri = URI.parse(elements.first.attribute('content'))

      assert_equal @idp.vanity_url, account_info_uri.host
      assert_equal "http://#{@idp.vanity_url}:3002/users/portal?locale=#{I18n.locale}", account_info_uri.to_s
    end
  end

  def stub_user_state
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_admin)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))
  end

  def stub_merchant_query_request(status)
    stub_request(:post, "#{Rails.configuration.zetatango_url}api/merchant_queries")
      .with(body: {},
            headers: { 'Accept' => 'application/json',
                       'Content-Type' => 'application/json',
                       'Expect' => '' })
      .to_return(status: status, body: "{ \"status\": #{status}, \"message\": \"\"}", headers: {})
  end

  def stub_select_merchant_request(status)
    stub_request(:post, "#{Rails.configuration.zetatango_url}api/merchant_queries/4db3ad92-01b0-4106-bd38-3cacbf4330f2/select")
      .with(body: {},
            headers: { 'Accept' => 'application/json',
                       'Content-Type' => 'application/json',
                       'Expect' => '' })
      .to_return(status: status, body: "{ \"status\": #{status}, \"message\": \"\"}", headers: {})
  end

  def stub_submit_applicant_request(status)
    stub_request(:post, "#{Rails.configuration.zetatango_url}api/applicants")
      .with(body: {})
      .to_return(status: status, body: "{ \"status\": #{status}, \"message\": \"\"}", headers: {})
  end

  def post_select_merchant(lead_guid = nil)
    params = {
      query_id: '4db3ad92-01b0-4106-bd38-3cacbf4330f2',
      self_attested_date_established: Time.new(2018, 12, 8, 0, 0),
      self_attested_average_monthly_sales: 1000,
      lead_guid: lead_guid
    }
    post on_boarding_select_merchant_path,
         params: params.to_json,
         headers: { 'CONTENT_TYPE' => 'application/json' }
  end

  def post_query_merchant(add_whitespace: false)
    params = {
      name: 'Merchant 1',
      address_line_1: '15 West Second Avenue',
      city: 'ottawa',
      state_province: 'on',
      postal_code: 'k1k 1k1',
      country: 'canada',
      address_line_2: '4th floor',
      phone_number: '6135551234'
    }

    if add_whitespace
      params.each do |key, value|
        params[key] = ' ' * 10 + value + ' ' * 10 if value.is_a?(String)
      end
    end

    post on_boarding_query_merchant_path,
         params: params.to_json,
         headers: { 'CONTENT_TYPE' => 'application/json' }
  end

  def post_submit_applicant(add_whitespace: false)
    params = {
      merchant_guid: 'm_548rvKRDbavsY3Dt',
      first_name: 'bob',
      last_name: 'builder',
      middle_initial: 't',
      suffix: 'jr',
      date_of_birth: (Time.now - 30.years),
      address_line1: '15 West Second Avenue',
      city: 'ottawa',
      province: 'on',
      country: 'canada',
      sin: '000 000 000',
      annual_income: '50000',
      email: 'user@email.com',
      address_line2: '4th floor',
      postal_code: 'k1t 3c4',
      phone_number: '6139818286'
    }

    if add_whitespace
      params.each do |key, value|
        params[key] = ' ' * 10 + value + ' ' * 10 if value.is_a?(String)
      end
    end

    post on_boarding_submit_applicant_path,
         params: params.to_json,
         headers: { 'CONTENT_TYPE' => 'application/json' }
  end
end
