# frozen_string_literal: true

require 'test_helper'
require 'minitest/mock'

class Cloud::FileStorageServiceTest < ActiveSupport::TestCase
  setup do
    @service = Cloud::FileStorageService.new(bucket: 'some-bucket')
    stub_s3_download_file
  end

  # describe `save_file`
  test 'Save local file' do
    assert_nothing_raised { @service.save_file(Tempfile.new) }
  end

  test 'Save uploaded file to cloud' do
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)
      assert_nothing_raised { @service.save_file(Tempfile.new) }
    end
  end

  test 'Save uploaded file to cloud with metadata' do
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)
      metadata = { file_export_report_id: '232' }
      assert_nothing_raised { @service.save_file(Tempfile.new, metadata: metadata) }
    end
  end

  test 'Save file can specify directory to store file' do
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)
      assert_nothing_raised do
        directory = 'some_directory/some_sub_directory'
        key = @service.save_file(Tempfile.new, directory: directory)
        assert key.include?(directory)
      end
    end
  end

  # describe `read_file`
  test 'Read local file' do
    PorkyLib::FileService.any_instance.stubs(:read).returns(Tempfile.new)
    assert_nothing_raised { @service.read_file(Tempfile.new.path) }
  end

  test 'Download file from cloud' do
    stub_cloud_storage do
      PorkyLib::FileService.any_instance.stubs(:read).returns([Tempfile.new, false])
      assert_nothing_raised { @service.read_file('key') }
    end
  end

  test 'Download file from cloud and re-enrypt if required' do
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)
      mock = MiniTest::Mock.new
      mock.expect(:overwrite_file, true)
      PorkyLib::FileService.any_instance.stubs(:read).returns(['file contents...', true])
      @service.read_file('key') do
        mock.verify
      end
    end
  end

  # describe Service Errors
  test 'when no bucket specified' do
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)

      # save file
      save_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(nil).save_file(Tempfile.new)
      end
      assert_equal save_error.message, 'Cloud::FileStorageService::FileStorageServiceError::BucketRequiredError'
      # read file
      read_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(nil).read_file('key')
      end
      assert_equal read_error.message, 'Cloud::FileStorageService::FileStorageServiceError::BucketRequiredError'
      # overwrite file
      mock = MiniTest::Mock.new
      mock.expect(:overwrite_file, true)
      PorkyLib::FileService.any_instance.stubs(:read).returns([Tempfile.new, false])
      overwrite_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(nil).read_file('key')
      end
      assert_equal overwrite_error.message, 'Cloud::FileStorageService::FileStorageServiceError::BucketRequiredError'
    end
  end

  test 'when no able to write' do
    stub_cloud_storage do
      PorkyLib::FileService.any_instance.stubs(:write_file).raises(PorkyLib::FileService::FileServiceError)
      write_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        @service.save_file(Tempfile.new)
      end
      assert_equal write_error.message, 'PorkyLib::FileService::FileServiceError'
    end
  end

  test 'when no able to read' do
    stub_cloud_storage do
      PorkyLib::FileService.any_instance.stubs(:read).raises(PorkyLib::FileService::FileServiceError)
      read_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        @service.read_file('key')
      end
      assert_equal read_error.message, 'PorkyLib::FileService::FileServiceError'
    end
  end

  # describe ProkyLib Errors
  test 'when file size is too large' do
    PorkyLib::Config.configure(max_file_size: 10)
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)

      tempfile = Tempfile.new
      tempfile << 'some data to put into this file'
      tempfile.close

      # save file
      save_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(bucket: 'some-bucket').save_file(tempfile)
      end
      assert_equal save_error.message, 'Data size is larger than maximum allowed size of 10.0B'

      # read file
      read_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(bucket: 'some-bucket').read_file('key')
      end
      assert_equal read_error.message, 'File size is larger than maximum allowed size of 10.0B'
    end
    PorkyLib::Config.configure(max_file_size: 10 * 1024 * 1024)
  end

  # describe AWS Errors
  test 'when AWS returns an error' do
    stub_cloud_storage do
      Aws::S3::Object.any_instance.stubs(:upload_file).returns(true)

      # save file
      PorkyLib::FileService.any_instance.stubs(:write_file).raises(PorkyLib::FileService::FileServiceError)
      save_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(bucket: 'some-bucket').save_file(Tempfile.new)
      end
      assert_equal save_error.message, 'PorkyLib::FileService::FileServiceError'

      # read file
      PorkyLib::FileService.any_instance.stubs(:read).raises(PorkyLib::FileService::FileServiceError)
      read_error = assert_raise Cloud::FileStorageService::FileStorageServiceError do
        Cloud::FileStorageService.new(bucket: 'some-bucket').read_file('key')
      end
      assert_equal read_error.message, 'PorkyLib::FileService::FileServiceError'
    end
  end

  def stub_s3_download_file
    ciphertext_data = {
      key: 'KrUyzr7rL4lYjuFqmeqzDGqG7Kktz6SeBCqiVbLXtWsgxMB5a3JvcC9zYWlsYauT',
      data: 'Heqj1FnHmZqnKpws-_GgX1t_FgdCZA==',
      nonce: 'XL09bELoWZ_7rzev9gSkFhBYsFdGETdL'
    }.to_json

    Aws.config[:s3] = {
      stub_responses: {
        get_object: {
          body: ciphertext_data
        },
        head_object: {
          content_length: ciphertext_data.bytesize
        }
      }
    }
  end
end
