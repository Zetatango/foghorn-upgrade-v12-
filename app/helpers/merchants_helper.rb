# frozen_string_literal: true

module MerchantsHelper
  def base_url
    base = URI::Generic.build(
      scheme: request.scheme,
      host: request.host,
      port: request.port == 80 || request.port == 443 ? '' : request.port
    )
    "#{base}/"
  end
end
