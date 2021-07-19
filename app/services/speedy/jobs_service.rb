# frozen_string_literal: true

require 'token_validator'

class Speedy::JobsService < Speedy::ServiceBase
  def create_projection_job(foreground, account_uuids)
    payload = {
      name: PROJECTION_JOB,
      foreground: foreground,
      account_uuids: account_uuids
    }.to_json

    send_request(:post, speedy_url(api_config_path), payload)
  end

  def create_process_flinks_transactions_job(foreground, file_path)
    payload = {
      name: PROCESS_FLINKS_TRANSACTIONS_JOB,
      foreground: foreground,
      file_path: file_path
    }.to_json

    send_request(:post, speedy_url(api_config_path), payload)
  end

  def get_job(job_uuid)
    send_request(:get, speedy_url(api_config_path(job_uuid)))
  end

  def get_jobs(name, state)
    params = {}
    params[:name] = name if name.present?
    params[:state] = state if state.present?

    query_params = params.to_query
    speedy_url = speedy_url(api_config_path)
    speedy_url += "?#{query_params}" unless query_params.blank?

    send_request(:get, speedy_url)
  end

  protected

  def speedy_url(path)
    scheme, port, host = parse_speedy_uri
    uri = URI::Generic.build(
      scheme: scheme,
      host: host,
      port: [80, 443].include?(port) ? '' : port,
      path: path
    )
    uri.to_s
  end

  def parse_speedy_uri
    parse_uri(Rails.configuration.speedy_url)
  end

  def parse_uri(uri)
    uri = URI.parse(uri)
    [uri.scheme, uri.port, uri.host]
  end

  def api_config_path(job_uuid = nil)
    base = '/api/jobs'
    return base unless job_uuid

    "#{base}/#{job_uuid}"
  end

  def send_request(method, url, payload = {})
    retries ||= 0

    headers = if method == :post
                { accept: :json, content_type: :json }
              else
                { accept: :json }
              end

    response = RestClient::Request.execute(
      method: method,
      url: url,
      payload: payload,
      headers: auth_header.merge(headers),
      open_timeout: Rails.configuration.rest_client_open_timeout,
      read_timeout: Rails.configuration.rest_client_read_timeout
    )

    JSON.parse(response, symbolize_names: true)
  rescue Errno::ECONNREFUSED, Errno::ECONNRESET, RestClient::Exceptions::Timeout => e
    Rails.logger.error(
      "Error sending request (#{method}, #{url}) - Retry (#{retries + 1} / #{Rails.configuration.connection_error_retries}): #{e.message}"
    )

    retry if (retries += 1) < Rails.configuration.connection_error_retries

    raise ConnectionException, e
  rescue RestClient::Exception => e
    Rails.logger.error("Error sending request (#{method}, #{url}): #{e.message}")
    raise ApiException, e
  rescue JSON::ParserError => e
    Rails.logger.error("Error sending request (#{method}, #{url}): #{e.message}")
    raise MalformedResponseException, e
  end

  def auth_header
    return TokenValidator::OauthTokenService.instance.oauth_auth_header unless access_token.present?

    { Authorization: "Bearer #{access_token}" }
  end
end
