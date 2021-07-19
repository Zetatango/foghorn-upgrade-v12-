# frozen_string_literal: true

require 'test_helper'

class DemoWcaFlowTest < ActionDispatch::IntegrationTest
  include WCAFlowSeed

  setup do
    @partner_id = 'p_7J9FJv6qpnG8Q8E2'
    @access_token = access_token_after_sandbox_reset
    @flinks_flow = false
    load_preconditions(:upload_cvs)
  end

  test 'WCA Flow' do
    puts '', 'Demo WCA Flow:', ''
    #   "Select Advance"
    #   For some reason this load merchants series of calls is made multiple times in a row throughout this flow
    #   and after the first time the values from it are not used. should probably be looked at/corrected in the code
    #   On load =>                              ***LOAD_MERCHANTS***
    merchant_id, offers = load_merchants
    refute_empty offers

    puts "\u{2714} 1) Select Advance"
    offer_id = offers[0][:id]
    selected_offer_id = offers[0][:variable][:id]
    advance_amount = offers[0][:variable][:default_adv_amount]
    remittance_rate = offers[0][:variable][:default_remit_rate]

    #   GET fee for application
    fee = get_financing_fee(offer_id, advance_amount: advance_amount, remittance_rate: remittance_rate)[:fee]

    #   "Review and confirm":
    #   On load =>                            POST /api/financing/applications
    application = post_financing_application(merchant_id: merchant_id,
                                             offer_id: offer_id,
                                             selected_offer_id: selected_offer_id,
                                             advance_amount: advance_amount,
                                             remittance_rate: remittance_rate,
                                             fee: fee)
    refute_empty application
    puts "\u{2714} 2) Review and Confirm"

    #   "Sign the agreement":
    #   TODO click "I Accept":
    #     - redirect to idp.   =>                 GET "/oauth/authorize"
    #     - redirect back/sign =>                 nothing
    puts "\u{2714} 3) Sign the Agreement"

    if @flinks_flow
      #      - POST /api/flinks/logins
      flinks_login = post_flinks_authorize
      if flinks_login[:SecurityChallenges].present?
        flinks_login = post_flinks_authorize_2fa(request_id: flinks_login[:RequestId],
                                                 security_question: flinks_login[:SecurityChallenges].first[:Prompt])
      end
      login_id = flinks_login[:Login][:Id]
      flinks_response = post_flinks_login(owner_guid: merchant_id,
                                          login_id: login_id,
                                          institution_name: flinks_institution)
      #      - poll ztt to know if flinks is done: GET /flinks/logins/:request_id
      polling_flinks = flinks_response[:state] == 'pending'
      i = 0
      while polling_flinks && i < 10
        response = get_flinks_login(request_id: flinks_response[:request_id])
        puts "\u{3030}Polling for flinks_login..."
        polling_flinks = response[:state] == 'pending'
        i += 1
        sleep 3
      end
    else
      ba = post_common_bank_accounts(owner_guid: merchant_id)
      refute_empty ba
    end

    #   "Set up banking, get the money!":
    #               =>                            GET "/api/bank_accounts"
    bank_accounts = get_bank_accounts(owner_guid: merchant_id)
    refute_empty bank_accounts
    puts "\u{2714} 4) Set Up Banking"

    # #   Click "Use this account" =>
    # #                            =>           GET "/api/pad_agreement/fap_N8uUKmjKe2U2SRCp" (2 times)
    application_id = application[:id]
    # agreement = get_financing_pad_agreement(application_id)
    # refute_empty agreement
    puts "\u{2714} 5) Use This Account"

    #   Click "I Accept"         =>
    #                            =>           PUT "/merchants/fap_N8uUKmjKe2U2SRCp/accept_app"
    bank_account_id = bank_accounts[0][:id]
    response = put_financing_accept_agreement(application_id, selected_account_id: bank_account_id)
    refute_empty response
    puts "\u{2714} 6) Accept Agreement"
  end

  def load_merchants
    # GET "/api/merchants/m_unused"
    merchants = get_merchants
    merchant_id = merchants[0][:id] if merchants[0].present?

    # GET "/api/merchants/m_unused"
    get_merchants

    # GET "/api/financing/offers?merchant_id=m_BtGx6Yfj7gYLwG7q"
    offers = get_financing_offers(merchant_id: merchant_id)

    # GET "/api/financing/offers"
    get_financing_offers

    # GET "/api/financing/applications?merchant_id=m_BtGx6Yfj7gYLwG7q"
    get_financing_applications(merchant_id: merchant_id)

    # GET "/api/financing/applications"
    get_financing_applications

    # GET "/api/financing/advances?merchant_id=m_BtGx6Yfj7gYLwG7q"
    get_financing_advances(merchant_id: merchant_id)

    # GET "/api/financing/advances"
    get_financing_advances

    [merchant_id, offers]
  end

  def flinks_institution
    Rails.application.secrets.flinks[:flinks_uri]
  end
end
