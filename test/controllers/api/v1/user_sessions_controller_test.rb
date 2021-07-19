# frozen_string_literal: true

require 'test_helper'

class Api::V1::UserSessionsControllerTest < ActionDispatch::IntegrationTest
  include ScimHelper

  def setup
    stub_misc
    setup_service
    stub_users(@partner) # Depends on: setup_service
    stub_merchant
    stub_business_partner
    stub_no_lead

    ApplicationController.any_instance.stubs(:current_partner).returns(@partner)
  end

  # SETUP HELPERS

  def stub_misc
    stub_vanity_host
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
  end

  def setup_service
    @service = SessionManagerService.instance
    @service.delete_all
  end

  def stub_merchant
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
  end

  def stub_no_lead
    resp = FactoryBot.build(:lead_listing)
    SwaggerClient::LeadsApi.any_instance.stubs(:get_leads).returns(resp)
  end

  def stub_business_partner
    @application_response = {
      id: "bpap_#{SecureRandom.base58(16)}",
      merchant_id: @merchant_guid,
      state: :pending,
      terms: 'SAAS SERVICES ORDER FORM'
    }
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).returns(nil)
  end

  def stub_lead(lead = (build :lead))
    @lead = lead
    resp = FactoryBot.build(:lead_listing, leads: [@lead])
    SwaggerClient::LeadsApi.any_instance.stubs(:get_leads).returns(resp)
    stub_users(@partner, @lead)
  end

  teardown do
    @service.delete_all
  end

  # TESTS

  test 'api request returns ok when merchant new is signed in' do
    stub_user_state(@merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body
    assert_equal('application/json', response.media_type)
  end

  test 'api request returns correct fields in response body' do
    stub_user_state(@merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body
    body = JSON.parse(response.body, symbolize_names: true)

    user_data_attributes = %i[
      id name email referrer_path selected_profile
      partner merchant lead business_partner_application
      applicant_guid preferred_language product_preference
    ]

    user_data_attributes.each do |attr|
      assert body[:data].key?(attr)
    end
  end

  test 'api request only generates the user data once' do
    stub_user_state(@merchant_new)
    Api::V1::UserSessionsController.any_instance.expects(:generate_user_data).returns({ body: {}, status: :ok }).once

    get api_v1_user_sessions_current_user_data_url, as: :json
  end

  test 'api request returns correct values in response body for user with single newly added profile' do
    stub_lead
    stub_user_state(@merchant_onboarding)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    assert_user_data_integrity(
      JSON.parse(response.body, symbolize_names: true),
      @merchant_onboarding,
      @merchant_onboarding.profiles.find { |hash| hash[:properties][:role] == 'merchant_new' },
      @lead,
      good_merchant,
      nil # Default setup_business_partner
    )
  end

  test 'api request returns correct selected profile values in response body for user with multi profile' do
    stub_user_state(@multi_profile_user)
    @multi_profile_user.selected_profile = @multi_profile_user.profile_info[1][:uid] # merchant_new

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    assert_user_data_integrity(
      JSON.parse(response.body, symbolize_names: true),
      @multi_profile_user,
      @multi_profile_user.profile_info.find { |hash| hash[:properties][:role] == 'merchant_new' && hash[:properties][:applicant].present? }, # merchant_new
      nil, # @multi_profile_user selected merchant_new profile has no lead
      good_merchant,
      nil # Default setup_business_partner
    )
  end

  test 'api request returns correct manipulated profile values in response body for user with multi profile' do
    stub_lead
    stub_user_state(@multi_profile_user)
    @multi_profile_user.selected_profile = @multi_profile_user.profile_info[1][:uid]

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    assert_manipulated_profiles_integrity(
      JSON.parse(response.body, symbolize_names: true),
      @multi_profile_user
    )
  end

  test 'api request returns correct values in response body for user with merchant_new profile and business partner application' do
    stub_lead
    stub_user_state(@multi_profile_user)
    @multi_profile_user.selected_profile = @multi_profile_user.profile_info[2][:uid] # merchant_onboarding
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).returns(@application_response)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    assert_user_data_integrity(
      JSON.parse(response.body, symbolize_names: true),
      @multi_profile_user,
      @multi_profile_user.profile_info[2],
      @lead,
      good_merchant,
      @application_response
    )
  end

  test 'api request returns applicant from user properties' do
    stub_lead
    stub_user_state(@merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    current_user = JSON.parse(response.body, symbolize_names: true)
    applicant_guid = @merchant_new.applicant
    assert_equal(applicant_guid, current_user[:data][:applicant_guid])
  end

  test 'api request returns preferred_language from user properties' do
    stub_lead
    stub_user_state(@merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    current_user = JSON.parse(response.body, symbolize_names: true)
    preferred_language = @merchant_new.preferred_language
    assert_equal(preferred_language, current_user[:data][:preferred_language])
  end

  test 'api request returns product_preference from user properties' do
    stub_lead
    stub_user_state(@merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :ok
    assert response.body

    current_user = JSON.parse(response.body, symbolize_names: true)
    product_preference = @merchant_new.product_preference
    assert_equal(product_preference, current_user[:data][:product_preference])
  end

  test 'lead extracts attributes that start with merchant or applicant(will not overwrite id for ex.)' do
    stub_lead
    stub_user_state(@merchant_onboarding)

    get api_v1_user_sessions_current_user_data_url, as: :json
    current_user = JSON.parse(response.body, symbolize_names: true)
    assert_equal(current_user[:data][:lead][:id], @lead.id)
  end

  test 'lead returns entire lead if created in the last two weeks' do
    lead = build :lead, created_at: 1.weeks.ago
    stub_lead(lead)
    stub_user_state(@merchant_onboarding)

    get api_v1_user_sessions_current_user_data_url, as: :json
    current_user = JSON.parse(response.body, symbolize_names: true)
    assert_equal(current_user[:data][:lead][:id], lead.id)
    assert current_user[:data][:lead][:created_at]
  end

  test 'lead returns only guid if created more than two weeks ago' do
    lead = build :lead, created_at: 3.weeks.ago
    stub_lead(lead)
    stub_user_state(@merchant_onboarding)

    get api_v1_user_sessions_current_user_data_url, as: :json
    current_user = JSON.parse(response.body, symbolize_names: true)
    assert_equal(current_user[:data][:lead][:id], lead.id)
    refute current_user[:data][:lead][:created_at]
  end

  #
  # user_data: load_lead(profile)
  #

  test 'api request returns session if error from lead call is expected(404)' do
    expected_errors = [404]

    expected_errors.each do |http_code|
      stub_lead
      stub_user_state(@merchant_onboarding)
      exc = SwaggerClient::ApiError.new(response_body: { status: http_code, message: '' }.to_json)
      SwaggerClient::LeadsApi.any_instance.stubs(:get_leads).raises(exc)

      get api_v1_user_sessions_current_user_data_url, as: :json
      assert_response :ok
      assert response.body

      assert_user_data_integrity(
        JSON.parse(response.body, symbolize_names: true),
        @merchant_onboarding,
        @merchant_onboarding.profile_info.first,
        nil,
        good_merchant,
        nil # Default setup_business_partner
      )
    end
  end

  test 'api request returns error if error from get_leads is unexpected(400, 401, 422, 500, 503, etc)' do
    unexpected_errors = [400, 401, 422, 500, 503]

    unexpected_errors.each do |http_code|
      stub_lead
      stub_user_state(@merchant_onboarding)
      exc = SwaggerClient::ApiError.new(response_body: { status: http_code, message: '' }.to_json)
      SwaggerClient::LeadsApi.any_instance.stubs(:get_leads).raises(exc)

      get api_v1_user_sessions_current_user_data_url, as: :json
      assert_response http_code
    end
  end

  #
  # user_data: load_merchant
  #

  test 'api request returns session if error from merchant call is expected(404)' do
    expected_errors = [404]

    expected_errors.each do |http_code|
      stub_lead
      stub_user_state(@merchant_onboarding)
      SwaggerClient::LeadsApi.any_instance.expects(:get_leads).never
      exc = SwaggerClient::ApiError.new(response_body: { status: http_code, message: '' }.to_json)
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).raises(exc)

      get api_v1_user_sessions_current_user_data_url, as: :json
      assert_response :ok
      assert response.body

      assert_user_data_integrity(
        JSON.parse(response.body, symbolize_names: true),
        @merchant_onboarding,
        @merchant_onboarding.profile_info.first,
        @lead,
        nil, # no merchant because 404
        nil # no bp_app because no merchant
      )
    end
  end

  test 'api request returns error if error from get_merchant call is unexpected(400, 401, 500, 503, etc)' do
    unexpected_errors = [400, 401, 422, 500, 503]

    unexpected_errors.each do |http_code|
      stub_user_state(@merchant_new)
      exc = SwaggerClient::ApiError.new(response_body: { status: http_code, message: '' }.to_json)
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).raises(exc)
      get api_v1_user_sessions_current_user_data_url, as: :json
      assert_response http_code
    end
  end

  #
  # user_data: load_business_partner_application(merchant)
  #

  test 'api request returns session if error from get_business_partner_contract is expected(404, 422)' do
    expected_errors = [404, 422]

    expected_errors.each do |http_code|
      stub_lead
      stub_user_state(@merchant_onboarding)
      exc = SwaggerClient::ApiError.new(response_body: { status: http_code, message: '' }.to_json)
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).raises(exc)

      get api_v1_user_sessions_current_user_data_url, as: :json
      assert_response :ok
      assert response.body

      assert_user_data_integrity(
        JSON.parse(response.body, symbolize_names: true),
        @merchant_onboarding,
        @merchant_onboarding.profiles.find { |hash| hash[:properties][:role] == 'merchant_new' },
        @lead,
        good_merchant,
        nil # no bp_app because 404
      )
    end
  end

  test 'api request returns error if error from business partner call is unexpected(400, 401, 500, 503, etc)' do
    unexpected_errors = [400, 401, 500, 503]

    unexpected_errors.each do |http_code|
      stub_user_state(@merchant_new)
      exc = SwaggerClient::ApiError.new(response_body: { status: http_code, message: '' }.to_json)
      SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).raises(exc)
      get api_v1_user_sessions_current_user_data_url, as: :json
      assert_response http_code
    end
  end

  #
  # user_data: load_business_partner_application(merchant)
  #
  test '#current_user_data makes a request to IdP to get the update user preferences' do
    stub_user_state(@merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json

    assert_requested :get, scim_api_users_path(@merchant_new.uid)
  end

  test '#current_user_data updates the insights_preference preference (opt in)' do
    merchant_new = build :user, :merchant_new, :insights_not_set, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)
    stub_user_state(merchant_new)
    stub_scim_user(merchant_new)

    merchant_new.insights_preference = true
    stub_request(:get, scim_api_users_path(merchant_new.uid)).to_return(status: 200, body: scim_user(merchant_new).to_json)

    get api_v1_user_sessions_current_user_data_url, as: :json

    current_user = JSON.parse(response.body, symbolize_names: true)[:data]

    assert current_user[:insights_preference]
  end

  test '#current_user_data updates the insights_preference preference (opt out)' do
    merchant_new = build :user, :merchant_new, :insights_not_set, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)
    stub_user_state(merchant_new)
    stub_scim_user(merchant_new)

    merchant_new.insights_preference = false
    stub_request(:get, scim_api_users_path(merchant_new.uid)).to_return(status: 200, body: scim_user(merchant_new).to_json)

    get api_v1_user_sessions_current_user_data_url, as: :json

    current_user = JSON.parse(response.body, symbolize_names: true)[:data]

    refute current_user[:insights_preference]
  end

  test '#current_user_data updates the insights_preference preference (no change)' do
    merchant_new = build :user, :merchant_new, :insights_not_set, partner: @partner
    partner_guid = merchant_new.profile_info.first[:uid]
    merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(partner_guid)
    stub_user_state(merchant_new)
    stub_scim_user(merchant_new)

    get api_v1_user_sessions_current_user_data_url, as: :json

    current_user = JSON.parse(response.body, symbolize_names: true)[:data]

    assert_nil current_user[:insights_preference]
  end

  test '#current_user_data handles IdP exceptions' do
    stub_user_state(@merchant_new)
    IdPService.any_instance.stubs(:get_user).raises(IdPService::IdPServiceException)

    get api_v1_user_sessions_current_user_data_url, as: :json

    assert_response :internal_server_error
  end

  #
  # Authorization
  #

  test 'api request returns ok when merchant admin is signed in' do
    stub_user_state(@merchant_admin)

    get api_v1_user_sessions_current_user_data_url
    assert_response :ok
  end

  test 'api request returns unauthorized when in delegated access mode' do
    stub_user_state(@delegated_access_user, user_signed_in: false, redirect: true)

    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :unauthorized
  end

  test 'api request returns unauthorized when user is not signed in' do
    get api_v1_user_sessions_current_user_data_url, as: :json
    assert_response :unauthorized
  end

  #
  # #update_insights_preference
  #
  test '#update_insights_preference returns unauthorized if no user is signed in' do
    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json
    assert_response :unauthorized
  end

  test '#update_insights_preference handles IdP errors (get user)' do
    stub_user_state(@merchant_new)
    IdPService.any_instance.stubs(:get_user).raises(IdPService::IdPServiceException)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json

    assert_response :internal_server_error
  end

  test '#update_insights_preference handles IdP errors (update user)' do
    stub_user_state(@merchant_new)
    stub_request(:get, scim_api_users_path(@merchant_new.uid)).to_return(status: 200, body: scim_user(@merchant_new).to_json)
    IdPService.any_instance.stubs(:update_user).raises(IdPService::IdPServiceException)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json

    assert_response :internal_server_error
  end

  test '#update_insights_preference makes a request to get the user' do
    stub_user_state(@merchant_new)
    stub_request(:any, scim_api_users_path(@merchant_new.uid)).to_return(status: 200, body: scim_user(@merchant_new).to_json)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json

    assert_requested :get, scim_api_users_path(@merchant_new.uid)
  end

  test '#update_insights_preference makes a request to update the user' do
    stub_user_state(@merchant_new)
    stub_request(:any, scim_api_users_path(@merchant_new.uid)).to_return(status: 200, body: scim_user(@merchant_new).to_json)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json

    assert_requested :put, scim_api_users_path(@merchant_new.uid)
  end

  test '#update_insights_preference updates the user (opt in)' do
    stub_user_state(@merchant_new)
    stub_request(:any, scim_api_users_path(@merchant_new.uid)).to_return(status: 200, body: scim_user(@merchant_new).to_json)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json

    assert @merchant_new.insights_preference
  end

  test '#update_insights_preference updates the user (opt out)' do
    stub_user_state(@merchant_new)
    stub_request(:any, scim_api_users_path(@merchant_new.uid)).to_return(status: 200, body: scim_user(@merchant_new).to_json)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: false }, as: :json

    refute @merchant_new.insights_preference
  end

  test '#update_insights_preference returns ok on update' do
    stub_user_state(@merchant_new)
    stub_request(:any, scim_api_users_path(@merchant_new.uid)).to_return(status: 200, body: scim_user(@merchant_new).to_json)

    put api_v1_user_sessions_update_insights_preference_path, params: { opt_in: true }, as: :json

    assert_response :ok
  end

  # ASSERTION HELPERS

  # rubocop:disable Metrics/ParameterLists
  def assert_user_data_integrity(symbolized_body, expected_user, expected_selected_profile, expected_lead, expected_merchant, expected_bp_app)
    assert symbolized_body[:data]
    data = symbolized_body[:data]

    assert_equal(expected_user.uid, data[:id])
    assert_equal(expected_user.name, data[:name])
    assert_equal(expected_user.email, data[:email])
    # referrer_path # Ignored

    assert_equal(expected_selected_profile[:properties][:role],
                 data[:selected_profile][:properties][:role])

    assert_equal(expected_user.profile_partner_filter,
                 data[:selected_profile][:properties][:partner])

    assert_equal(expected_merchant.to_json,
                 data[:merchant].to_json)

    assert_equal(expected_lead.to_json,
                 data[:lead].to_json)

    assert_equal(expected_bp_app.to_json,
                 data[:business_partner_application].to_json)
  end
  # rubocop:enable Metrics/ParameterLists

  def assert_manipulated_profiles_integrity(symbolized_body, multi_profile_user)
    assert symbolized_body[:data]
    data = symbolized_body[:data]

    data[:profiles].each do |profile|
      # It doesn't include the current selected profile.
      assert_not_equal(profile[:uid], multi_profile_user.selected_profile)
      # It only contains the following roles.
      assert %w[merchant_admin merchant_new merchant_add partner_admin].include?(profile.dig(:properties, :role))
      # It has the correctly constructed profiles.
      if %w[merchant_admin merchant_new].include?(profile.dig(:properties, :role))
        # Has the correct keys setup configured merchants.
        %i[id business_num name doing_business_as].all? do |k|
          assert profile.dig(:properties, :merchant).key? k
          assert profile.dig(:properties, :merchant)[k].present?
        end
      else
        # Does not have a merchant setup, because it's merchant_add.
        assert profile.dig(:properties, :merchant).blank?
      end
    end
  end
end
