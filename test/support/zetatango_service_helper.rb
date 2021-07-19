# frozen_string_literal: true

module ZetatangoServiceHelper
  def stub_partner_lookup_api(partner)
    body = {
      id: partner.id,
      subdomain: partner.subdomain,
      idp_id: partner.identity_provider.id,
      conf_onboard_supported: partner.conf_onboard_supported,
      conf_allow_multiple_businesses: partner.conf_allow_multiple_businesses,
      conf_merchant_welcome: partner.conf_merchant_welcome,
      lender_partner_id: partner.lender_partner_id,
      mode: partner.mode,
      theme_name: partner.theme_name,
      theme_css_url: partner.theme_css_url,
      endorsing_partner_ids: partner.endorsing_partner_ids
    }

    access_token = stub_oauth_token_request

    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{partner.subdomain}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: body.to_json)

    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{partner.id}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: body.to_json)

    partner.id
  end

  def stub_oauth_token_request
    access_token = SecureRandom.hex(32)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(
        body: {
          client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
          client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
          grant_type: 'client_credentials',
          scope: Rails.application.secrets.idp_api[:credentials][:scope]
        }
      )
      .to_return(
        status: 200,
        body: {
          access_token: access_token,
          token_type: :bearer,
          expires_in: 1800,
          refresh_token: '',
          scope: Rails.application.secrets.idp_api[:credentials][:scope]
        }.to_json
      )
    access_token
  end
end
