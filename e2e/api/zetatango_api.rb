# frozen_string_literal: true

# rubocop:disable Metrics/ModuleLength
module ZetatangoApi
  def get_merchants(overrides = {})
    endpoint = "#{core_url}/api/merchants"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_merchant(overrides = {})
    endpoint = "#{core_url}/api/merchants/#{overrides[:merchant_guid]}"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def post_merchant_queries(overrides = {})
    endpoint = "#{core_url}/api/merchant_queries"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_merchant_queries_select(overrides = {})
    endpoint = "#{core_url}/api/merchant_queries/#{overrides[:query_id]}/select"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_create_applicant(overrides = {})
    endpoint = "#{core_url}/api/applicants"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_authenticate_applicant(overrides = {})
    endpoint = "#{core_url}/api/applicants/#{overrides[:applicant_guid]}/authenticate"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def put_authenticate_applicant(overrides = {})
    endpoint = "#{core_url}/api/applicants/#{overrides[:applicant_guid]}/authenticate"
    payload = {}.merge(overrides)

    execute_request(:put, endpoint, auth_headers, payload)
  end

  def post_create_supplier(overrides = {})
    endpoint = "#{core_url}/api/suppliers"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_lending_applications(overrides = {})
    endpoint = "#{core_url}/api/lending/applications"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def put_lending_application_accept(overrides = {})
    endpoint = "#{core_url}/api/lending/applications/#{overrides[:id]}/accept"
    payload = {
      ubl_terms_agreed: true,
      pad_terms_agreed: true,
      ip_address: '192.168.0.0'
    }.merge(overrides)

    execute_request(:put, endpoint, auth_headers, payload)
  end

  def get_lending_application_terms(overrides = {})
    endpoint = "#{core_url}/api//lending/applications/#{overrides[:id]}/terms"
    payload = {}

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_lending_application_pad_agreement(overrides = {})
    endpoint = "#{core_url}/api//lending/applications/#{overrides[:id]}/pad_agreement"
    payload = {}

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def post_common_bank_accounts(overrides = {})
    endpoint = "#{core_url}/api/common/bank_accounts"
    payload = {
      currency: 'CAD',
      institution_number: '004',
      transit_number: '05002',
      account_number: '5255348'
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_bank_accounts_stub(_overrides = {})
    [
      {
        id: 'ba_HLD8shTz9mAMKYvE',
        owner_guid: 'm_ELjedupS1T21TjUL',
        name: 'Main bank account',
        currency: 'CAD',
        institution_number: '004',
        transit_number: '05002',
        account_number: '5255348'
      }
    ]
  end

  def get_bank_accounts(overrides = {})
    endpoint = "#{core_url}/api/common/bank_accounts"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_flinks_login(overrides = {})
    endpoint = "#{core_url}/api/flinks/logins/#{overrides[:request_id]}"
    payload = {}

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def post_flinks_login(overrides = {})
    endpoint = "#{core_url}/api/flinks/logins"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_lending_application(overrides = {})
    endpoint = "#{core_url}/api/lending/applications"
    payload = {
      principal_amount: 0,
      apr: 1.17,
      repayment_schedule: 'daily',
      interest_amount: 0,
      repayment_amount: 0,
      loan_term_id: '0'
    }.merge(overrides)
    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_suppliers(_overrides = {})
    endpoint = "#{core_url}/api/suppliers"
    payload = {}

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_lending_offers(overrides = {})
    endpoint = "#{core_url}/api/lending/offers"
    payload = {}.merge(overrides)
    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_lending_offer_fee(overrides = {})
    endpoint = "#{core_url}/api/lending/offers/#{overrides[:id]}/fee"
    payload = {
    }.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_lending_offer(options = {})
    endpoint = "#{core_url}/api/lending/offers/#{options[:id]}"
    payload = {}

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def put_lending_offer_approve(overrides = {})
    endpoint = "#{core_url}/api/lending/offers/#{overrides[:id]}/approve"
    payload = {}

    execute_request(:put, endpoint, auth_headers, payload)
  end

  def get_lending_ubls(overrides = {})
    endpoint = "#{core_url}/api/lending/ubls"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_lending_repayments(overrides = {})
    endpoint = "#{core_url}/api/lending/repayments"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_financing_offers(overrides = {})
    endpoint = "#{core_url}/api/financing/offers"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def put_financing_offer_approve(overrides = {})
    endpoint = "#{core_url}/api/financing/offers/#{overrides[:id]}/approve"
    payload = {}

    execute_request(:put, endpoint, auth_headers, payload)
  end

  def get_financing_applications(overrides = {})
    endpoint = "#{core_url}/api/financing/applications"
    payload = {
      advance_amount: 0,
      remittance_rate: 0,
      fee: 0
    }.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_lending_application_fee(overrides = {})
    endpoint = "#{core_url}/api/lending/application/#{overrides[:id]}/fee"
    payload = {
    }.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_financing_advances(overrides = {})
    endpoint = "#{core_url}/api/financing/advances"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def get_financing_fee(offer_id, overrides = {})
    endpoint = "#{core_url}/api/financing/offers/#{offer_id}/fee"
    payload = {}.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def post_financing_application(overrides = {})
    endpoint = "#{core_url}/api/financing/applications"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_financing_pad_agreement(application_id)
    endpoint = "#{core_url}/api/financing/applications/#{application_id}/pad_agreement"
    payload = {}

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def put_financing_accept_agreement(application_id, overrides = {})
    endpoint = "#{core_url}/api/financing/applications/#{application_id}/accept"
    payload = {
      pad_terms_agreed: true,
      wca_terms_agreed: true,
      ip_address: '192.168.0.0'
    }.merge(overrides)

    execute_request(:put, endpoint, auth_headers, payload)
  end

  def post_merchants(overrides = {})
    endpoint = "#{core_url}/api/merchants"
    payload = {}.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_merchant_receipt(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/receipts"
    payload = {
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_business_partner_application(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/business_partner"
    payload = {
    }.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def post_business_partner_merchant(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/business_partner_merchant"
    payload = {
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_business_partner_merchants(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/business_partner_merchant"
    payload = {
    }.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def post_business_partner_application(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/business_partner"
    payload = {
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_business_partner_merchant_invoice(options = {}, overrides = {})
    endpoint = "#{core_url}/api/business_partner_merchants/#{options[:business_partner_merchant_guid]}/invoice"
    payload = {
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def get_tracked_object_events(options = {}, overrides = {})
    endpoint = "#{core_url}/api/tracked_objects/#{options[:tracked_object_guid]}/tracked_object_events"
    payload = {
    }.merge(overrides)

    execute_request(:get, endpoint, auth_headers, payload)
  end

  def put_campaign_merchant(overrides = {})
    endpoint = "#{core_url}/api/financing/campaigns/#{overrides[:campaign_id]}/merchants/#{overrides[:merchant_id]}"
    payload = {}

    execute_request(:put, endpoint, auth_headers, payload)
  end

  def post_merchant_create_bank_account(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/create_bank_account"
    payload = {
      institution_number: '004',
      transit_number: '05002',
      account_number: '5255348'
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_merchant_select_bank_account(options = {}, overrides = {})
    endpoint = "#{core_url}/api/merchants/#{options[:merchant_guid]}/select_bank_account"
    payload = {
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def post_file_transfer(payload)
    endpoint = "#{core_url}/api/file_transfer"

    execute_request(:post, endpoint, auth_headers, payload)
  end

  def core_url
    Rails.configuration.e2e_zetatango_url
  end

  def internal_url
    "#{core_url}/internal"
  end

  def file_upload_url
    "#{core_url}/api/file_transfer"
  end
end
# rubocop:enable Metrics/ModuleLength
