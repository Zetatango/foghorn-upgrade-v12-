# frozen_string_literal: true

class OmniauthLinkAccountSetupHandler
  class OmniauthLinkAccountSetupTokenException < OmniAuth::Error; end

  def initialize(env)
    @env = env
    @request = Rack::Request.new(@env)
  end

  def validate_request
    request_token = @request.params['token']

    return unless @request.path.casecmp("/auth/#{@env['omniauth.strategy'].options.name}").zero?
    return if request_token.present? && OmniauthSecureRedirectService.instance.valid_secure_redirect_token?(request_token)

    raise OmniauthLinkAccountSetupTokenException
  end

  def self.call(env)
    OmniauthLinkAccountSetupHandler.new(env).validate_request
  end
end

class OmniAuthSetupHandler
  def initialize(env)
    @env = env
    @request = Rack::Request.new(@env)

    configure_partner_from_request(@request.session, @request)
  end

  def setup_strategy
    @env['omniauth.strategy'].options.client_options['host'] = idp_host
    @env['omniauth.strategy'].options.client_options['redirect_uri'] = auth_callback_uri
    @env['omniauth.strategy'].options['partner'] = @request.params['partner'] if @request.params.key?('partner')
    @env['omniauth.strategy'].options['tracked_object_id'] = @request.params['tracked_object_id'] if @request.params.key?('tracked_object_id')

    return if @request.params['auth_options'].blank?

    @env['omniauth.strategy'].options['prompt'] = @request.params['auth_options']['prompt']
    @env['omniauth.strategy'].options.client_options['redirect_uri'] = reauth_callback_uri
  end

  def self.call(env)
    OmniAuthSetupHandler.new(env).setup_strategy
  end

  private

  def auth_callback_uri
    scheme, port = parse_foghorn_uri
    uri = URI::Generic.build(
      scheme: scheme,
      host: wlmp_host,
      port: [80, 443].include?(port) ? '' : port,
      path: '/auth/user/callback'
    )
    uri.to_s
  end

  def reauth_callback_uri
    scheme, port = parse_foghorn_uri
    uri = URI::Generic.build(
      scheme: scheme,
      host: wlmp_host,
      port: [80, 443].include?(port) ? '' : port,
      path: @request.params['auth_options']['redirect_uri']
    )
    uri.to_s
  end

  def parse_foghorn_uri
    uri = URI.parse(Rails.configuration.foghorn_url)
    [uri.scheme, uri.port]
  end

  def idp_host
    return @request.session[:partner].identity_provider.vanity_url if @request.session[:partner]&.identity_provider.present? &&
                                                                      @request.session[:partner].identity_provider.vanity_url.present?

    URI.parse(Rails.configuration.roadrunner_url).host
  end

  def wlmp_host
    return @request.session[:partner].wlmp_vanity_url if @request.session[:partner]&.present?

    URI.parse(Rails.configuration.foghorn_url).host
  end

  def configure_partner_from_request(current_session, current_request)
    current_session.delete(:partner)

    return unless valid_request?(current_request)

    subdomain = foghorn_vanity_from_host(current_request.host)
    return unless subdomain.present?

    current_session[:partner] = Partner.new(subdomain: subdomain)

    partner = ZetatangoService.instance.partner_lookup(subdomain)
    return if partner.blank?

    current_session[:partner] = Partner.new(partner.except(:idp_id))
    current_session[:partner].identity_provider = IdentityProvider.new(id: partner[:idp_id])

    idp = IdPService.new.identity_provider_lookup(partner[:idp_id])
    return if idp.blank?

    current_session[:partner].identity_provider = IdentityProvider.new(idp)
  rescue ZetatangoService::ZetatangoServiceException, IdPService::IdPServiceException => e
    Rails.logger.error("Error configuring partner in omniauth: #{e.message}")
  end

  def valid_request?(current_request)
    matches_foghorn_host = current_request.host.casecmp(URI.parse(Rails.configuration.foghorn_url).host).zero?
    matches_zetatango_host = current_request.host.downcase =~ /#{Regexp.escape(Rails.application.secrets.zetatango_domain)}\z/i
    proper_url_format = current_request.host.split(/\./).size >= 3

    !matches_foghorn_host && matches_zetatango_host && proper_url_format
  end

  def foghorn_vanity_from_host(host)
    match_info = /\A(.*?)\.#{Rails.application.secrets.zetatango_domain}\z/i.match(host)
    return unless match_info

    match_info[1]
  end
end

def facebook_callback_url
  domain = Rails.configuration.foghorn_url

  # :nocov:
  if Rails.env.development?
    uri = URI.parse(domain)

    uri.scheme = 'https'
    uri.port = Rails.configuration.wlmp_ssl_port

    domain = uri.to_s
  end
  # :nocov:

  "#{domain}auth/facebook/callback"
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :openid_connect, name: :user, setup: OmniAuthSetupHandler,
                            issuer: Rails.configuration.roadrunner_url,
                            discovery: false,
                            client_signing_alg: :RS512,
                            client_jwk_signing_key: Rails.application.secrets.idp_signing_key,
                            scope: %i[openid profile ztt:api gen kyc:user idp:user dwh:user],
                            response_type: :code,
                            state: proc { SecureRandom.hex(64) },
                            send_nonce: true,
                            client_options: {
                              scheme: Rails.application.secrets.user_oidc[:scheme],
                              host: Rails.application.secrets.user_oidc[:host],
                              port: Rails.application.secrets.user_oidc[:port],
                              identifier: Rails.application.secrets.user_oidc[:credentials][:client_id],
                              secret: Rails.application.secrets.user_oidc[:credentials][:client_secret],
                              redirect_uri: Rails.application.secrets.user_oidc[:callback_url],
                              authorization_endpoint: '/oauth/authorize',
                              token_endpoint: '/oauth/token',
                              userinfo_endpoint: '/oauth/userinfo',
                              jwks_uri: '/oauth/discovery/keys'
                            }

  provider :openid_connect, name: :quickbooks, setup: OmniauthLinkAccountSetupHandler,
                            issuer: Rails.application.secrets.quickbooks_oidc[:issuer_url],
                            discovery: false, # TODO: set discovery to true and edit openid_connect gem to get the proper info
                            client_signing_alg: :RS256,
                            client_jwk_signing_key: Rails.application.secrets.quickbooks_oidc[:signing_key],
                            scope: %w[com.intuit.quickbooks.accounting openid],
                            response_type: :code,
                            # :nocov:
                            state: proc { |env| Rack::Request.new(env).params['flow_id'] },
                            ui_locales: proc { |env| Rack::Request.new(env).params['locale'] },
                            # :nocov:
                            send_nonce: false,
                            client_options: {
                              scheme: Rails.application.secrets.quickbooks_oidc[:scheme],
                              host: Rails.application.secrets.quickbooks_oidc[:host],
                              identifier: Rails.application.secrets.quickbooks_oidc[:credentials][:client_id],
                              secret: Rails.application.secrets.quickbooks_oidc[:credentials][:client_secret],
                              redirect_uri: "#{Rails.configuration.foghorn_url}auth/quickbooks/callback",
                              authorization_endpoint: Rails.application.secrets.quickbooks_oidc[:endpoints][:authorization],
                              token_endpoint: Rails.application.secrets.quickbooks_oidc[:endpoints][:token],
                              userinfo_endpoint: Rails.application.secrets.quickbooks_oidc[:endpoints][:userinfo]
                            }

  provider :facebook, Rails.application.secrets.facebook[:application_id], Rails.application.secrets.facebook[:application_secret],
           scope: Rails.application.secrets.facebook[:scopes],
           callback_url: facebook_callback_url,
           # :nocov:
           state: proc { |env| Rack::Request.new(env).params['flow_id'] },
           # :nocov:
           display: :popup,
           setup: OmniauthLinkAccountSetupHandler
end

OmniAuth.config.logger = Rails.logger

# :nocov:
OmniAuth.config.on_failure do |env|
  strategy_name = env['omniauth.error.strategy'].name
  path_elements = [OmniAuth.config.path_prefix, '/', strategy_name, '/failure']
  params = env['rack.request.query_hash']
  path_elements << "?#{params.to_query}" if params.present? && params.any?

  Rack::Response.new(['302 Moved'], 302, 'Location' => path_elements.join).finish
end
# :nocov:
