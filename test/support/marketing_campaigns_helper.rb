# frozen_string_literal: true

module MarketingCampaignsHelper
  extend ActiveSupport::Concern

  def marketing_campaigns_api_path(resource = nil)
    base = '/api/v1/marketing_campaigns'

    return base unless resource.present?

    "#{base}/#{resource}"
  end
end
