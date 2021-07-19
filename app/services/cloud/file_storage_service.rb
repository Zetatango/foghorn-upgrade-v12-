# frozen_string_literal: true

class Cloud::FileStorageService
  class FileStorageServiceError < StandardError; end
  class FileStorageServiceError::BucketRequiredError < StandardError; end

  class FileStorageServiceError < StandardError; end

  def initialize(options = {})
    @bucket_name = options[:bucket] if options.present?
  end

  def save_file(file, options = {})
    return store_temp(file) unless Rails.configuration.use_cloud_storage

    upload_file(file.path, options)
  rescue FileStorageServiceError::BucketRequiredError => e
    Rails.logger.error("Cannot store file if no bucket is specified. #{e.message}")
    raise FileStorageServiceError, e
  rescue PorkyLib::FileService::FileServiceError => e
    Rails.logger.error("There was an error writing the file. #{e.message}")
    raise FileStorageServiceError, e
  rescue PorkyLib::FileService::FileSizeTooLargeError => e
    Rails.logger.error("There was an error writing the file. The report was too large. #{e.message}")
    raise FileStorageServiceError, e
  end

  def read_file(file_path)
    return retrieve_temp(file_path) unless Rails.configuration.use_cloud_storage

    file_content, should_reencrypt = download_file(file_path)
    overwrite_file(file_content, file_path) if should_reencrypt
    tempfile = Tempfile.new(encoding: 'ascii-8bit')
    tempfile.write(file_content)
    tempfile.rewind
    tempfile
  rescue FileStorageServiceError::BucketRequiredError => e
    Rails.logger.error("Cannot store file if no bucket is specified. #{e.message}")
    raise FileStorageServiceError, e
  rescue PorkyLib::FileService::FileServiceError => e
    Rails.logger.error("There was an error reading the file. #{e.message}")
    raise FileStorageServiceError, e
  rescue PorkyLib::FileService::FileSizeTooLargeError => e
    Rails.logger.error("There was an error reading the file. The report was too large. #{e.message}")
    raise FileStorageServiceError, e
  end

  private

  def store_temp(file)
    key = SecureRandom.uuid
    tmp_folder = "#{Dir.tmpdir}#{File::SEPARATOR}"
    FileUtils.mkdir_p(tmp_folder)
    key = "#{tmp_folder}#{File::SEPARATOR}#{key}"
    FileUtils.cp(file.path, key)
    key
  end

  def retrieve_temp(file_path)
    File.open(file_path, 'r')
  end

  def upload_file(file, options)
    raise FileStorageServiceError::BucketRequiredError if @bucket_name.blank?

    PorkyLib::FileService.instance.write_file(file, @bucket_name, FOGHORN_SERVICE_ALIAS, options)
  end

  def download_file(file_key)
    raise FileStorageServiceError::BucketRequiredError if @bucket_name.blank?

    PorkyLib::FileService.instance.read(@bucket_name, file_key)
  end

  def overwrite_file(file, file_key)
    raise FileStorageServiceError::BucketRequiredError if @bucket_name.blank?

    PorkyLib::FileService.instance.overwrite_file(file, file_key, @bucket_name, FOGHORN_SERVICE_ALIAS)
  end
end
