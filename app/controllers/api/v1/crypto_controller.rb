# frozen_string_literal: true

class Api::V1::CryptoController < ApplicationController
  class EncryptionBundleException < StandardError; end

  def encryption_bundle
    options = { metadata: { original_filename: CGI.escape(crypto_params[:filename]) } }
    presigned_url, s3_key = porky_lib.presigned_post_url(file_transfer_bucket, options)

    bundle = {
      presigned_url: presigned_url,
      s3_key: s3_key
    }
    render json: { status: 'SUCCESS', message: 'Encryption bundle created successfully', body: bundle }, status: :ok
  rescue PorkyLib::FileService::FileServiceError => e
    Rails.logger.error('Error requesting presigned_post_url from PorkyLib')
    raise EncryptionBundleException, e.message
  rescue ActionController::ParameterMissing => e
    render json: { status: 'Error', message: e.message }, status: :unprocessable_entity
  end

  private

  def file_transfer_bucket
    @file_transfer_bucket ||= Rails.configuration.aws_s3_bucket_file_transfer
  end

  def porky_lib
    @porky_lib ||= PorkyLib::FileService.instance
  end

  def crypto_params
    params.require(%i[filename])

    params.permit(:filename)
  end
end
