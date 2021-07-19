# frozen_string_literal: true

FactoryBot.define do
  factory :partner do
    transient do
      idp { build :identity_provider }
    end

    skip_create
    id { "p_#{SecureRandom.base58(16)}" }
    subdomain { 'vanity' }
    identity_provider { idp }
    conf_onboard_supported { true }
    theme_name { 'acme' }
    theme_css_url { "https://www.s3bucket.com/#{theme_name}/variables.scss" }
    conf_allow_multiple_businesses { true }
    gtm_container_id { "GTM-#{SecureRandom.base58(7)}" }
  end

  factory :endorsing_partner, class: Partner do
    transient do
      lending_partner { build :partner }
      idp { build :identity_provider }
    end

    skip_create
    id { "p_#{SecureRandom.base58(16)}" }
    subdomain { 'endorser-vanity' }
    identity_provider { idp }
    conf_onboard_supported { true }
    theme_name { 'endorsing_acme' }
    theme_css_url { "https://www.s3bucket.com/#{theme_name}/variables.scss" }
    conf_allow_multiple_businesses { true }
    gtm_container_id { "GTM-#{SecureRandom.base58(7)}" }
    endorsing_partner_ids { [] }
    lender_partner_id { lending_partner.id }
    mode { 'production' }
  end

  factory :lending_partner, class: Partner do
    id { "p_#{SecureRandom.base58(16)}" }

    transient do
      endorsing_partners { build_list :endorsing_partner, 10, lender_partner_id: id }
      idp { build :identity_provider }
    end

    skip_create
    subdomain { 'lender-vanity' }
    identity_provider { idp }
    conf_onboard_supported { true }
    conf_allow_multiple_businesses { true }
    theme_name { 'lender_acme' }
    theme_css_url { "https://www.s3bucket.com/#{theme_name}/variables.scss" }
    gtm_container_id { "GTM-#{SecureRandom.base58(7)}" }
    endorsing_partner_ids do
      guids = [id]
      endorsing_partners.each do |partner|
        guids << partner.id
      end
      guids
    end
    lender_partner_id { id }
    mode { 'production' }
  end

  factory :allow_multiple_businesses_partner, class: Partner do
    transient do
      idp { build :identity_provider }
    end

    skip_create
    identity_provider { idp }
    subdomain { 'vanity' }
    idp_id { "idp_#{SecureRandom.base58(16)}" }
    conf_onboard_supported { true }
    conf_allow_multiple_businesses { true }
  end

  factory :disallow_multiple_businesses_partner, class: Partner do
    transient do
      idp { build :identity_provider }
    end

    skip_create
    identity_provider { idp }
    subdomain { 'vanity' }
    idp_id { "idp_#{SecureRandom.base58(16)}" }
    conf_onboard_supported { true }
    conf_allow_multiple_businesses { false }
  end
end
