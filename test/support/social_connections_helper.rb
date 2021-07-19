# frozen_string_literal: true

module SocialConnectionsHelper
  extend ActiveSupport::Concern

  def social_connections_api_path(resource = nil)
    base = '/api/v1/social_connections'

    return base unless resource.present?

    "#{base}/#{resource}"
  end
end
