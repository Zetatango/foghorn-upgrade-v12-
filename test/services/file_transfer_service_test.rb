# frozen_string_literal: true

require 'test_helper'

class FileTransferServiceTest < ActiveSupport::TestCase
  setup do
    stub_default_roadrunner_responses

    @service = FileTransferService.new

    @file_transfer_bucket = Rails.configuration.aws_s3_bucket_file_transfer

    @storage_configuration = Rails.configuration.use_cloud_storage
    Rails.configuration.use_cloud_storage = true

    @lookup_key = SecureRandom.uuid
    @file_owner_guid = "m_#{SecureRandom.base58(16)}"
    @user_access_token = stub_oauth_token_request
    @report_type = 'cra_tax_assessment'

    @source_guid = "app_#{SecureRandom.base58(16)}"

    @file_contents = 'My file contents!'

    @file = Tempfile.new
    @file.puts(@file_contents)
    @file.rewind
  end

  teardown do
    Rails.configuration.use_cloud_storage = @storage_configuration
  end

  #
  # #store_file
  #
  test 'when given a file it sends the file path to PorkyLib' do
    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, {})
    @service.store_file(@file, FileTransferService::WILE_E_SERVICE)
  end

  test 'when given a string it package contents into tempfile and then sends the file path to PorkyLib' do
    @service.stubs(:package_content).returns(@file)
    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, {})
    @service.store_file(@file_contents, FileTransferService::WILE_E_SERVICE)
  end

  test 'package contents handles contents containing a null byte when creating the tempfile' do
    PorkyLib::FileService.instance.expects(:write_file).with(anything, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, {})
    null_byte_contents = "\xA0\0"
    @service.store_file(null_byte_contents, FileTransferService::WILE_E_SERVICE)
  end

  test 'package contents handles content encoded as ASCII_8BIT (BINARY) when creating the tempfile' do
    PorkyLib::FileService.instance.expects(:write_file).with(anything, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, {})
    # ASCII_8BIT String with character, \xC3, has undefined conversion from ACSII-8BIT to UTF-8
    my_file_contents = "\xC3Hello"
    @service.store_file(my_file_contents, FileTransferService::WILE_E_SERVICE)
  end

  test "it encrypts using KYC's CMK" do
    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, {})
    @service.store_file(@file, FileTransferService::WILE_E_SERVICE)
  end

  test "it encrypts using IdP's CMK" do
    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, ROADRUNNER_SERVICE_ALIAS, {})
    @service.store_file(@file, FileTransferService::ROADRUNNER_SERVICE)
  end

  test "it encrypts using WLMP's CMK" do
    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, FOGHORN_SERVICE_ALIAS, {})
    @service.store_file(@file, FileTransferService::FOGHORN_SERVICE)
  end

  test 'it stores metadata' do
    options = {
      metadata: {
        mimetype: 'application/json',
        upload_ts: Time.now.utc.iso8601.to_s
      }
    }

    PorkyLib::FileService.instance.expects(:write_file).with(@file.path, @file_transfer_bucket, WILE_E_SERVICE_ALIAS, options)
    @service.store_file(@file, FileTransferService::WILE_E_SERVICE, options)
  end

  test 'it raises a ServiceException if the service is non-existent' do
    assert_raises FileTransferService::ServiceException do
      @service.store_file(@file, :does_not_exist)
    end
  end

  test 'it raises a ReadFileException if the file is nil' do
    assert_raises FileTransferService::ReadFileException do
      @service.store_file(nil, FileTransferService::WILE_E_SERVICE)
    end
  end

  test 'it raises a ReadFileException if the file is nil (local storage)' do
    Rails.configuration.use_cloud_storage = false

    assert_raises FileTransferService::ReadFileException do
      @service.store_file(nil, FileTransferService::WILE_E_SERVICE)
    end
  end

  test 'it raises a StoreFileException if the file cannot be stored in S3' do
    PorkyLib::FileService.instance.stubs(:write_file).raises(PorkyLib::FileService::FileServiceError)

    assert_raises FileTransferService::StoreFileException do
      @service.store_file(@file, FileTransferService::WILE_E_SERVICE)
    end
  end

  test 'it raises a StoreFileException if the file is too large' do
    PorkyLib::FileService.instance.stubs(:write_file).raises(PorkyLib::FileService::FileSizeTooLargeError)

    assert_raises FileTransferService::StoreFileException do
      @service.store_file(@file, FileTransferService::WILE_E_SERVICE)
    end
  end

  test 'it returns the S3 lookup key on successful write' do
    PorkyLib::FileService.instance.stubs(:write_file).returns(@lookup_key)

    assert_equal @lookup_key, @service.store_file(@file, FileTransferService::WILE_E_SERVICE)
  end

  test 'when given a file it stores the file contents locally when cloud storage is disabled' do
    Rails.configuration.use_cloud_storage = false

    filename = @service.store_file(@file, FileTransferService::WILE_E_SERVICE)

    assert FileTest.file?(filename)
    assert_equal @file_contents, File.read(filename).strip

    File.delete(filename)
  end

  test 'when given a string it stores the string directly when cloud storage is disabled' do
    Rails.configuration.use_cloud_storage = false

    filename = @service.store_file(@file_contents, FileTransferService::WILE_E_SERVICE)

    assert FileTest.file?(filename)
    assert_equal @file_contents, File.read(filename).strip

    File.delete(filename)
  end

  #
  # #store_unencrypted_file
  #
  test '#store_unencrypted_file when given a file it sends the file path to PorkyLib' do
    PorkyLib::Unencrypted::FileService.instance.expects(:write).with(@file.path, @file_transfer_bucket, {})
    @service.store_unencrypted_file(@file)
  end

  test '#store_unencrypted_file when given a string it package contents into tempfile and then sends the file path to PorkyLib' do
    @service.stubs(:package_content).returns(@file)
    PorkyLib::Unencrypted::FileService.instance.expects(:write).with(@file.path, @file_transfer_bucket, {})
    @service.store_unencrypted_file(@file_contents)
  end

  test '#store_unencrypted_file package contents handles contents containing a null byte when creating the tempfile' do
    PorkyLib::Unencrypted::FileService.instance.expects(:write).with(anything, @file_transfer_bucket, {})
    null_byte_contents = "\xA0\0"
    @service.store_unencrypted_file(null_byte_contents)
  end

  test '#store_unencrypted_file package contents handles content encoded as ASCII_8BIT (BINARY) when creating the tempfile' do
    PorkyLib::Unencrypted::FileService.instance.expects(:write).with(anything, @file_transfer_bucket, {})
    # ASCII_8BIT String with character, \xC3, has undefined conversion from ACSII-8BIT to UTF-8
    my_file_contents = "\xC3Hello"
    @service.store_unencrypted_file(my_file_contents)
  end

  test '#store_unencrypted_file it stores metadata' do
    options = {
      metadata: {
        mimetype: 'application/json',
        upload_ts: Time.now.utc.iso8601.to_s
      }
    }

    PorkyLib::Unencrypted::FileService.instance.expects(:write).with(@file.path, @file_transfer_bucket, options)
    @service.store_unencrypted_file(@file, options)
  end

  test '#store_unencrypted_file it raises a ReadFileException if the file is nil' do
    assert_raises FileTransferService::ReadFileException do
      @service.store_unencrypted_file(nil)
    end
  end

  test '#store_unencrypted_file it raises a ReadFileException if the file is nil (local storage)' do
    Rails.configuration.use_cloud_storage = false

    assert_raises FileTransferService::ReadFileException do
      @service.store_unencrypted_file(nil)
    end
  end

  test '#store_unencrypted_file it raises a StoreFileException if the file cannot be stored in S3' do
    PorkyLib::Unencrypted::FileService.instance.stubs(:write).raises(PorkyLib::Unencrypted::FileService::FileServiceError)

    assert_raises FileTransferService::StoreFileException do
      @service.store_unencrypted_file(@file)
    end
  end

  test '#store_unencrypted_file it raises a StoreFileException if the file is too large' do
    PorkyLib::Unencrypted::FileService.instance.stubs(:write).raises(PorkyLib::Unencrypted::FileService::FileSizeTooLargeError)

    assert_raises FileTransferService::StoreFileException do
      @service.store_unencrypted_file(@file)
    end
  end

  test '#store_unencrypted_file it returns the S3 lookup key on successful write' do
    PorkyLib::Unencrypted::FileService.instance.stubs(:write).returns(@lookup_key)

    assert_equal @lookup_key, @service.store_unencrypted_file(@file)
  end

  test '#store_unencrypted_file when given a file it stores the file contents locally when cloud storage is disabled' do
    Rails.configuration.use_cloud_storage = false

    filename = @service.store_unencrypted_file(@file)

    assert FileTest.file?(filename)
    assert_equal @file_contents, File.read(filename).strip

    File.delete(filename)
  end

  test '#store_unencrypted_file when given a string it stores the string directly when cloud storage is disabled' do
    Rails.configuration.use_cloud_storage = false

    filename = @service.store_unencrypted_file(@file_contents)

    assert FileTest.file?(filename)
    assert_equal @file_contents, File.read(filename).strip

    File.delete(filename)
  end

  #
  # #send_files
  #
  test 'it tries to send the file to the KYC service' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 201)

    @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                          {
                            lookup_key: @lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.wilee_url))
  end

  test 'it tries to send the file to the IdP service' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.roadrunner_url))
      .to_return(status: 201)

    @service.send_files(FileTransferService::ROADRUNNER_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                          {
                            lookup_key: @lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.roadrunner_url))
  end

  test 'it tries to send the file to the Foghorn service' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.foghorn_url))
      .to_return(status: 201)

    @service.send_files(FileTransferService::FOGHORN_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                          {
                            lookup_key: @lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.foghorn_url))
  end

  test 'it tries to send the file to the Zetatango service' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
      .to_return(status: 201)

    @service.send_files(FileTransferService::ZETATANGO_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                          {
                            lookup_key: @lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
  end

  test 'it sends the correct parameters' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 201)

    @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                          {
                            lookup_key: @lookup_key,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.wilee_url)) do |request|
      parameters = Rack::Utils.parse_nested_query(request.body)

      parameters['file_owner'] == @file_owner_guid && parameters['source_guid'] == @source_guid &&
        parameters['files'].count == 1 && parameters['files'].first['lookup_key'] == @lookup_key &&
        parameters['files'].first['report_type'] == @report_type && parameters['encryption_type'] == Rails.application.secrets.file_encryption_type
    end
  end

  test 'it sends multiple files when specified' do
    lookup_keys = [SecureRandom.uuid, SecureRandom.uuid]

    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 201)

    @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                          {
                            lookup_key: lookup_keys.first,
                            report_type: @report_type
                          },
                          {
                            lookup_key: lookup_keys.second,
                            report_type: @report_type
                          }
                        ])

    assert_requested(:post, file_transfer_api_url(Rails.configuration.wilee_url)) do |request|
      parameters = Rack::Utils.parse_nested_query(request.body)

      parameters['file_owner'] == @file_owner_guid && parameters['source_guid'] == @source_guid &&
        parameters['files'].count == 2 && parameters['files'].first['lookup_key'] == lookup_keys.first &&
        parameters['files'].first['report_type'] == @report_type && parameters['files'].second['lookup_key'] == lookup_keys.second &&
        parameters['files'].second['report_type'] == @report_type && parameters['encryption_type'] == Rails.application.secrets.file_encryption_type
    end
  end

  test 'it raises a ParameterException when no file is missing report_type' do
    assert_raises FileTransferService::ParameterException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: SecureRandom.uuid
                            },
                            {
                              lookup_key: SecureRandom.uuid,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises a ParameterException when no file is missing lookup_key' do
    assert_raises FileTransferService::ParameterException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: SecureRandom.uuid,
                              report_type: @report_type
                            },
                            {
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises a FileKeyCacheExpiredException when no files are specified' do
    assert_raises FileTransferService::FileKeyCacheExpiredException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [])
    end
  end

  test 'it raises a FileKeyCacheExpiredException when files are nil' do
    assert_raises FileTransferService::FileKeyCacheExpiredException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, nil)
    end
  end

  test 'it raises a ServiceException when the specified service does not exist' do
    assert_raises FileTransferService::ServiceException do
      @service.send_files(:does_not_exist, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on connection timeout error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_raise(Errno::ETIMEDOUT)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on connection reset error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_raise(Errno::ECONNRESET)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on connection refused error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_raise(Errno::ECONNREFUSED)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on bad request error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 400)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on unauthorized error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 401)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on forbidden error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 403)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  test 'it raises an ApiException on unprocessable error' do
    stub_request(:post, file_transfer_api_url(Rails.configuration.wilee_url))
      .to_return(status: 422)

    assert_raises FileTransferService::ApiException do
      @service.send_files(FileTransferService::WILE_E_SERVICE, @file_owner_guid, @user_access_token, @source_guid, [
                            {
                              lookup_key: @lookup_key,
                              report_type: @report_type
                            }
                          ])
    end
  end

  #
  # #read_file
  #
  test 'it raises a ReadFileException exception if lookup_key is nil' do
    assert_raises FileTransferService::ReadFileException do
      @service.read_file(nil)
    end
  end

  test 'it raises a ReadFileException exception if lookup_key is nil (local storage)' do
    Rails.configuration.use_cloud_storage = false

    assert_raises FileTransferService::ReadFileException do
      @service.read_file(nil)
    end
  end

  test 'it raises a ReadFileException on Porkylib FileSizeTooLargeError error' do
    PorkyLib::FileService.instance.stubs(:read).raises(PorkyLib::FileService::FileSizeTooLargeError)

    assert_raises FileTransferService::ReadFileException do
      @service.read_file(@lookup_key)
    end
  end

  test 'it raises a ReadFileException on Porkylib FileServiceError error' do
    PorkyLib::FileService.instance.stubs(:read).raises(PorkyLib::FileService::FileServiceError)

    assert_raises FileTransferService::ReadFileException do
      @service.read_file(@lookup_key)
    end
  end

  test 'it reads the file from S3' do
    PorkyLib::FileService.instance.stubs(:read).with(@file_transfer_bucket, @lookup_key).returns([@file_contents, false])

    file = @service.read_file(@lookup_key)

    assert_equal @file_contents, file.read.strip

    file.close
  end

  test 'it reads the file locally when cloud storage is disabled' do
    Rails.configuration.use_cloud_storage = false

    file = @service.read_file(@file.path)

    assert_equal @file_contents, file.read.strip

    file.close
  end

  test 'returns ZETATANGO_SERVICE if destination is zetatango' do
    assert_equal(@service.destination_service('zetatango'), FileTransferService::ZETATANGO_SERVICE)
  end

  test 'returns WILE_E_SERVICE if destination is kyc' do
    assert_equal(@service.destination_service('kyc'), FileTransferService::WILE_E_SERVICE)
  end

  test 'returns ROADRUNNER_SERVICE if destination is idp' do
    assert_equal(@service.destination_service('idp'), FileTransferService::ROADRUNNER_SERVICE)
  end

  test 'returns FOGHORN_SERVICE if destination is wlmp' do
    assert_equal(@service.destination_service('wlmp'), FileTransferService::FOGHORN_SERVICE)
  end

  test 'raises ParameterException if destination is unknown' do
    assert_raises FileTransferService::ParameterException do
      @service.destination_service('unknown')
    end
  end
end
