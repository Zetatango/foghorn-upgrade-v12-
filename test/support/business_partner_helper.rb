# frozen_string_literal: true

module BusinessPartnerHelper
  extend ActiveSupport::Concern

  def business_partner_api_path(guid = nil, action = nil)
    base = api_v1_business_partners_path

    return base unless guid.present?
    return "#{base}/#{guid}" unless guid.present? && action.present?

    "#{base}/#{guid}/#{action}"
  end

  def business_partner_merchants_api_path(guid, action)
    "/api/v1/business_partner_merchants/#{guid}/#{action}"
  end
end
