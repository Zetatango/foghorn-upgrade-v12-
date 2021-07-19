# frozen_string_literal: true

require 'test_helper'

class Api::V1::LeadsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @lead_guid = "lead_#{SecureRandom.base58(16)}"
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(SecureRandom.base58(32))
  end

  test '#update_selected_insights_bank_accounts should return unauthorized when not logged in' do
    post lead_api_path(@lead_guid, 'selected_insights_bank_accounts'), params: { bank_account_ids: ['ba_123'] }, as: :json
    assert_response :unauthorized
  end

  test '#update_selected_insights_bank_accounts should return ok when logged in and no error from API' do
    SwaggerClient::LeadsApi.any_instance.stubs(:post_selected_insights_accounts).returns(@lead_new)
    sign_in_user @merchant_new
    post lead_api_path(@lead_guid, 'selected_insights_bank_accounts'), params: { bank_account_ids: ['ba_123'] }, as: :json

    assert_response :ok
  end

  test '#update_selected_insights_bank_accounts should return bad_request when missing required param' do
    sign_in_user @merchant_new
    post lead_api_path(@lead_guid, 'selected_insights_bank_accounts'), params: { bank_account_ids: [] }, as: :json

    assert_response :bad_request
  end

  test '#update_selected_insights_bank_accounts should return error raised from ztt_client' do
    mock_lead_error('post_selected_insights_accounts', 404)
    sign_in_user @merchant_new
    post lead_api_path(@lead_guid, 'selected_insights_bank_accounts'), params: { bank_account_ids: ['ba_123'] }, as: :json

    assert_response :not_found
  end

  test '#update_desired_bank_account_balance should return unauthorized when not logged in' do
    put lead_api_path(@lead_guid, 'desired_bank_account_balance'), params: { desired_bank_account_balance: 1000 }, as: :json
    assert_response :unauthorized
  end

  test '#update_desired_bank_account_balance should return ok when logged in and no error from API' do
    SwaggerClient::LeadsApi.any_instance.stubs(:update_desired_bank_account_balance).returns(@lead_new)
    sign_in_user @merchant_new
    put lead_api_path(@lead_guid, 'desired_bank_account_balance'), params: { desired_bank_account_balance: 1000 }, as: :json

    assert_response :ok
  end

  test '#update_desired_bank_account_balance should return bad_request when missing required param' do
    sign_in_user @merchant_new
    put lead_api_path(@lead_guid, 'desired_bank_account_balance'), params: {}, as: :json

    assert_response :bad_request
  end

  test '#update_desired_bank_account_balance should return error raised from ztt_client' do
    mock_lead_error('update_desired_bank_account_balance', 404)
    sign_in_user @merchant_new
    put lead_api_path(@lead_guid, 'desired_bank_account_balance'), params: { desired_bank_account_balance: 1000 }, as: :json

    assert_response :not_found
  end

  # Test Helpers
  def mock_lead_error(method, error_code)
    e = SwaggerClient::ApiError.new(code: error_code)
    SwaggerClient::LeadsApi.any_instance.stubs(method).raises(e)
  end

  def lead_api_path(guid = nil, action = nil)
    base = api_v1_leads_path

    return base unless guid.present?
    return "#{base}/#{guid}" unless guid.present? && action.present?

    "#{base}/#{guid}/#{action}"
  end

  def api_v1_leads_path
    '/api/v1/leads'
  end
end
