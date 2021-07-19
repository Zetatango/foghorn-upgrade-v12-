# frozen_string_literal: true

require 'test_helper'

class PdfsControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)
    stub_user_state
  end

  def api_v1_pdf_path
    "#{Rails.configuration.foghorn_url}/api/v1/pdfs/to_pdf"
  end

  def stub_user_state
    ApplicationController.any_instance.stubs(:current_user).returns(@merchant_new)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(true)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))
  end

  test 'to_pdf accept returns unauthorized when access token missing' do
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post api_v1_pdf_path, params: { content: 'Test' }
    assert_response :unauthorized
  end

  test 'to_pdf accept returns bad request if ZT responds with bad request' do
    e = SwaggerClient::ApiError.new(response_body: { status: 400, message: '' }.to_json)
    SwaggerClient::PdfApi.any_instance.stubs(:generate_pdf).raises(e)

    post api_v1_pdf_path, params: { content: 'Test' }
    assert_response :bad_request
  end

  test 'to_pdf returns internal server error if ZT responds with internal server error' do
    e = SwaggerClient::ApiError.new(response_body: { status: 500, message: '' }.to_json)
    SwaggerClient::PdfApi.any_instance.stubs(:generate_pdf).raises(e)

    post api_v1_pdf_path, params: { content: 'Test' }
    assert_response :internal_server_error
  end

  test 'to_pdf returns success' do
    pdf = Base64.encode64('Test')
    SwaggerClient::PdfApi.any_instance.stubs(:generate_pdf).returns(SwaggerClient::PdfEntity.new)
    SwaggerClient::PdfEntity.any_instance.stubs(:pdf_blob).returns(pdf)

    post api_v1_pdf_path, params: { content: 'Test' }
    assert_equal response.body, 'Test'
    assert_response :success
  end

  test 'to_pdf returns a bad request if the content is not valid' do
    SwaggerClient::PdfApi.any_instance.stubs(:generate_pdf).returns({})

    post api_v1_pdf_path, params: { content: "Partly valid\xE4 UTF-8 encoding: äöüß" }
    assert_response :bad_request
  end

  test 'to_pdf returns a bad request if the content is missing' do
    SwaggerClient::PdfApi.any_instance.stubs(:generate_pdf).returns({})

    post api_v1_pdf_path
    assert_response :bad_request
  end
end
