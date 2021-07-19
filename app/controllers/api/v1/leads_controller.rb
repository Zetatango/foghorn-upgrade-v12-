# frozen_string_literal: true

require 'ztt_client'

class Api::V1::LeadsController < ApplicationController
  before_action :validate_token
  before_action :validate_selected_insights_bank_accounts, only: :update_selected_insights_bank_accounts
  before_action :validate_desired_bank_account_balance, only: :update_desired_bank_account_balance

  def update_selected_insights_bank_accounts
    body = {
      bank_account_ids: update_selected_insights_bank_accounts_params[:bank_account_ids]
    }.to_json

    response = ztt_client.leads_api.post_selected_insights_accounts(update_selected_insights_bank_accounts_params[:id], body)
    render json: { status: 'SUCCESS', message: 'Lead successfully updated', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to update a lead: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def update_desired_bank_account_balance
    body = {
      desired_bank_account_balance: update_desired_bank_account_balance_params[:desired_bank_account_balance]
    }.to_json

    response = ztt_client.leads_api.update_desired_bank_account_balance(update_desired_bank_account_balance_params[:id], body)
    render json: { status: 'SUCCESS', message: 'Lead successfully updated', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting to update a lead: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def update_selected_insights_bank_accounts_params
    params.permit(:id, bank_account_ids: [])
  end

  def update_desired_bank_account_balance_params
    params.permit(:id, :desired_bank_account_balance)
  end

  def validate_desired_bank_account_balance
    return unless update_desired_bank_account_balance_params[:desired_bank_account_balance].blank?

    render json: { status: 'Error', message: "Missing required parameter 'desired_bank_account_balance'" }, status: 400
  end

  def validate_selected_insights_bank_accounts
    return unless update_selected_insights_bank_accounts_params[:bank_account_ids].blank?

    render json: { status: 'Error', message: "Missing required parameter 'bank_account_ids'" }, status: 400
  end
end
