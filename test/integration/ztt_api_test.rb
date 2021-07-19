# frozen_string_literal: true

require 'test_helper'
require 'ztt_client'

class ZttApiTest < ActionDispatch::IntegrationTest
  def setup
    @partner = create :partner
    stub_users(@partner)

    @delegated_access_token = SecureRandom.base58(32)
    @idp_access_token = SecureRandom.base58(32)
    @api_access_token = SecureRandom.base58(32)

    TokenValidator::OauthTokenService.instance.clear

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 200, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)
  end

  test 'redirected user cannot see offers after logout' do
    stub_merchant_req

    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
    follow_redirect!
    assert_template 'merchants/show'

    get logout_path
    get merchant_path
    assert_redirected_to root_path
  end

  test 'logout redirects to new merchant page' do
    stub_merchant_req

    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
    follow_redirect!
    assert_template 'merchants/show'

    get logout_path
    assert_redirected_to new_merchant_path
  end

  test 'redirect to merchant page shows correct logout path' do
    stub_merchant_req

    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
    follow_redirect!
    assert_template 'merchants/show'
    assert_select 'meta[name="logout_url"]' do
      assert_select ":match('content', ?)", logout_url
    end
  end

  test 'sign in and redirect to merchant page shows correct logout path' do
    stub_merchant_req

    sign_in_user @merchant_admin
    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
    follow_redirect!
    assert_template 'merchants/show'

    assert_select 'meta[name="logout_url"]' do
      assert_select ":match('content', ?)", logout_url
    end
  end

  test 'Partner admin cannot see offers after logout' do
    stub_merchant_req

    sign_in_user @merchant_admin
    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
    follow_redirect!
    assert_template 'merchants/show'

    get logout_path
    get merchant_path
    assert_redirected_to root_path
  end

  test 'User is redirected to the application page when offers are not present' do
    stub_merchant_req

    get generate_jwt_path(@delegated_access_token)
    assert_redirected_to root_path
    follow_redirect!
    assert_redirected_to merchant_path
    follow_redirect!
    assert_template 'layouts/application'
  end

  test 'idp unresponsive (request 1) redirects' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_raise(Errno::ETIMEDOUT)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'idp unresponsive (request 2) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_raise(Errno::ETIMEDOUT)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'idp offline (request 1) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_raise(Errno::ECONNREFUSED)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'idp offline (request 2) returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_raise(Errno::ECONNREFUSED)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'unauthorized error (idp access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 401)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'forbidden error (idp access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 403)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 201, body: { access_token: @api_access_token, expires_in: 7200 }.to_json)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'unauthorized error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 401)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'forbidden error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 403)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'bad request error (api access token) from idp returns nil access token' do
    WebMock.reset!
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/clients/token")
      .with(body: { access_token: @delegated_access_token }, headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 400)

    get generate_jwt_path(@delegated_access_token)
    assert_response :not_found
  end

  test 'no access token returns error' do
    get merchant_auth_path
    assert_response :bad_request
    get generate_jwt_path(nil)
    assert_response :bad_request
    get generate_jwt_path('')
    assert_response :bad_request
  end

  def good_merchant
    SwaggerClient::Merchant.new(id: 'm_3EwxpshNqhEHFEJC',
                                email: 'peter.rabinovitch@zetatango.com',
                                partner_merchant_id: '234654',
                                business_num: '649728513',
                                name: 'Peter’s π Shoppe',
                                campaigns: [{ id: '1', name: 'Dream_Pilot_Demo', description: 'jewelers', partner_id: 1,
                                              total_capital: 250_000.0, currency: 'CAD', start_date: Date.today,
                                              end_date: Date.today + 1.year, max_merchants: 10, min_amount: 2000.0, max_amount: 10_000.0,
                                              remittance_rates: '[10, 15, 20, 25, 30]', state: 'active', terms_template: "\nSample\n" }])
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

  def valid_offers
    [].push(SwaggerClient::FinancingOffer.new(
              id: 'fo_eUJykRD1vhPR9Fmr', state: 'approved',
              variable: var_off, currency: 'CAD'
            ))
  end

  def var_off
    off_bounds = SwaggerClient::FinancingOfferBounds.new(min_adv_amount: 2000, max_adv_amount: 10_000, rates: rates_array)

    SwaggerClient::FinancingVariableOffer.new(id: 'fvo_Q2RJb7otetWaQ26n',
                                              min_adv_amount: 2000.0,
                                              max_adv_amount: 10_000.0,
                                              offer_bounds: [off_bounds])
  end

  def rates_array
    [SwaggerClient::FinancingRates.new(factor_rate: 0.29698559619858433, remittance_rate: 0.1),
     SwaggerClient::FinancingRates.new(factor_rate: 0.1801558347970995, remittance_rate: 0.15)]
  end

  def stub_merchant_req
    stub_request(:get, 'http://localhost:3000/api/financing/merchants/m_cNwWuMCv18KKVeo2')
      .with(headers: { 'Accept' => 'application/json',
                       'Authorization' => 'Basic ZDU3MGNkZGJkOTg4NTAyNWE2NWE4MGI3ZjAzOWE2MGUyNDNiOTdkNGQxNmM5MWIwNGExNzQ2ZD' \
         'BmMjNhNzY4YjpwXzdKOUZKdjZxcG5HOFE4RTI=',
                       'Expect' => '' })
      .to_return(status: 200, body: '', headers: {})
  end
end
