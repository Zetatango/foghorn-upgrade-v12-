# frozen_string_literal: true

module PartnersHelper
  include UserSessionHelper
  include UrlHelper

  protected

  def configure_partner_from_request(current_session, current_request)
    current_session.delete(:partner)
    return unless valid_request?(current_request)

    subdomain = foghorn_vanity_from_host(current_request.host)
    return unless subdomain.present?

    current_session[:partner] = Partner.new(subdomain: subdomain)
    partner = ZetatangoService.instance.partner_lookup(subdomain)
    return reset_and_redirect_to_sinkhole if partner.blank?

    current_session[:partner] = Partner.new(partner.except(:idp_id))
    current_session[:partner].identity_provider = IdentityProvider.new(id: partner[:idp_id])

    idp = idp_client(nil).identity_provider_lookup(partner[:idp_id])
    return reset_and_redirect if idp.blank?

    current_session[:partner].identity_provider = IdentityProvider.new(idp)
  rescue ZetatangoService::ZetatangoServiceException, IdPService::IdPServiceException
    reset_and_redirect
  end

  private

  def valid_request?(current_request)
    matches_foghorn_host = current_request.host.casecmp(URI.parse(Rails.configuration.foghorn_url).host).zero?
    matches_zetatango_host = current_request.host.downcase =~ /#{Regexp.escape(Rails.application.secrets.zetatango_domain)}\z/i
    proper_url_format = current_request.host.split(/\./).size >= 3

    !matches_foghorn_host && matches_zetatango_host && proper_url_format
  end

  def reset_and_redirect_to_sinkhole
    destroy_user_session

    redirect_to Rails.configuration.sinkhole_vanity_url
  end

  def reset_and_redirect
    destroy_user_session

    redirect_to Rails.configuration.foghorn_url
  end
end
