# frozen_string_literal: true

params = {
  url: Rails.application.secrets.redis_url,
  reconnect_attempts: ENV.fetch('RESQUE_REDIS_RECONNECT_ATTEMPTS', 3).to_i,
  connect_timeout: ENV.fetch('RESQUE_REDIS_CONNECT_TIMEOUT', 3).to_i
}

unless Rails.env.e2e?
  params[:driver] = :ruby
  params[:ssl_params] = {
    verify_mode: OpenSSL::SSL::VERIFY_NONE
  }
end

Redis.new(params)
