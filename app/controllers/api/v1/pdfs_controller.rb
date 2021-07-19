# frozen_string_literal: true

require 'ztt_client'

class Api::V1::PdfsController < ApplicationController
  before_action :validate_token
  before_action :validate_content, only: :to_pdf

  def to_pdf
    content = pdf_params[:content].to_s
    pdf = ztt_client.pdfs_api.generate_pdf(content)
    pdf = Base64.decode64(pdf.pdf_blob)

    send_data pdf
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code #{response[:code]} occurred while generating the pdf: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def pdf_params
    params.permit(:content)
  end

  def validate_content
    content = pdf_params[:content]

    return render json: { status: 'Error', message: 'Content is invalid' }, status: :bad_request unless content.to_s.valid_encoding?

    render json: { status: 'Error', message: 'Content is required' }, status: :bad_request if content.blank?
  end
end
