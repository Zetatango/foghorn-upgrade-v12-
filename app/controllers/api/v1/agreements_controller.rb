# frozen_string_literal: true

require 'ztt_client'

class Api::V1::AgreementsController < ApplicationController
  before_action :validate_token, :validate_agreement_guid

  def show
    agreement_guid = show_params[:id]
    show_terms = show_params[:show_terms]
    opts = { show_terms: show_terms }
    agreement = ztt_client.agreements_api.get_agreement(agreement_guid, **opts)
    render json: { status: 'SUCCESS', message: 'agreement retrieved', data: agreement }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code #{response[:code]} occurred while retrieving the agreement: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def accept
    agreement_guid = accept_params[:id]
    ip_address = request.remote_ip
    agreement = ztt_client.agreements_api.accept(ip_address, agreement_guid)
    render json: { status: 'SUCCESS', message: 'accepted agremeent', data: agreement }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code #{response[:code]} occurred while accepting the agreement: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def decline
    agreement_guid = decline_params[:id]
    ip_address = request.remote_ip
    ztt_client.agreements_api.decline(ip_address, agreement_guid)
    render json: { status: 'SUCCESS' }
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code #{response[:code]} occurred while declining the agreement: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def opt_out
    agreement_guid = opt_out_params[:id]
    ip_address = request.remote_ip
    agreement = ztt_client.agreements_api.opt_out(ip_address, agreement_guid)
    render json: { status: 'SUCCESS', message: 'agremeent opt out', data: agreement }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code #{response[:code]} occurred while opting out of the agreement: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def show_params
    params.permit(:id, :show_terms)
  end

  def accept_params
    params.permit(:id)
  end

  def decline_params
    params.permit(:id)
  end

  def opt_out_params
    params.permit(:id)
  end

  def validate_agreement_guid
    agreement_guid = params[:id]
    render json: { status: 'Error', message: 'Agreement guid is invalid' }, status: :bad_request unless agreement_guid_valid?(agreement_guid)
  end

  def agreement_guid_valid?(agreement_guid)
    /^agr_\w{16}$/.match?(agreement_guid)
  end
end
