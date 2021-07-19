# frozen_string_literal: true

require 'ztt_client'

class OmniauthProviderBaseController < ApplicationController
  REDIS_NAMESPACE = 'omniauth-flow'
  FLOW_EXPIRY = 3600

  # these need to match the {quickbooks, facebook}.service.ts expected values
  FAILURE_STATUS = 'fail'
  SUCCESS_STATUS = 'success'

  class InvalidOmniauthProviderResponseError < StandardError; end

  def callback
    ztt_client = ZttClient.new(context[:access_token])
    ztt_client.merchants_api.update_merchant(context[:merchant_id], callback_merchant_info)
    Rails.logger.info("Merchant #{context[:merchant_id]} updated successfully")
    finalize(context[:return_url], SUCCESS_STATUS)
  rescue SwaggerClient::ApiError, ZttClient::ZttClientException, InvalidOmniauthProviderResponseError => e
    handle_callback_error(e)
  end

  def start
    unless current_access_token.present?
      Rails.logger.info("#{provider} connect initiated with no active session")
      return finalize(current_flow_result_path, FAILURE_STATUS)
    end

    flow_id = SecureRandom.uuid

    merchant_id = current_user.merchant_on_selected_profile
    partner_id = current_user.profile(current_user.selected_profile)['partner']

    context = {
      merchant_id: merchant_id,
      partner_id: partner_id,
      return_url: current_flow_result_path,
      access_token: current_access_token
    }
    Rails.cache.write(flow_id, context, expires_in: FLOW_EXPIRY, namespace: REDIS_NAMESPACE)

    Rails.logger.info("Starting #{provider} flow #{flow_id} for merchant #{merchant_id}")

    redirect_to auth_path(flow_id)
  end

  def failure
    finalize(context[:return_url], FAILURE_STATUS)
  end

  private

  def handle_standard_error(exception)
    Bugsnag.notify(exception)
    return_url = context&.dig(:return_url)
    return unless return_url.present?

    finalize(return_url, FAILURE_STATUS)
  end

  def finalize(return_url, status, message = nil)
    url = "#{return_url}?status=#{status}"
    url = "#{url}&message=#{message}" if message.present?
    redirect_to url
  end

  def auth_path(flow_id)
    redirect_token = OmniauthSecureRedirectService.instance.generate_secure_redirect_token

    "#{Rails.configuration.foghorn_url}auth/#{provider.downcase}?flow_id=#{flow_id}&token=#{redirect_token}"
  end

  def context
    flow_id = params[:state]
    Rails.cache.read(flow_id, namespace: REDIS_NAMESPACE)
  end

  # need to go back to vanity to be able to use sendMessage channel
  # otherwise it raises: Permission denied to access property "messageChannel" on cross-origin object
  def current_flow_result_path
    "#{request.base_url}#{flow_result_path}"
  end

  def handle_callback_error(err)
    Rails.logger.error("Unable to update merchant #{context&.dig(:merchant_id)}: #{err.message}")
    finalize(context[:return_url], FAILURE_STATUS)
  end
end
