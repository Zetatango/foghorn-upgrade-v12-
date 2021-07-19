# frozen_string_literal: true

class FileTransferService
  class FileTransferServiceException < StandardError; end
  class ReadFileException < FileTransferServiceException; end
  class StoreFileException < FileTransferServiceException; end
  class ServiceException < FileTransferServiceException; end
  class ApiException < FileTransferServiceException; end
  class ParameterException < FileTransferServiceException; end
  class FileKeyCacheExpiredException < FileTransferServiceException; end

  ZETATANGO_SERVICE = :zetatango
  WILE_E_SERVICE = :wile_e
  ROADRUNNER_SERVICE = :roadrunner
  FOGHORN_SERVICE = :foghorn

  FILE_TRANSER_API_PATH = 'api/file_transfer'

  FILE_TRANSFER_LOCAL_DIRECTORY = 'file_transfer_service'

  KEY_IDS = {
    ZETATANGO_SERVICE => {
      url: Rails.configuration.zetatango_url,
      key_id: ZETATANGO_SERVICE_ALIAS
    },
    WILE_E_SERVICE => {
      url: Rails.configuration.wilee_url,
      key_id: WILE_E_SERVICE_ALIAS
    },
    ROADRUNNER_SERVICE => {
      url: Rails.configuration.roadrunner_url,
      key_id: ROADRUNNER_SERVICE_ALIAS
    },
    FOGHORN_SERVICE => {
      url: Rails.configuration.foghorn_url,
      key_id: FOGHORN_SERVICE_ALIAS
    }
  }.freeze

  def store_file(file_or_contents, service, options = {})
    store_input = store_file_helper(file_or_contents)

    return store_file_in_s3(store_input, service, options) if Rails.configuration.use_cloud_storage

    store_file_locally(store_input)
  end

  def store_unencrypted_file(file_or_contents, options = {})
    store_input = store_file_helper(file_or_contents)

    return store_unencrypted_file_in_s3(store_input, options) if Rails.configuration.use_cloud_storage

    store_file_locally(store_input)
  end

  def send_files(service, file_owner_guid, user_access_token, source_guid, files)
    raise FileKeyCacheExpiredException if files.nil? || files.empty?

    files.each do |file|
      raise ParameterException unless file[:report_type].present? && file[:lookup_key].present?
    end

    parameters = {
      source_guid: source_guid,
      file_owner: file_owner_guid,
      files: files,
      encryption_type: Rails.application.secrets.file_encryption_type
    }

    send_request(:post, file_transfer_api_url(service), user_access_token, parameters)
  end

  def read_file(lookup_key)
    raise ReadFileException if lookup_key.nil?

    return read_file_from_s3(lookup_key) if Rails.configuration.use_cloud_storage

    read_file_locally(lookup_key)
  rescue PorkyLib::FileService::FileServiceError, PorkyLib::FileService::FileSizeTooLargeError => e
    Rails.logger.error("Could not read file from transfer: #{e.message}")

    raise ReadFileException, e.message
  end

  def destination_service(destination)
    return FileTransferService::WILE_E_SERVICE if destination == 'kyc'
    return FileTransferService::ZETATANGO_SERVICE if destination == 'zetatango'
    return FileTransferService::ROADRUNNER_SERVICE if destination == 'idp'
    return FileTransferService::FOGHORN_SERVICE if destination == 'wlmp'

    raise(ParameterException, 'Unknown destination service')
  end

  private

  def store_file_helper(file_or_contents)
    raise ReadFileException if file_or_contents.nil?

    file_or_contents.is_a?(String) ? package_content(file_or_contents).path : file_or_contents.path
  end

  def read_file_from_s3(lookup_key)
    file_contents = PorkyLib::FileService.instance.read(s3_bucket, lookup_key).first

    tempfile = Tempfile.new
    tempfile.write(file_contents)
    tempfile.rewind
    tempfile
  end

  def read_file_locally(lookup_key)
    File.open(lookup_key, 'r')
  end

  def file_transfer_api_url(service)
    "#{service_url(service)}#{FILE_TRANSER_API_PATH}"
  end

  def send_request(method, url, user_access_token, payload)
    RestClient::Request.execute(
      method: method,
      url: url,
      payload: payload,
      headers: { authorization: "Bearer #{user_access_token}" }
    )
  rescue Errno::ECONNREFUSED, Errno::ECONNRESET, RestClient::Exception => e
    Rails.logger.error("Error transferring file (#{method}, #{url}): #{e.message}")
    raise ApiException, e.message
  end

  def store_file_locally(file_path)
    key = temp_file_path
    FileUtils.cp(file_path, key)

    key
  end

  def store_file_in_s3(file, service, options)
    key_id = encryption_key_id(service)

    file_service.write_file(file, s3_bucket, key_id, options)
  rescue PorkyLib::FileService::FileServiceError, PorkyLib::FileService::FileSizeTooLargeError => e
    Rails.logger.error("Could not store file for transfer: #{e.message}")

    raise StoreFileException, e.message
  end

  def store_unencrypted_file_in_s3(file, options)
    unencrypted_file_service.write(file, s3_bucket, options)
  rescue PorkyLib::Unencrypted::FileService::FileServiceError,
         PorkyLib::Unencrypted::FileService::FileSizeTooLargeError => e
    Rails.logger.error("Could not store file for transfer: #{e.message}")

    raise StoreFileException, e.message
  end

  def package_content(content)
    file_key = temp_file_path
    file = File.new(file_key, 'wb')
    file.write content
    file.close
    file
  end

  def encryption_key_id(service)
    raise ServiceException unless KEY_IDS.key?(service)

    KEY_IDS[service][:key_id]
  end

  def service_url(service)
    raise ServiceException unless KEY_IDS.key?(service)

    KEY_IDS[service][:url]
  end

  def file_service
    @file_service ||= PorkyLib::FileService.instance
  end

  def unencrypted_file_service
    @unencrypted_file_service ||= PorkyLib::Unencrypted::FileService.instance
  end

  def s3_bucket
    @s3_bucket ||= Rails.configuration.aws_s3_bucket_file_transfer
  end

  # :nocov:
  def temp_file_path
    return "#{Dir.tmpdir}#{File::SEPARATOR}#{SecureRandom.uuid}" unless Rails.env.e2e?

    ensure_tmp_directory_exists

    Pathname.new(File.join('/', 'tmp', FILE_TRANSFER_LOCAL_DIRECTORY, SecureRandom.uuid))
  end

  def ensure_tmp_directory_exists
    path = Pathname.new(File.join('/', 'tmp', FILE_TRANSFER_LOCAL_DIRECTORY))

    FileUtils.mkdir_p(path) unless File.directory?(path)
  end
  # :nocov:
end
