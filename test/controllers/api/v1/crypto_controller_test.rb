# frozen_string_literal: true

require 'test_helper'

class Api::V1::CryptoControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
    sign_in_user @merchant_admin
    @params = { filename: 'anything' }
  end

  #
  # describe #POST /encryption_bundle
  #
  test 'succeeds' do
    PorkyLib::FileService.instance.stubs(:presigned_post_url)
    post api_v1_encryption_bundle_path params: @params
    assert_response :ok
  end

  test 'returns a 422 error when no filename is provided ' do
    PorkyLib::FileService.instance.stubs(:presigned_post_url)
    post api_v1_encryption_bundle_path
    assert_response :unprocessable_entity
  end

  test 'raises a EncryptionBundleException on Porkylib FileServiceError error' do
    PorkyLib::FileService.instance.stubs(:presigned_post_url).raises(PorkyLib::FileService::FileServiceError)

    assert_raises Api::V1::CryptoController::EncryptionBundleException do
      post api_v1_encryption_bundle_path params: @params
    end
  end

  test 'escapes non US-ASCII characters in the S3 metadata' do
    params = { filename: 'RELEVÉ DE COMPTE.txt' }
    PorkyLib::FileService.instance.expects(:presigned_post_url).with(:params) do |_bucket, options|
      assert_equal options.dig(:metadata, :original_filename), CGI.escape(params[:filename])
    end

    post api_v1_encryption_bundle_path params: params
  end
end
