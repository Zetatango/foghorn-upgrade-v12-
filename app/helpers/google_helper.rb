# frozen_string_literal: true

module GoogleHelper
  protected

  def use_ga?
    Rails.application.secrets.ga[:track] == 'true'
  end

  def ga_tag
    Rails.application.secrets.ga[:ga_tag]
  end

  def ga_url
    return 'https://www.google-analytics.com/analytics_debug.js' if Rails.application.secrets.ga[:debug] == 'true'

    'https://www.google-analytics.com/analytics.js'
  end

  def google_places_api_key
    ENV.fetch('GOOGLE_PLACES_KEY', '')
  end
end
