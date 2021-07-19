# frozen_string_literal: true

require 'singleton'
require 'token_validator'

class IdPService
  include ScimUserHelper

  class IdPServiceException < RuntimeError; end
  class ConnectionException < IdPServiceException; end
  class ApiException < IdPServiceException; end
  class MalformedResponseException < IdPServiceException; end
  class InvalidParameterException < IdPServiceException; end
  class ResourceNotFoundException < ApiException; end

  def initialize(user_access_token = nil)
    @user_access_token = user_access_token
    @oauth_token_service = TokenValidator::OauthTokenService.instance
  end

  def clear
    @oauth_token_service.clear
    Rails.cache.clear(namespace: CACHE_NAMESPACE)
  end

  def identity_provider_lookup(idp_guid)
    return nil if idp_guid.nil?

    Rails.cache.fetch(idp_guid, expires_in: Rails.configuration.cache_timeout.minutes, namespace: CACHE_NAMESPACE) do
      response = RestClient.get api_config_path(:identity_providers, idp_guid), @oauth_token_service.oauth_auth_header
      JSON.parse(response, symbolize_names: true)
    end
  rescue Errno::ECONNREFUSED => e
    Rails.logger.error(e.message)
    raise ConnectionException
  rescue RestClient::ResourceNotFound => e
    Rails.logger.info(e.message)
    nil
  rescue RestClient::Exception => e
    Rails.logger.error(e.message)
    raise ApiException
  rescue JSON::JSONError => e
    Rails.logger.error(e.message)
    raise MalformedResponseException
  end

  def get_user(partner, user_guid)
    send_request(:get, scim_api_users_url(user_guid), partner_guid: partner.lender_partner_id)
  end

  def update_user(partner, scim_user)
    raise InvalidParameterException unless scim_user.key?(:id) && scim_user[:id].present?

    scim_user[:partner_guid] = partner.lender_partner_id
    scim_user[scim_urn_ario_extension.to_sym].each do |key, value|
      scim_user[key] = value
    end

    send_request(:put, scim_api_users_url(scim_user[:id]), scim_user.except(scim_urn_ario_extension.to_sym))
  end

  protected

  CACHE_NAMESPACE = '762f0ee2-a3db-409e-9c71-17575459296a'

  def api_config_path(resource, resource_id = nil)
    base = "#{Rails.configuration.roadrunner_url}/api/config/#{resource}"
    return base unless resource_id

    "#{base}/#{resource_id}"
  end

  def send_request(method, url, payload)
    retries ||= 0

    response = RestClient::Request.execute(
      method: method,
      url: url,
      payload: payload,
      headers: auth_header,
      open_timeout: Rails.configuration.rest_client_open_timeout,
      read_timeout: Rails.configuration.rest_client_read_timeout
    )

    JSON.parse(response, symbolize_names: true)
  rescue Errno::ECONNREFUSED, Errno::ECONNRESET, RestClient::Exceptions::Timeout => e
    Rails.logger.error(
      "Error sending SCIM request (#{method}, #{url}) - Retry (#{retries + 1} / #{Rails.configuration.connection_error_retries}): #{e.message}"
    )

    retry if (retries += 1) < Rails.configuration.connection_error_retries

    raise ConnectionException, e
  rescue RestClient::NotFound => e
    Rails.logger.error("Error sending SCIM request (#{method}, #{url}): #{e.message}")
    raise ResourceNotFoundException, e
  rescue RestClient::Exception => e
    Rails.logger.error("Error sending SCIM request (#{method}, #{url}): #{e.message}")
    raise ApiException, e
  rescue JSON::ParserError => e
    Rails.logger.error("Error sending SCIM request (#{method}, #{url}): #{e.message}")
    raise MalformedResponseException, e
  end

  def auth_header
    return @oauth_token_service.oauth_auth_header unless Rails.configuration.idp_user_token_enabled
    return @oauth_token_service.oauth_auth_header unless @user_access_token.present?

    { Authorization: "Bearer #{@user_access_token}" }
  end
end
