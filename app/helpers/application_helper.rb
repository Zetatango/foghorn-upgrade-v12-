# frozen_string_literal: true

module ApplicationHelper
  include IntercomHelper

  def embed_intercom?
    intercom_enabled? && user_signed_in?
  end

  protected

  def intercom_config
    {
      app_id: Rails.application.secrets.intercom[:app_id],
      companies: merchant_info,
      custom_launcher_selector: '.intercom-trigger',
      email: current_user&.email,
      name: current_user&.name,
      user_hash: intercom_identity_verification_hash,
      user_id: current_user&.uid
    }.compact
  end

  def intercom_enabled?
    Rails.application.secrets.intercom&.dig(:enabled) && Rails.application.secrets.load_testing != true
  end

  def merchant_info
    return unless current_user&.merchant_on_selected_profile

    [{
      company_id: current_user.merchant_on_selected_profile,
      name: current_merchant_name(current_user.merchant_on_selected_profile)
    }.compact]
  end

  def current_merchant_name(merchant_guid)
    return unless current_user.merchant_exists?

    merchant = merchant_request(merchant_guid)

    merchant[:name] unless merchant.nil?
  end

  def merchant_request(merchant_guid)
    ZetatangoService.instance.merchant_lookup(merchant_guid)
  rescue ZetatangoService::ZetatangoServiceException => e
    Rails.logger.error("Failed to lookup merchant #{merchant_guid}: #{e.message}")
    nil
  end

  def gtm_container_id
    current_partner&.gtm_container_id
  end
end
