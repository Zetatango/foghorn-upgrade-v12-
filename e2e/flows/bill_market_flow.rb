# frozen_string_literal: true

require_relative '../test_helper'

class BillMarketFlow
  include RequestsHelper
  include AccessTokenHelper
  include DatabaseSetupHelper
  include FixturesHelper
  include ZetatangoApi
  include RoadrunnerApi
  include CommonFlowHelper

  def initialize(options = {})
    @ft = options[:fixtures]
    @access_token = options[:token]
    @flinks_flow = options[:flinks_flow]
  end

  # rubocop:disable Metrics/AbcSize
  def start_application
    require 'test/unit'
    extend Test::Unit::Assertions

    @merchant = onboard_and_certification

    puts '', 'Pay a Supplier:', ''
    # 1) Choose a supplier:
    #   - GET /lending/offers and selects the pay a supplier offer
    assert_offers_and_select(@merchant[:id], 'suppliers')
    #   - GET /suppliers
    suppliers = get_suppliers
    refute_empty suppliers
    #   - user selects supplier (store guid on memory as payee_id)
    selected_supplier = suppliers.sample
    @payee_id = selected_supplier[:id]
    refute_empty @payee_id
    puts "\u{2714} 1) Choose a supplier"

    # 2) Set the amount:
    #   - GET /lending/offers and selects first
    lending_offer = assert_offers_and_select(@merchant[:id], 'suppliers')

    principal_amount = lending_offer[:max_principal_amount].to_f - lending_offer[:used_amount].to_f
    # pick the first term (60 day term)
    loan_term_id = lending_offer[:available_terms][0][:id]
    fee = get_lending_offer_fee(id: lending_offer[:id],
                                principal_amount: principal_amount,
                                loan_term_id: loan_term_id)
    refute_empty fee
    #   - user clicks 'Next':
    #      - POST /lending/applications

    @application = post_lending_application(merchant_id: @merchant[:id],
                                            offer_id: lending_offer[:id],
                                            interest_amount: fee[:fee],
                                            principal_amount: principal_amount,
                                            loan_term_id: loan_term_id,
                                            payee_id: @payee_id)
    #      - store application response to display later and guid for later calls
    if @flinks_flow
      FlinksFlow.new(fixtures: @ft, token: @access_token, merchant: @merchant).main_flow
      #      - GET /common/bank_accounts
      bank_accounts = get_bank_accounts(owner_guid: @merchant[:id])
      refute_empty bank_accounts
      #      - user selects account
      merchant_for_selected_bank_account = post_merchant_select_bank_account({ merchant_guid: @merchant[:id] }, bank_account_id: bank_accounts.first[:id])
      assert_equal merchant_for_selected_bank_account[:selected_bank_account], bank_accounts.first[:id]
    else
      #      - create bank account manually
      ba = post_merchant_create_bank_account(merchant_guid: @merchant[:id])
      refute_empty ba

      merchant_for_selected_bank_account = get_merchant(merchant_guid: @merchant[:id])
      assert_equal merchant_for_selected_bank_account[:selected_bank_account], ba[:id]
    end

    puts "\u{2714} 2) Set the amount"
  end
  # rubocop:enable Metrics/AbcSize

  def continue_application
    # 3) Review
    #   - GET /lending/offers and selects first
    assert_offers_and_select(@merchant[:id], 'suppliers')
    #   - display created application (assert values existance)
    refute_empty @application

    #   - user clicks 'Next'
    #      - render the terms - make sure they are not empty
    pad_agreement = @application[:terms]
    refute_empty pad_agreement

    #   - user clicks 'Sign'
    #      - POST /roadrunner/reauth flow
    #      - PUT /lending/applications/:id/accept (passing variables stored in memory)
    put_lending_application_accept(id: @application[:id],
                                   ubl_terms_agreed: true,
                                   pad_terms_agreed: true,
                                   payee_id: @payee_id)
    puts "\u{2714} 3) Review"

    # 4) Supplier is paid:
    # 0) Wait for KYC verification
    polling_kyc_verification = true
    i = 0
    while polling_kyc_verification && i < 60
      puts "\u{3030}Waiting for KYC verification..."
      applications = get_lending_applications(merchant_id: @merchant[:id])
      polling_kyc_verification = applications.first[:state] == 'kyc_verifying'
      i += 1
      sleep(10)
    end
    refute polling_kyc_verification

    #   - GET /lending/offers and selects first
    assert_offers_and_select(@merchant[:id], 'suppliers')
    #   - GET /lending/ubls
    #   - user clicks 'Show Repayments'
    #      - GET /lending/repayments/{id}
    polling_ubl = true
    i = 0
    while polling_ubl && i < 15
      puts "\u{3030}Waiting for UBL pending status..."
      ubls = get_lending_ubls(merchant_id: @merchant[:id])
      polling_ubl = ubls.length.positive? && ubls.first['state'] == 'repaying'
      i += 1
      sleep(3)
    end
    refute polling_ubl

    puts "\u{2714} 4) Supplier is paid"
  end
end
