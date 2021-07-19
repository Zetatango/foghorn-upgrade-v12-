# frozen_string_literal: true

require 'test_helper'

class FileTransferIntegrationTest < ActionDispatch::IntegrationTest
  setup do
    stub_default_roadrunner_responses

    @service = FileTransferService.new

    @file = Tempfile.new
    @file_transfer_bucket = Rails.configuration.aws_s3_bucket_file_transfer

    @source_guid = "app_#{SecureRandom.base58(16)}"

    @storage_configuration = Rails.configuration.use_cloud_storage

    @lookup_key = SecureRandom.uuid
    @file_owner_guid = "m_#{SecureRandom.base58(16)}"
    @access_token = SecureRandom.base58(16)
    @report_type = 'cra_tax_assessment'

    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 200)
  end

  teardown do
    Rails.configuration.use_cloud_storage = @storage_configuration
  end

  test 'store and send file saves and sends the file (cloud based storage)' do
    Rails.configuration.use_cloud_storage = true

    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 201)

    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, {}).returns(@lookup_key)

    lookup_key = @service.store_file(@file, FileTransferService::WILE_E_SERVICE)

    @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @access_token, @source_guid, [
                          {
                            lookup_key: lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.wilee_url)) do |request|
      parameters = Rack::Utils.parse_nested_query(request.body)

      parameters['file_owner'] == @file_owner_guid && parameters['source_guid'] == @source_guid &&
        parameters['files'].count == 1 && parameters['files'].first['lookup_key'] == lookup_key &&
        parameters['files'].first['report_type'] == @report_type
    end
  end

  test 'store and send file saves and sends the file (local storage)' do
    Rails.configuration.use_cloud_storage = false

    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 201)

    lookup_key = @service.store_file(@file, FileTransferService::WILE_E_SERVICE)

    @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @access_token, @source_guid, [
                          {
                            lookup_key: lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert FileTest.file?(lookup_key)

    File.delete(lookup_key)

    assert_requested(:post, file_transfer_api_url(Rails.configuration.wilee_url)) do |request|
      parameters = Rack::Utils.parse_nested_query(request.body)

      parameters['file_owner'] == @file_owner_guid && parameters['source_guid'] == @source_guid &&
        parameters['files'].count == 1 && parameters['files'].first['lookup_key'] == lookup_key &&
        parameters['files'].first['report_type'] == @report_type
    end
  end
end
