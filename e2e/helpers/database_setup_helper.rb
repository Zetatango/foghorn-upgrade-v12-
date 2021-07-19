# frozen_string_literal: true

module DatabaseSetupHelper
  def reset_sandbox(access_token)
    begin
      response = RestClient::Request.execute(method: :post,
                                             url: "#{Rails.configuration.e2e_zetatango_url}/api/reset",
                                             headers: { Authorization: "Bearer #{access_token}" })
    rescue RestClient::BadRequest => e
      error = BadRequestError.new(method, url, headers, payload, e.response)
      Rails.logger.error(error.message)
      raise error
    end

    JSON.parse(response.body, symbolize_names: true)
  end

  def db_restore(access_token, options = {})
    RestClient::Request.execute(method: :post,
                                url: "#{Rails.configuration.e2e_zetatango_url}/api/snapshots/restore",
                                headers: { Authorization: "Bearer #{access_token}" },
                                payload: { id: options[:test_id], clean: true })
  end
end
