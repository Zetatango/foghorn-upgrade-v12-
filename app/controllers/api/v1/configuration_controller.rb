# frozen_string_literal: true

class Api::V1::ConfigurationController < ApplicationController
  include ApplicationHelper

  helper_method :embed_intercom?

  #
  # Authorization: will automatically call Ability.authorize!
  #

  def index
    render json: {
      address_autocomplete_enabled: address_autocomplete_enabled,
      allowed_file_types: allowed_file_types,
      angular_bugsnag_api_key: angular_bugsnag_api_key,
      app_version: app_version,
      ario_domain_suffix: ario_domain_suffix,
      business_partner_id_blacklist: business_partner_id_blacklist,
      business_partner_enabled: business_partner_enabled,
      calendly_url: calendly_url,
      covid_disable_financing: covid_disable_financing,
      direct_debit_enabled: direct_debit_enabled,
      direct_debit_max_amount: direct_debit_max_amount,
      direct_debit_min_amount: direct_debit_min_amount,
      disable_invoice_ui: disable_invoice_ui,
      disable_wca_card: disable_wca_card,
      enhanced_branding_enabled: enhanced_branding_enabled,
      file_encryption_type: file_encryption_type,
      flinks: {
        flinks_url: flinks_url,
        flinks_creds: flinks_creds,
        flinks_opts: flinks_opts,
        flinks_uri: flinks_uri,
        max_polling: flinks_max_polling,
        poll_interval: flinks_poll_interval
      },
      insights_api_enabled: insights_api_enabled,
      insights_enabled: insights_enabled,
      intercom_enabled: intercom_enabled,
      invoice_handling_enabled: invoice_handling_enabled,
      jurisdiction_enabled: jurisdiction_enabled,
      loc_enabled: loc_enabled,
      marketing_calendly_url: marketing_calendly_url,
      marketing_enabled: marketing_enabled,
      marketing_sample_blog_url: marketing_sample_blog_url,
      max_file_size: max_file_size,
      max_uploads: max_uploads,
      merchant_self_edit_enabled: merchant_self_edit_enabled,
      pre_authorized_financing_enabled: pre_authorized_financing,
      quickbooks_connect_enabled: quickbooks_connect_enabled,
      sales_calendly_url: sales_calendly_url,
      schedule_marketing_campaign_enabled: schedule_marketing_campaign_enabled,
      weekly_repayment_enabled: weekly_repayment_enabled
    }, status: :ok
  end

  def version
    render json: { app_version: app_version }, status: :ok
  end

  private

  def address_autocomplete_enabled
    google_places_api_key.present?
  end

  def allowed_file_types
    Rails.application.secrets.allowed_file_types || ''
  end

  def angular_bugsnag_api_key
    Rails.application.secrets.angular_bugsnag_api_key || ''
  end

  def app_version
    Rails.application.secrets.app_version || ''
  end

  def ario_domain_suffix
    Rails.application.secrets.ario_domain_suffix || ''
  end

  def business_partner_enabled
    Rails.application.secrets.business_partner_enabled
  end

  def business_partner_id_blacklist
    Rails.application.secrets.partner_id_blacklist || ''
  end

  def calendly_url
    Rails.application.secrets.calendly_url || ''
  end

  def covid_disable_financing
    Rails.application.secrets.covid_disable_financing
  end

  def direct_debit_enabled
    Rails.application.secrets.direct_debit_enabled
  end

  def direct_debit_max_amount
    Rails.application.secrets.direct_debit_max_amount
  end

  def direct_debit_min_amount
    Rails.application.secrets.direct_debit_min_amount
  end

  def disable_invoice_ui
    Rails.application.secrets.disable_invoice_ui
  end

  def disable_wca_card
    Rails.application.secrets.disable_wca_card
  end

  def enhanced_branding_enabled
    Rails.application.secrets.enhanced_branding_enabled
  end

  def file_encryption_type
    Rails.application.secrets.file_encryption_type || ''
  end

  def flinks_url
    Rails.application.secrets.flinks[:flinks_url] || ''
  end

  def flinks_creds
    Rails.application.secrets.flinks[:flinks_creds] || ''
  end

  def flinks_opts
    Rails.application.secrets.flinks[:flinks_opts] || ''
  end

  def flinks_uri
    Rails.application.secrets.flinks[:flinks_uri] || ''
  end

  def flinks_max_polling
    Rails.application.secrets.flinks[:flinks_max_polling] || 0
  end

  def flinks_poll_interval
    Rails.application.secrets.flinks[:flinks_poll_interval] || 0
  end

  def insights_api_enabled
    Rails.application.secrets.insights_api_enabled
  end

  def insights_enabled
    Rails.application.secrets.insights_enabled
  end

  def intercom_enabled
    embed_intercom?
  end

  def invoice_handling_enabled
    Rails.application.secrets.invoice_handling_enabled
  end

  def jurisdiction_enabled
    Rails.application.secrets.jurisdiction_enabled || false
  end

  def loc_enabled
    Rails.application.secrets.loc_enabled || false
  end

  def marketing_calendly_url
    Rails.application.secrets.marketing_calendly_url || ''
  end

  def marketing_enabled
    Rails.application.secrets.marketing_enabled
  end

  def marketing_sample_blog_url
    Rails.application.secrets.marketing_sample_blog_url || ''
  end

  def max_file_size
    Rails.application.secrets.max_file_size || 0
  end

  def max_uploads
    Rails.application.secrets.max_uploads || 1
  end

  def merchant_self_edit_enabled
    Rails.application.secrets.merchant_self_edit_enabled || false
  end

  def pre_authorized_financing
    Rails.application.secrets.pre_authorized_financing_enabled
  end

  def quickbooks_connect_enabled
    Rails.application.secrets.quickbooks_connect_enabled
  end

  def sales_calendly_url
    Rails.application.secrets.sales_calendly_url || ''
  end

  def schedule_marketing_campaign_enabled
    Rails.application.secrets.schedule_marketing_campaign_enabled || false
  end

  def weekly_repayment_enabled
    Rails.application.secrets.weekly_frequency_enabled
  end
end
