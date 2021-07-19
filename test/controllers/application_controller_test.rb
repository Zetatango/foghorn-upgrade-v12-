# frozen_string_literal: true

require 'test_helper'

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  setup do
    stub_vanity_host
    stub_users(@partner)
    SwaggerClient::LeadsApi.any_instance.stubs(:get_leads)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_merchant).returns(good_merchant)
    SwaggerClient::MerchantsApi.any_instance.stubs(:get_business_partner_contract).returns(nil)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_offers).returns(valid_offers)
    SwaggerClient::FinancingApi.any_instance.stubs(:get_applications).returns([])
    SwaggerClient::FinancingApi.any_instance.stubs(:get_advances).returns([])

    @service = SessionManagerService.instance
    @service.delete_all

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))
  end

  test 'login should set access token correctly and logs the UID' do
    assert_logs :info, "[UID: #{@merchant_admin.uid}]" do
      sign_in_user @merchant_admin
    end
  end

  test 'api request returns ok when merchant admin is signed in and logs the Partner ID' do
    assert_logs :info, "[Partner ID: #{@merchant_admin.profiles.first[:properties][:partner]}]" do
      sign_in_user @merchant_admin
      get api_v1_user_sessions_current_user_data_url
    end
  end

  test 'returns not_found when ArgumentError raised' do
    sign_in_user @merchant_admin

    ApplicationController.any_instance.stubs(:params).raises(ArgumentError)
    payload = {
      file_id: "\u0000\u0000\u0000windows\u0000\u0000\u0000win.ini",
      s3_key: 'some_s3_key',
      document_type: 'uploaded_photo_identification',
      destination: 'kyc'
    }
    post api_v1_cache_file_url, params: payload, as: :json
    assert_response :not_found
  end

  test 'returns not_found when ActionController::UnknownFormat raised' do
    sign_in_user @merchant_admin

    ApplicationController.any_instance.stubs(:params).raises(ActionController::UnknownFormat)
    payload = {
      file_id: 'file_id',
      s3_key: 'some_s3_key',
      document_type: 'uploaded_photo_identification',
      destination: 'kyc'
    }
    post api_v1_cache_file_url, params: payload, as: :json
    assert_response :not_found
  end
end
