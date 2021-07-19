# frozen_string_literal: true

class Partner < NoTableRecord
  attr_accessor :id, :subdomain, :identity_provider, :conf_allow_multiple_businesses, :conf_onboard_supported,
                :conf_merchant_welcome, :conf_cash_flow_enabled, :mode, :lender_partner_id,
                :endorsing_partner_ids, :theme_name, :theme_css_url, :name, :gtm_container_id

  def wlmp_vanity_url
    "#{subdomain}.#{Rails.application.secrets.zetatango_domain}"
  end

  def admin_vanity_url
    return "admin.#{subdomain}.#{Rails.application.secrets.zetatango_domain}" if id == lender_partner_id

    lending_partner_subdomain = ZetatangoService.instance.partner_vanity(lender_partner_id)

    "admin.#{lending_partner_subdomain}.#{Rails.application.secrets.zetatango_domain}"
  end
end
