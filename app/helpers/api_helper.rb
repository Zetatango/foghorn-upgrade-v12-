# frozen_string_literal: true

module ApiHelper
  def parse_api_error(exc)
    if exc.response_body.present? && valid_json?(exc.response_body)
      JSON.parse(exc.response_body).symbolize_keys
    else
      Rails.logger.warn("Could not parse SwaggerClient::ApiError resp : #{exc.response_body} code: #{exc.code}")
      Bugsnag.notify(exc) unless exc.response_body.blank? || exc.code == 503
      { message: exc.message, code: nil, status: exc.code }
    end
  end

  private

  def valid_json?(json)
    resp = JSON.parse(json, symbolize_names: true)
    resp.is_a?(Hash)
  rescue JSON::ParserError
    false
  end
end
