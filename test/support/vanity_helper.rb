# frozen_string_literal: true

module VanityHelper
  def stub_vanity_host
    setup_idp
    setup_partners

    stub_access_token
    stub_partner_lookup
    stub_idp_lookup

    setup_hostname
  end

  private

  def setup_hostname
    @hostname = "#{@partner.subdomain}.#{Rails.application.secrets.zetatango_domain}"
    @endorsing_hostname = "#{@endorsing_partner.subdomain}.#{Rails.application.secrets.zetatango_domain}"

    host! @hostname
  end

  def stub_partner_lookup
    stub_partner_lookup_by_partner(@partner)
    stub_partner_lookup_by_partner(@partner2)
    stub_partner_lookup_by_partner(@endorsing_partner)
    stub_partner_lookup_by_partner(@no_theme_partner)
  end

  def stub_partner_lookup_by_partner(partner)
    body = {
      id: partner.id,
      subdomain: partner.subdomain,
      idp_id: partner.identity_provider.id,
      conf_onboard_supported: partner.conf_onboard_supported,
      conf_allow_multiple_businesses: partner.conf_allow_multiple_businesses,
      conf_merchant_welcome: partner.conf_merchant_welcome,
      gtm_container_id: partner.gtm_container_id,
      lender_partner_id: partner.lender_partner_id,
      mode: partner.mode,
      theme_name: partner.theme_name,
      theme_css_url: partner.theme_css_url,
      endorsing_partner_ids: partner.endorsing_partner_ids
    }

    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{partner.id}")
      .with(headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 200, body: body.to_json)

    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{partner.subdomain}")
      .with(headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 200, body: body.to_json)
  end

  def stub_idp_lookup
    stub_request(:get, "#{Rails.configuration.roadrunner_url}/api/config/identity_providers/#{@idp.id}")
      .with(headers: { authorization: "Bearer #{@idp_access_token}" })
      .to_return(status: 200, body: {
        id: @idp.id,
        name: @idp.subdomain,
        subdomain: @idp.subdomain,
        vanity_url: @idp.vanity_url,
        created_at: Time.now
      }.to_json)
  end

  def stub_access_token
    @idp_access_token = SecureRandom.base58(32)

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { grant_type: 'client_credentials',
                    client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope] })
      .to_return(status: 200, body: { access_token: @idp_access_token, expires_in: 7200 }.to_json)

    @idp_access_token
  end

  def setup_partners
    @partner = create :lending_partner, subdomain: 'acme-wlmp', identity_provider: @idp, conf_merchant_welcome: true,
                                        conf_allow_multiple_businesses: true, conf_onboard_supported: true,
                                        gtm_container_id: "GTM-#{SecureRandom.base58(7)}", endorsing_partner_ids: []
    @partner2 = create :lending_partner, subdomain: 'zeta-wlmp', identity_provider: @idp, conf_merchant_welcome: true,
                                         conf_allow_multiple_businesses: false, conf_onboard_supported: true,
                                         gtm_container_id: "GTM-#{SecureRandom.base58(7)}"
    @endorsing_partner = create :endorsing_partner, lending_partner: @partner, identity_provider: @idp
    @no_theme_partner = create :partner, subdomain: 'acme-no-theme', identity_provider: @idp, conf_merchant_welcome: true, endorsing_partner_ids: [],
                                         theme_name: nil, theme_css_url: nil

    @partner.endorsing_partner_ids << @partner.id
    @partner.endorsing_partner_ids << @endorsing_partner.id
  end

  def setup_idp
    idp_guid = "ip_#{SecureRandom.base58(16)}"
    idp_subdomain = 'acme-idp'
    idp_vanity_url = "id.#{idp_subdomain}.#{Rails.application.secrets.zetatango_domain}"

    @idp = build :identity_provider, id: idp_guid, subdomain: idp_subdomain, vanity_url: idp_vanity_url
  end
end
