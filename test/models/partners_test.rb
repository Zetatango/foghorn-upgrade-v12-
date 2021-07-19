# frozen_string_literal: true

require 'test_helper'

class PartnerTest < ActiveSupport::TestCase
  def setup
    @idp = build :identity_provider

    @lending_partner = create :lending_partner, endorsing_partners: [], identity_provider: @idp
    @endorsing_partner = create :endorsing_partner, lending_partner: @lending_partner

    @lending_partner.endorsing_partner_ids << @lending_partner.id
    @lending_partner.endorsing_partner_ids << @endorsing_partner.id
  end

  test 'Partner model has all attributes' do
    assert_respond_to(@lending_partner, :id)
    assert_respond_to(@lending_partner, :subdomain)
    assert_respond_to(@lending_partner, :identity_provider)
    assert_respond_to(@lending_partner, :conf_allow_multiple_businesses)
    assert_respond_to(@lending_partner, :conf_onboard_supported)
    assert_respond_to(@lending_partner, :conf_merchant_welcome)
    assert_respond_to(@lending_partner, :theme_name)
    assert_respond_to(@lending_partner, :theme_css_url)
    assert_respond_to(@lending_partner, :mode)
    assert_respond_to(@lending_partner, :lender_partner_id)
    assert_respond_to(@lending_partner, :endorsing_partner_ids)
  end

  test 'Partner with IdP is an IdentityProvider' do
    assert_kind_of IdentityProvider, @lending_partner.identity_provider
  end

  test 'Partner is valid' do
    assert @lending_partner.valid?
  end

  test 'Partner has correct wlmp vanity url' do
    assert_equal "#{@lending_partner.subdomain}.#{Rails.application.secrets.zetatango_domain}", @lending_partner.wlmp_vanity_url
  end

  test 'Lending partner has correct admin vanity url' do
    assert_equal "admin.#{@lending_partner.subdomain}.#{Rails.application.secrets.zetatango_domain}", @lending_partner.admin_vanity_url
  end

  test 'Lending partner admin vanity url does not perform a lookup to zetatango' do
    @lending_partner.admin_vanity_url
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@lending_partner.id}", times: 0
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@lending_partner.subdomain}", times: 0
  end

  test 'Endorsing partner has correct admin vanity url' do
    stub_partner_lookup_api(@lending_partner)
    assert_equal "admin.#{@lending_partner.subdomain}.#{Rails.application.secrets.zetatango_domain}", @endorsing_partner.admin_vanity_url
  end

  test 'Endorsing partner admin vanity url does perform a lookup to zetatango for lending partner vanity' do
    stub_partner_lookup_api(@lending_partner)
    @endorsing_partner.admin_vanity_url
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@lending_partner.id}", times: 1
  end

  test 'Partner with nil theme_name and theme_css_url is valid' do
    partner = create :partner, theme_name: nil, theme_css_url: nil
    assert partner.valid?
  end

  test 'Partner attributes can be accessed by class as an array' do
    assert_instance_of Array, @lending_partner.attributes
  end

  test 'Partner attribute can be accessed by instance as an array' do
    assert_instance_of Array, Partner.attributes
  end
end
