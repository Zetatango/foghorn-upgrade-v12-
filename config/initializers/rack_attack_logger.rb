# frozen_string_literal: true

# :nocov:
# rubocop:disable Style/StringConcatenation
LOGGER = Rails.logger
ActiveSupport::Notifications.subscribe('rack.attack') do |_name, _start, _finish, _request_id, req|
  msg = [req[:request].env['rack.attack.match_type'], req[:request].ip, req[:request].request_method, req[:request].fullpath,
         ('"' + req[:request].user_agent.to_s + '"')].join(' ') +
        "\nBlocked connection from port: #{req[:request].port} at address #{req[:request].url}"
  LOGGER.error(msg) if %i[throttle blocklist].include? req[:request].env['rack.attack.match_type']
end
# rubocop:enable Style/StringConcatenation
# :nocov:
