# frozen_string_literal: true

module RequestsHelper
  def execute_request(request_method, endpoint, headers, payload)
    begin
      Rails.logger.debug("#{request_method} - #{endpoint} - #{payload}")
      response = RestClient::Request.execute(method: request_method,
                                             url: endpoint,
                                             headers: headers,
                                             payload: payload)
    rescue RestClient::UnprocessableEntity => e
      puts "Failed Identity check: #{e.message}"
      exit
    rescue RestClient::BadRequest => e
      puts "Bad request: #{e.message}"
      exit
    end
    JSON.parse(response.body, symbolize_names: true)
  end

  def auth_headers(token = nil)
    access_token = token.present? ? token : @access_token
    {
      'Authorization' => "Bearer #{access_token}"
    }
  end
end
