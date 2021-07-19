# frozen_string_literal: true

require 'rest_client'

class ZttClient
  class ZttClientException < RuntimeError; end
  class ApiAccessTokenException < ZttClientException; end

  def initialize(api_access_token)
    @api_access_token = api_access_token

    raise ApiAccessTokenException, 'Empty access token' unless valid_token?

    configure_api_access
  end

  def agreements_api
    @_agreements_api_instance
  end

  def pdfs_api
    @_pdf_api_instance
  end

  def tracked_objects_api
    @_tracked_object_events_api_instance
  end

  def business_partner_invoices_api
    @_business_partner_invoices_api_instance
  end

  def business_partner_merchants_api
    @_business_partner_merchants_api_instance
  end

  def direct_payments_api
    @_direct_payments_api_instance
  end

  def leads_api
    @_leads_api_instance
  end

  def merchants_api
    @_merchants_api_instance
  end

  def merchant_documents_api
    @_merchant_documents_api_instance
  end

  def financing_api
    @_financing_api_instance
  end

  def common_api
    @_common_api_instance
  end

  def lending_api
    @_lending_instance
  end

  def guarantor_info_api
    @_guarantor_info_api_instance
  end

  def transactions_api
    @_transactions_api
  end

  def social_connections_api
    @_social_connections_api
  end

  def marketing_api
    @_marketing_api_instance
  end

  # :nocov:
  def applicants_api
    @_applicants_api_instance
  end
  # :nocov:

  # :nocov:
  def suppliers_api
    @_suppliers_api_instance
  end
  # :nocov:

  private

  def valid_token?
    @api_access_token.present?
  end

  def configure_api_access
    SwaggerClient.configure do |c|
      [
        c.debugging = false, c.host = Rails.application.secrets.ztt_api[:base_url].to_s,
        c.access_token = @api_access_token
      ]
    end

    api_client = SwaggerClient::ApiClient.new
    api_client.config.scheme = 'http'
    # override for production with https
    api_client.config.scheme = 'https' if Rails.env.production?

    # should have already been set
    api_client.config.debugging = true unless Rails.env.production?

    @_financing_api_instance = SwaggerClient::FinancingApi.new(api_client)
    @_common_api_instance = SwaggerClient::CommonApi.new(api_client)
    @_merchants_api_instance = SwaggerClient::MerchantsApi.new(api_client)
    @_merchant_documents_api_instance = SwaggerClient::MerchantDocumentsApi.new(api_client)
    @_leads_api_instance = SwaggerClient::LeadsApi.new(api_client)
    @_lending_instance = SwaggerClient::LendingApi.new(api_client)
    @_guarantor_info_api_instance = SwaggerClient::GuarantorInfosApi.new(api_client)
    @_applicants_api_instance = SwaggerClient::ApplicantsApi.new(api_client)
    @_suppliers_api_instance = SwaggerClient::SuppliersApi.new(api_client)
    @_direct_payments_api_instance = SwaggerClient::DirectPaymentsApi.new(api_client)
    @_business_partner_merchants_api_instance = SwaggerClient::BusinessPartnerMerchantsApi.new(api_client)
    @_business_partner_invoices_api_instance = SwaggerClient::BusinessPartnerInvoicesApi.new(api_client)
    @_tracked_object_events_api_instance = SwaggerClient::TrackedObjectsApi.new(api_client)
    @_agreements_api_instance = SwaggerClient::AgreementsApi.new(api_client)
    @_transactions_api = SwaggerClient::TransactionsApi.new(api_client)
    @_social_connections_api = SwaggerClient::SocialConnectionsApi.new(api_client)
    @_marketing_api_instance = SwaggerClient::MarketingApi.new(api_client)
    @_pdf_api_instance = SwaggerClient::PdfApi.new(api_client)
  end
end
