# frozen_string_literal: true

module MerchantHelper
  extend ActiveSupport::Concern

  def merchant_api_path(guid = nil, action = nil)
    base = api_v1_merchants_path

    return base unless guid.present?
    return "#{base}/#{guid}" unless action.present?

    "#{base}/#{guid}/#{action}"
  end
end
