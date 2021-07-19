# frozen_string_literal: true

module PartnerIdentity
  include PartnersHelper
  extend ActiveSupport::Concern

  included do
    helper_method :current_partner
  end

  protected

  def set_partner
    configure_partner_from_request(session, request)
  end

  def current_partner
    return nil unless session.key?(:partner)

    load_partner
  end

  def log_partner_id
    Rails.logger.info "[Partner ID: #{current_partner.id}]" if current_partner
  end

  private

  def load_partner
    @load_partner ||= session[:partner].is_a?(Partner) ? session[:partner] : Partner.new(session[:partner])
  end
end
