# frozen_string_literal: true

require 'ztt_client'

class Api::V1::LendingApplicationsController < ApplicationController
  before_action :validate_token

  def index
    applications_info = {
      merchant_id: current_user&.merchant_on_selected_profile
    }

    lending_applications = ztt_client.lending_api.get_applications(applications_info)
    render json: { status: 'Success', message: 'Loaded Lending Applications List', data: lending_applications }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def show
    application_id = application_params[:id]
    lending_application = ztt_client.lending_api.get_application(application_id)

    render json: { status: 'Success', message: 'Loaded Lending Application', data: lending_application }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def new
    app = new_application_params

    application = {
      merchant_id: current_user&.merchant_on_selected_profile, # Overriding provided accept_params[:merchant_id]
      offer_id: app[:offer_id],
      principal_amount: app[:principal_amount],
      apr: app[:apr],
      repayment_schedule: app[:repayment_schedule],
      interest_amount: app[:interest_amount],
      repayment_amount: app[:repayment_amount],

      # Optional parameters
      merchant_user_email: app[:merchant_user_email],
      merchant_user_id: app[:merchant_user_id],
      loan_term_id: app[:loan_term_id],
      payor_account_id: app[:payor_account_id],
      payee_id: app[:payee_id],
      payee_account_num: app[:payee_account_num],
      payee_invoice_num: app[:payee_invoice_num]
    }.to_json

    new_application = ztt_client.lending_api.create_application(application)
    render json: { status: 'SUCCESS', message: 'Application Successfuly Created', data: new_application }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def accept
    id = accept_params[:id]
    ubl_terms_agreed = accept_params[:ubl_terms_agreed]
    pad_terms_agreed = accept_params[:pad_terms_agreed]
    ip_address = request.remote_ip # Overriding provided accept_params[:ip_address]

    # Optional parameters
    payor_account_id = accept_params[:payor_account_id]
    payee_id = accept_params[:payee_id]
    payee_account_num = accept_params[:payee_account_num]
    payee_invoice_num = accept_params[:payee_invoice_num]

    application = ztt_client.lending_api.accept_application(id, ubl_terms_agreed, pad_terms_agreed, ip_address,
                                                            payor_account_id: payor_account_id, payee_id: payee_id,
                                                            payee_account_num: payee_account_num, payee_invoice_num: payee_invoice_num)

    if application.present?
      render json: { status: 'SUCCESS', message: 'Successfully accepted the application', data: application }, status: :ok
    else
      render json: { status: 'Error', message: 'Error occurred while accepting application' }, status: :unprocessable_entity
    end
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def amend
    id = amend_params[:id]
    principal_amount = amend_params[:principal_amount]
    loan_term_id = amend_params[:loan_term_id]
    application = ztt_client.lending_api.amend_application(id, principal_amount, loan_term_id)

    if application.present?
      render json: { status: 'SUCCESS', message: 'Successfully amended the application', data: application }, status: :ok
    else
      render json: { status: 'Error', message: 'Error occurred while amending application' }, status: :unprocessable_entity
    end
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def fee
    id = fee_params[:id]
    principal_amount = fee_params[:principal_amount]
    loan_term_id = fee_params[:loan_term_id]
    fee = ztt_client.lending_api.fee_for_lending_application(id, principal_amount, loan_term_id)
    render json: { status: 'Success', message: 'Loaded Lending Application\'s fee', data: fee }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def cancel
    id = cancel_params[:id]

    cancel_application_optional = {
      cancellation_reason: cancel_params[:cancellation_reason]
    }

    application = ztt_client.lending_api.cancel_application(id, cancel_application_optional)

    if application.present?
      render json: { status: 'SUCCESS', message: 'Successfully cancelled the application', data: application }, status: :ok
    else
      render json: { status: 'Error', message: 'Error occurred while cancelling application' }, status: :unprocessable_entity
    end
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def show_terms
    application_id = application_params[:id]
    terms = ztt_client.lending_api.get_campaign_terms(application_id)

    render json: { status: 'Success', message: 'Loaded Campaign Terms', data: terms }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  def show_pad
    application_id = application_params[:id]
    pad_agreement = ztt_client.lending_api.get_pad_agreement(application_id)

    render json: { status: 'Success', message: 'Loaded Campaign Terms', data: pad_agreement }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  protected

  def application_params
    params.permit(:id)
  end

  def accept_params
    params.permit(:id, :ubl_terms_agreed, :pad_terms_agreed, :ip_address, :payor_account_id, :payee_id, :payee_account_num, :payee_invoice_num)
  end

  def amend_params
    params.permit(:id, :principal_amount, :loan_term_id)
  end

  def fee_params
    params.permit(:id, :principal_amount, :loan_term_id)
  end

  def cancel_params
    params.permit(:id, :cancellation_reason)
  end

  def new_application_params
    params.permit(:merchant_id,
                  :offer_id,
                  :principal_amount,
                  :apr,
                  :repayment_schedule,
                  :merchant_user_email,
                  :merchant_user_id,
                  :interest_amount,
                  :repayment_amount,
                  :loan_term,
                  :loan_term_id,
                  :payor_account_id,
                  :payee_id,
                  :payee_account_num,
                  :payee_invoice_num)
  end
end
