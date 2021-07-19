# frozen_string_literal: true

require 'singleton'
require 'token_validator'

class ZetatangoService
  include Singleton

  TRACKED_OBJECT_EVENT_CLICKED = 'clicked'

  class ZetatangoServiceException < RuntimeError; end
  class ConnectionException < ZetatangoServiceException; end
  class ApiException < ZetatangoServiceException; end
  class MalformedResponseException < ZetatangoServiceException; end

  def initialize
    @oauth_token_service = TokenValidator::OauthTokenService.instance
  end

  def clear
    @oauth_token_service.clear
    Rails.cache.clear(namespace: CACHE_NAMESPACE)
  end

  def partner_vanity(partner_id)
    subdomain = Rails.cache.fetch(partner_id, expires_in: Rails.configuration.cache_timeout.minutes, namespace: CACHE_NAMESPACE) do
      response = RestClient.get api_config_path(:partners, partner_id), @oauth_token_service.oauth_auth_header
      JSON.parse(response, symbolize_names: true)[:subdomain]
    end
    Rails.cache.write(partner_id, subdomain, namespace: CACHE_NAMESPACE) unless subdomain.nil?
    subdomain
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

  def partner_lookup(subdomain)
    partner_info = Rails.cache.fetch(subdomain, expires_in: Rails.configuration.cache_timeout.minutes, namespace: CACHE_NAMESPACE) do
      response = RestClient.get api_config_path(:partners, subdomain), @oauth_token_service.oauth_auth_header
      JSON.parse(response, symbolize_names: true)
    end
    Rails.cache.write(partner_info[:id], subdomain, namespace: CACHE_NAMESPACE) unless partner_info.nil?
    partner_info
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

  def merchant_lookup(merchant_guid)
    Rails.cache.fetch(merchant_guid, expires_in: Rails.configuration.cache_timeout.minutes, namespace: CACHE_NAMESPACE) do
      response = RestClient.get api_config_path(:merchants, merchant_guid), @oauth_token_service.oauth_auth_header
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

  def add_tracked_object_event(tracked_object_guid, action)
    RestClient.post api_tracked_object_path(tracked_object_guid), { action: action }, @oauth_token_service.oauth_auth_header
  rescue Errno::ECONNREFUSED => e
    Rails.logger.error(e.message)
    raise ConnectionException
  rescue RestClient::Exception => e
    Rails.logger.error(e.message)
    raise ApiException
  end

  protected

  CACHE_NAMESPACE = '0245f3cd-0505-479f-a28f-c515ebfe979f'

  def api_config_path(resource, param = nil)
    base = "#{Rails.configuration.zetatango_url}/api/config/#{resource}"
    return base unless param

    "#{base}/#{param}"
  end

  def api_tracked_object_path(guid)
    "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{guid}"
  end
end
