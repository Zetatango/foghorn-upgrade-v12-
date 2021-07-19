# frozen_string_literal: true

module TokenHelper
  protected

  def owner_guid_from_token(token)
    decoded_token = JWT.decode(token, nil, false).first.with_indifferent_access

    merchant_guid = decoded_token.dig(:properties, :merchant)
    lead_guid = decoded_token.dig(:properties, :lead)

    merchant_guid.presence || lead_guid.presence
  rescue JWT::DecodeError => e
    Rails.logger.error("Token error: #{e.message}")
    nil
  end
end
