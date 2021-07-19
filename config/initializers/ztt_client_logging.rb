# frozen_string_literal: true

require 'typhoeus/request'

module ApiClientExtension
  def run
    response = super
    request_info = "#{options[:method].to_s.upcase} #{base_url}"
    Rails.logger.info("ZTT Api called: #{request_info}, code=#{response.code}, request_id=#{response.headers&.dig('X-Request-Id')}")
    response
  end
end

class Typhoeus::Request
  prepend ApiClientExtension
end
