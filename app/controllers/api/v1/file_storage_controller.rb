# frozen_string_literal: true

require 'mimemagic'

class Api::V1::FileStorageController < ApplicationController
  include DocumentsCacheHelper

  class FileKeyNotFound < StandardError; end

  def upload_file
    file = file_params[:file].tempfile
    unless supported_mimetype?(file.path, file_params[:file])
      render json: { status: 'Error', message: 'File mimetype is not supported' }, status: :unsupported_media_type
      return
    end

    if file_too_large?(file)
      render json: { status: 'Error', message: 'File is too large' }, status: :payload_too_large
      return
    end

    normalized_file_name = ActiveSupport::Inflector.transliterate(file_params[:file].original_filename)
    metadata = { original_filename: normalized_file_name, document_type: file_params[:document_type] }

    file_encryption_type = Rails.application.secrets.file_encryption_type

    case file_encryption_type
    when 'backend'
      s3_key = file_transfer_service.store_file(file, file_transfer_service.destination_service(file_params[:destination]), metadata: metadata)
    when 'none'
      s3_key = file_transfer_service.store_unencrypted_file(file, metadata: metadata)
    else
      render json: { status: 'Error', message: 'file_encryption_type must be none or backend' }, status: :unprocessable_entity
      return
    end

    file_id_pair = { "#{file_params[:file_id]}": s3_key }
    store_file_key(file_id_pair, file_params[:document_type])
    render json: { status: 'SUCCESS', message: 'File uploaded correctly' }, status: :ok
  rescue ActionController::ParameterMissing => e
    render json: { status: 'Error', message: e.message }, status: :not_found
  rescue FileTransferService::StoreFileException, FileTransferService::ParameterException => e
    render json: { status: 'Error', message: e.message }, status: :unprocessable_entity
  end

  def cache_file
    s3_key = file_cache_params[:s3_key]
    # TODO: validate destination exists

    file_id_pair = { "#{file_cache_params[:file_id]}": s3_key }
    store_file_key(file_id_pair, file_cache_params[:document_type])
    render json: { status: 'SUCCESS', message: 'File cached correctly' }, status: :ok
  rescue ActionController::ParameterMissing => e
    render json: { status: 'Error', message: e.message }, status: :not_found
  end

  def remove_file
    raise FileKeyNotFound unless file_key_exists?(params[:file_id], params[:document_type])

    remove_file_key(params[:file_id], params[:document_type])
    render json: { status: 'SUCCESS', message: 'File removed correctly' }, status: :ok
  rescue FileKeyNotFound
    render json: { status: 'Error', message: 'File Id not found.' }, status: :not_found
  end

  def submit_documents
    files_payload = generate_files_payload

    response = file_transfer_service.send_files(FileTransferService::ZETATANGO_SERVICE,
                                                current_user.merchant_on_selected_profile,
                                                current_user.access_token,
                                                submit_docs_params[:source_guid],
                                                files_payload)
    clear_docs_cache
    render json: { status: 'SUCCESS', message: 'File uploaded successfully', data: response }, status: :ok
  rescue FileTransferService::ApiException
    render json: { status: 'Error', message: 'Unable to submit files.' }, status: :unprocessable_entity
  rescue ActionController::ParameterMissing => e
    render json: { status: 'Error', message: e.message }, status: :not_found
  rescue FileTransferService::ParameterException => e
    render json: { status: 'Error', message: e.message }, status: :unprocessable_entity
  rescue FileTransferService::FileKeyCacheExpiredException
    render json: { status: 'Error', message: 'File upload expired' }, status: :gone
  end

  def clean_documents_cache
    clear_docs_cache
    render json: { status: 'SUCCESS', message: 'Documents successfully removed from cache' }, status: :ok
  end

  private

  def submit_docs_params
    params.require(%i[source_guid destination])

    params.permit(:source_guid, :destination)
  end

  # file_id is used by the frontend to identify the file (come from ngx-uploader)
  def file_params
    params.require(%i[file file_id document_type destination])

    params.permit(:file, :file_id, :document_type, :destination)
  end

  # file_id is used by the frontend to identify the file (come from ngx-uploader)
  def file_cache_params
    params.require(%i[file_id s3_key document_type destination])

    params.permit(:file, :file_id, :s3_key, :document_type, :destination)
  end

  def generate_files_payload
    files = []
    read_file_keys.each do |doc_type, file_key_pairs|
      file_key_pairs.each do |file_key_pair|
        files.push(lookup_key: file_key_pair.values.first, report_type: doc_type, destination: submit_docs_params[:destination])
      end
    end

    files
  end

  def file_transfer_service
    @file_transfer_service ||= FileTransferService.new
  end

  def allowed_mimetypes
    Rails.application.secrets.allowed_file_types.split(',')
  end

  def supported_mimetype?(filepath, file)
    # Use MimeMagic by default to detect file type based on Magic byte(s). If MimeMagic fails, use content_type (detection based on file extension)
    magic_result = MimeMagic.by_magic(File.open(filepath))
    mimetype = magic_result&.type || ''
    mimetype = file.content_type if mimetype.blank?

    allowed_mimetypes.include?(mimetype)
  end

  def file_too_large?(file)
    file.size > Rails.application.secrets.max_file_size
  end
end
