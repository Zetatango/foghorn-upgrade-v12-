# frozen_string_literal: true

# These are primarily used to generate links in emails.
module UrlHelper
  protected

  # rubocop:disable Metrics/CyclomaticComplexity
  def roadrunner_url(path = '', opts = {})
    return Rails.configuration.roadrunner_url unless session[:partner]&.valid? && session[:partner].identity_provider&.valid?

    scheme, port = parse_uri Rails.configuration.roadrunner_url
    uri = URI::Generic.build(
      scheme: scheme,
      host: session[:partner].identity_provider.vanity_url,
      port: [80, 443].include?(port) ? '' : port
    )

    uri = URI.join(uri, path) unless path.blank?

    opts[:locale] ||= I18n.locale

    uri = add_params(uri, opts)
    uri.to_s
  end
  # rubocop:enable Metrics/CyclomaticComplexity

  def foghorn_url
    return Rails.configuration.foghorn_url unless session[:partner]&.valid?

    scheme, port = parse_uri Rails.configuration.foghorn_url
    uri = URI::Generic.build(
      scheme: scheme,
      host: session[:partner].wlmp_vanity_url,
      port: [80, 443].include?(port) ? '' : port
    )
    uri.to_s
  end

  def zetatango_url
    return Rails.configuration.zetatango_url unless session[:partner]&.valid?

    scheme, port = parse_uri Rails.configuration.zetatango_url
    uri = URI::Generic.build(
      scheme: scheme,
      host: session[:partner].admin_vanity_url,
      port: [80, 443].include?(port) ? '' : port
    )
    uri.to_s
  end

  def foghorn_vanity_from_host(host)
    match_info = /\A(.*?)\.#{Rails.application.secrets.zetatango_domain}\z/i.match(host)
    return unless match_info

    match_info[1]
  end

  private

  def add_params(uri, opts = {})
    opts = Hash[URI.decode_www_form(uri.query || '')].merge(opts)
    uri.query = URI.encode_www_form(opts)
    uri
  end

  def parse_uri(uri)
    uri = URI.parse(uri)
    [uri.scheme, uri.port]
  end
end
