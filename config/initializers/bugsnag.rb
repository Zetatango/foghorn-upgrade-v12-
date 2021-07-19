# frozen_string_literal: true

if Rails.env.production?
  # :nocov:
  Bugsnag.configure do |config|
    config.api_key = ENV['BUGSNAG_API_KEY']
  end
  # :nocov:
end
