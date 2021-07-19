# frozen_string_literal: true

require 'test_helper'

class Api::V1::FileStorageControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)
    @tempfile = Tempfile.new
    @file_obj = Rack::Test::UploadedFile.new(@tempfile)
    @file_transfer_bucket = Rails.configuration.aws_s3_bucket_file_transfer

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
  end

  #
  # describe #POST /upload_file
  #
  test 'POST /upload_file succeeds' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with destination set to zetatango' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'zetatango' }
      assert_response :ok
    end
  end

  test 'POST /upload_file with non-ascii file name succeeds with destination set to zetatango' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      file_obj = Rack::Test::UploadedFile.new(Tempfile.new("Capture d'écran, le 2019-06-17 à 11.18.07.png"))

      post api_v1_upload_file_url, params: { file: file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'zetatango' }
      assert_response :ok
    end
  end

  test 'POST /upload_file with non-ascii file name succeeds with destination set to zetatango - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      file_obj = Rack::Test::UploadedFile.new(Tempfile.new("Capture d'écran, le 2019-06-17 à 11.18.07.png"))

      post api_v1_upload_file_url, params: { file: file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'zetatango' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with destination set to roadrunner' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'idp' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with destination set to foghorn' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'wlmp' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with PDF file' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with PNG file' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('image/png'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with JPG file' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('image/jpg'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with CSV file' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(nil)
      @file_obj.content_type = 'text/csv'
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with TXT file' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      PorkyLib::FileService.instance.expects(:write_file)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(nil)
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with PDF file - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with PNG file - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('image/png'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with JPG file - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('image/jpg'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with CSV file - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(nil)
      @file_obj.content_type = 'text/csv'
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file succeeds with TXT file - unencrypted' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.expects(:write)
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(nil)
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_response :ok
    end
  end

  test 'POST /upload_file fails if destination service is unknown' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      sign_in_user @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'unknown' }
      assert_response :unprocessable_entity
    end
  end

  test 'POST /upload_file fails for unsupported mimetype' do
    sign_in_user @merchant_admin

    MimeMagic.stubs(:by_magic).returns(MimeMagic.new('image/gif'))
    post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: 'notice_of_assessment', destination: 'kyc' }
    assert_response :unsupported_media_type
  end

  test 'POST /upload_file fails for file size too large' do
    sign_in_user @merchant_admin

    MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
    max_file_size = Rails.application.secrets.max_file_size
    Rails.application.secrets.max_file_size = -1
    post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: 'notice_of_assessment', destination: 'kyc' }
    assert_response :payload_too_large

    Rails.application.secrets.max_file_size = max_file_size
  end

  test 'POST /upload_file stores file_key in cache' do
    stub_cloud_storage do
      doc_type = 'ppsa'
      PorkyLib::FileService.instance.expects(:write_file).returns('some_s3_key')
      sign_in_user @merchant_admin
      @load_user = @merchant_admin

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

      assert_includes collected_docs, 'ppsa'
      refute_empty collected_docs['ppsa']
      assert(collected_docs['ppsa'].any? { |pair| pair.key?('some_ngx_id') })
      assert(collected_docs['ppsa'].any? { |pair| pair.value?('some_s3_key') })
    end
  end

  test 'POST /upload_file fails if file is empty' do
    sign_in_user @merchant_admin

    post api_v1_upload_file_url, params: { file: nil, file_id: 'some_ngx_id', document_type: 'notice_of_assessment', destination: 'kyc' }
    assert_response :not_found
  end

  test 'POST /upload_file fails if missing required parameters' do
    sign_in_user @merchant_admin

    post api_v1_upload_file_url
    assert_response :not_found
  end

  test 'POST /upload_file fails if file_encryption_type is not none or backend' do
    sign_in_user @merchant_admin

    Rails.application.secrets.stubs(:file_encryption_type).returns('invalid')

    post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: 'notice_of_assessment', destination: 'kyc' }
    assert_response :unprocessable_entity
  end

  test 'POST /upload_file handles when file storage service fails' do
    stub_cloud_storage do
      sign_in_user @merchant_admin
      PorkyLib::FileService.instance.stubs(:write_file).raises(PorkyLib::FileService::FileServiceError)

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: 'notice_of_assessment', destination: 'kyc' }
      assert_response :unprocessable_entity
    end
  end

  test 'POST /upload_file handles when file storage service fails - unencrypted' do
    stub_cloud_storage do
      sign_in_user @merchant_admin

      Rails.application.secrets.stubs(:file_encryption_type).returns('none')
      PorkyLib::Unencrypted::FileService.instance.stubs(:write).raises(PorkyLib::Unencrypted::FileService::FileServiceError)

      MimeMagic.stubs(:by_magic).returns(MimeMagic.new('application/pdf'))
      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: 'notice_of_assessment', destination: 'kyc' }
      assert_response :unprocessable_entity
    end
  end

  test 'POST /upload_file without sign in should redirect to root' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'

      post api_v1_upload_file_url, params: { file: @file_obj, file_id: 'some_ngx_id', document_type: doc_type, destination: 'kyc' }
      assert_redirected_to root_path
    end
  end

  #
  # describe #POST /cache_file
  #
  test 'POST /cache_file succeeds' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'
      sign_in_user @merchant_admin

      # TODO: for each valid destination do
      payload = { file_id: 'some_ngx_id', s3_key: 'some_s3_key', document_type: doc_type, destination: 'kyc' }
      post api_v1_cache_file_url, params: payload
      assert_response :ok
    end
  end

  test 'POST /cache_file stores file_key in cache' do
    stub_cloud_storage do
      doc_type = 'ppsa'
      sign_in_user @merchant_admin
      @load_user = @merchant_admin

      payload = { file_id: 'some_ngx_id', s3_key: 'some_s3_key', document_type: doc_type, destination: 'kyc' }
      post api_v1_cache_file_url, params: payload
      collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

      assert_includes collected_docs, 'ppsa'
      refute_empty collected_docs['ppsa']
      assert(collected_docs['ppsa'].any? { |pair| pair.key?('some_ngx_id') })
      assert(collected_docs['ppsa'].any? { |pair| pair.value?('some_s3_key') })
    end
  end

  test 'POST /cache_file fails if missing required parameters' do
    sign_in_user @merchant_admin

    post api_v1_cache_file_url
    assert_response :not_found
  end

  #
  # describe #POST /remove_file
  #
  test 'POST /remove_file succeeds when removes file_key from cache' do
    stub_cloud_storage do
      doc_type = 'ppsa'
      docs_cache = { ppsa: [{ some_ngx_id: 'some_s3_key' }] }
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)

      post api_v1_remove_file_url, params: { file_id: 'some_ngx_id', document_type: doc_type }
      assert_response :ok
      collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

      assert_includes collected_docs, 'ppsa'
      assert_empty collected_docs['ppsa']
    end
  end

  test 'POST /remove_file fails if file_key is not present' do
    stub_cloud_storage do
      doc_type = 'ppsa'
      sign_in_user @merchant_admin

      post api_v1_remove_file_url, params: { file_id: 'some_ngx_id', document_type: doc_type }
      assert_response :not_found
    end
  end

  test 'POST /remove_file without sign in should redirect to root' do
    stub_cloud_storage do
      doc_type = 'notice_of_assessment'

      post api_v1_remove_file_url, params: { file_id: 'some_ngx_id', document_type: doc_type }
      assert_redirected_to root_path
    end
  end

  #
  # describe #POST /submit_documents
  #
  test 'POST /submit_documents succeeds' do
    stub_cloud_storage do
      docs_cache = {}
      docs_cache['cra_tax_assessment'] = [{ ngx_id_3: 's3_key_3' }]
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_response :ok
    end
  end

  test 'generate_files_payload should create an array of files with s3 key, report type and destination' do
    stub_cloud_storage do
      docs_cache = {}
      docs_cache['ppsa'] = [{ ngx_id_1: 's3_key_1' }, { ngx_id_2: 's3_key_2' }]
      docs_cache['cra_tax_assessment'] = [{ ngx_id_3: 's3_key_3' }]
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      merchant_guid = @merchant_admin.profiles.first[:properties][:merchant]
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)

      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'kyc' }
      files_payload = "source_guid=some_guid&file_owner=#{merchant_guid}&files[][lookup_key]=s3_key_1&"\
        'files[][report_type]=ppsa&files[][destination]=kyc&files[][lookup_key]=s3_key_2&'\
        'files[][report_type]=ppsa&files[][destination]=kyc&files[][lookup_key]=s3_key_3&'\
        "files[][report_type]=cra_tax_assessment&files[][destination]=kyc&encryption_type=#{Rails.application.secrets.file_encryption_type}"
      assert_requested(:post, file_transfer_api_url(Rails.configuration.zetatango_url), body: files_payload)
    end
  end

  test 'POST /submit_documents cleans collected_docs cache' do
    stub_cloud_storage do
      docs_cache = {}
      docs_cache['cra_tax_assessment'] = [{ ngx_id_3: 's3_key_3' }]
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_equal read_file_keys, {}
    end
  end

  test 'POST /submit_documents returns 422 when FileTransferService fails and keeps cache intact' do
    stub_cloud_storage do
      docs_cache = {}
      docs_cache['cra_tax_assessment'] = [{ ngx_id_3: 's3_key_3' }]
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)
      # Any error response (4xx, 5xx) are raised by file transfer service
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 500)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_response :unprocessable_entity
      collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

      assert_includes collected_docs, 'cra_tax_assessment'
      assert_not_empty collected_docs['cra_tax_assessment']
    end
  end

  test 'POST /submit_documents returns 410 when there are no files in cache' do
    stub_cloud_storage do
      sign_in_user @merchant_admin
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_response :gone
    end
  end

  test 'POST /submit_documents returns 404 when no source_guid' do
    stub_cloud_storage do
      sign_in_user @merchant_admin
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url
      assert_response :not_found
    end
  end

  test 'POST /submit_documents returns 422 when a file is missing an s3 key' do
    stub_cloud_storage do
      docs_cache = {}
      docs_cache['cra_tax_assessment'] = [{ ngx_id_1: nil }]
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_response :unprocessable_entity
    end
  end

  test 'POST /submit_documents without merchant_guid should redirect to root' do
    stub_cloud_storage do
      sign_in_user @no_profile_user
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_redirected_to root_path
    end
  end

  test 'POST /submit_documents without sign in should redirect to root' do
    stub_cloud_storage do
      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_redirected_to root_path
    end
  end

  test 'POST /submit_documents uses logged in user access token in request authorization header' do
    stub_cloud_storage do
      docs_cache = {}
      docs_cache['cra_tax_assessment'] = [{ ngx_id_3: 's3_key_3' }]
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      User.any_instance.stubs(:access_token).returns('abc')
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)
      stub_request(:post, file_transfer_api_url(Rails.configuration.zetatango_url))
        .to_return(status: 201)

      post api_v1_submit_documents_url, params: { source_guid: 'some_guid', destination: 'zetatango' }
      assert_requested(:post, file_transfer_api_url(Rails.configuration.zetatango_url), headers: { 'Authorization' => 'Bearer abc' })
    end
  end

  #
  # describe #POST /clean_documents_cache
  #
  test 'POST /clean_documents_cache succeeds and removes all document keys from cache' do
    stub_cloud_storage do
      docs_cache = { ppsa: [{ some_ngx_id: 'some_s3_key' }] }
      sign_in_user @merchant_admin
      @load_user = @merchant_admin
      Rails.cache.write('collected_docs', docs_cache.to_json, namespace: cache_namespace)

      post api_v1_clean_documents_cache_url
      assert_response :ok
      collected_docs = Rails.cache.read('collected_docs', namespace: cache_namespace)

      assert_nil collected_docs
    end
  end

  test 'POST /clean_documents_cache without sign in should redirect to root' do
    stub_cloud_storage do
      post api_v1_clean_documents_cache_url
      assert_redirected_to root_path
    end
  end
end
