# frozen_string_literal: true

require 'ipaddr'
require 'maxminddb'

Rack::Attack.cache.store = Rails.cache

@maxmind_db = MaxMindDB.new('./doc/maxmind/GeoIP2-Country.mmdb')
@talos_ip_blacklist = File.read(File.join(Rails.root, 'doc', 'talos', 'ip_blacklist.txt'))

Rack::Attack.blocklist('Blocklist by IP address') do |req|
  blocked = ip_address_blocklisted?(req)
  Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was blocked for violating the IP address blacklist") if blocked

  blocked
end

Rack::Attack.blocklist('Blocklist by country') do |req|
  blocked = country_blocklisted?(req)
  Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was blocked for violating the country blacklist") if blocked

  blocked
end

Rack::Attack.blocklist('Blocklist anonymized IP addresses') do |req|
  blocked = anonymous_ip_address?(req)
  Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was blocked for originating from an anonymous IP address") if blocked

  blocked
end

Rack::Attack.throttle('Throttle requests that are neither safelisted nor blocklisted', limit: Rails.configuration.throttle_limit,
                                                                                       period: Rails.configuration.throttle_period) do |req|
  unless sensitive_endpoint?(req)
    throttled = throttle_request?(req)
    Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was throttled") if throttled

    req.ip if throttled
  end
end

Rack::Attack.throttle('Throttle requests that are neither safelisted nor blocklisted for sensitive endpoints',
                      limit: Rails.configuration.sensitive_throttle_limit, period: Rails.configuration.sensitive_throttle_period) do |req|
  if sensitive_endpoint?(req)
    throttled = throttle_request?(req)
    Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was throttled") if throttled && req.path

    req.ip if throttled
  end
end

Rack::Attack.blocklist('Blocklist requests with empty user agent') do |req|
  if check_ua_enabled?
    Rack::Attack::Fail2Ban.filter("empty-agent-#{req.ip}", maxretry: Rails.configuration.empty_ua_maxretry,
                                                           findtime: Rails.configuration.empty_ua_scan_period_mins,
                                                           bantime: Rails.configuration.empty_ua_ban_period_hrs) do
      empty_agent = empty_user_agent?(req)
      Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was blocked due to empty user agent") if empty_agent

      empty_agent
    end
  end
end

Rack::Attack.blocklist('General platform blocklist') do |req|
  blocked = platform_blocklist?(req)
  Rails.logger.info("Request to endpoint #{req.path} from IP address #{req.ip} was blocked for violating the platform blocklist") if blocked

  blocked
end

def sensitive_endpoint?(req)
  req.path.start_with?('/api/v1/applicants') && req.path.end_with?('authenticate') && (req.request_method == 'POST' || req.request_method == 'PUT')
end

def empty_user_agent?(req)
  return false unless Rails.env.production?

  req.user_agent.blank?
end

def ip_address_safelisted?(req)
  return true unless Rails.env.production?

  return true if ENV.fetch('WHITELISTED_IP_ADDRESSES', '').split(',').include?(req.ip)

  ENV.fetch('WHITELISTED_IP_RANGES', '').split(',').each do |range|
    ip_range = IPAddr.new(range)
    return true if ip_range.include?(req.ip)
  end

  false
end

def country_safelisted?(req)
  return true unless Rails.env.production?

  lookup_result = @maxmind_db.lookup(req.ip)
  return false if lookup_result.country.iso_code.blank?

  ENV.fetch('WHITELISTED_COUNTRIES', '').downcase.split(',').include?(lookup_result.country.iso_code.downcase)
end

def ip_address_blocklisted?(req)
  return false unless Rails.env.production?
  return false unless firewall_enabled?

  blacklist = @talos_ip_blacklist.split("\n")
  ario_blacklist = ENV.fetch('BLACKLISTED_IP_ADDRESSES', '').split(',')
  blacklist |= ario_blacklist

  blacklist.include?(req.ip)
end

def country_blocklisted?(req)
  return false unless Rails.env.production?
  return false unless firewall_enabled?

  lookup_result = @maxmind_db.lookup(req.ip)
  ENV.fetch('BLACKLISTED_COUNTRIES', '').downcase.split(',').include?(lookup_result.country.iso_code.downcase) unless lookup_result.country.iso_code.blank?
end

def anonymous_ip_address?(req)
  return false unless Rails.env.production?
  return false unless firewall_enabled?
  return false if req.ip == ENV['VPN_IP']

  lookup_result = @maxmind_db.lookup(req.ip)
  lookup_result.traits.is_anonymous_proxy
end

def throttle_request?(req)
  return false unless Rails.env.production?
  return false unless firewall_enabled?
  return false if req.path == '/csp_reports' && req.request_method == 'POST'

  !ip_address_safelisted?(req) && !country_safelisted?(req)
end

def ip_in_local_range?(ip_in)
  ENV['SPACE_OUTBOUND_IPS'].split(', ').include?(ip_in)
end

def firewall_enabled?
  ENV.fetch('FIREWALL', 'false') == 'true'
end

def check_ua_enabled?
  ENV.fetch('CHECK_UA', 'false') == 'true'
end

def blocked_request_for_logout?(req)
  !ip_in_local_range?(req.ip)
end

def platform_blocklist?(req)
  return false unless Rails.env.production?
  return false unless firewall_enabled?
  return true unless req.port == 443
  return false if ip_address_safelisted?(req)
  return false if country_safelisted?(req)

  blocklist_paths?(req)
end

def blocklist_paths?(req)
  return blocked_request_for_logout?(req) if req.path.start_with?('/backchannel_logout')

  ip_in_local_range?(req.ip)
end

Rack::Attack.blocklisted_response = lambda do |_env|
  error_page = ActionView::Base.new(ActionView::LookupContext.new([]), {}, nil).render(file: 'public/404.html')
  [404, { 'Content-Type' => 'text/html' }, [error_page]]
end

Rack::Attack.throttled_response = lambda do |_env|
  error_page = ActionView::Base.new(ActionView::LookupContext.new([]), {}, nil).render(file: 'public/404.html')
  [404, { 'Content-Type' => 'text/html' }, [error_page]]
end
