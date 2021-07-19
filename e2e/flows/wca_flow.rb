# frozen_string_literal: true

require_relative '../test_helper'

class WcaFlow
  include RequestsHelper
  include AccessTokenHelper
  include DatabaseSetupHelper
  include FixturesHelper
  include ZetatangoApi
  include RoadrunnerApi
  include CommonFlowHelper
  include PartnerPortalHelper
  include EnvHelper

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

    puts '', 'Apply Now:', ''
    # 1) Choose a supplier:
    #   - GET /lending/offers and select the wca offer
    #
    assert_offers_and_select(@merchant[:id], 'self')

    # 2) Set the amount:
    #   - GET /lending/offers and selects first
    lending_offer = assert_offers_and_select(@merchant[:id], 'self')

    puts "\u{2714} 6) Selected Offer"
    principal_amount = 50_000.00
    # pick the first term (270 day term)
    loan_term_id = lending_offer[:available_terms][0][:id]
    fee = get_lending_offer_fee(id: lending_offer[:id],
                                principal_amount: principal_amount,
                                loan_term_id: loan_term_id)
    refute_empty fee
    #   - user clicks 'Next':
    #      - POST /lending/applications
    puts "\u{2714} 7) Observed Cost of Borrowing"

    app_resp = post_lending_application(merchant_id: @merchant[:id],
                                        offer_id: lending_offer[:id],
                                        interest_amount: fee[:fee],
                                        principal_amount: principal_amount,
                                        loan_term_id: loan_term_id,
                                        payee_id: @merchant[:id])

    refute_empty app_resp

    puts "\u{2714} 8) Created application"
    #  - store application response to display later and guid for later calls
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

    puts "\u{2714} 9) Selected bank account"

    if heroku?
      puts "\u{2716} 10) Tax assessment sent -- test skipped"
    else
      send_tax_assessment(app_resp[:id], @merchant[:id])

      puts "\u{2714} 10) Tax assessment sent"
    end
    applications = get_lending_applications(merchant_id: @merchant[:id])
    refute applications.empty?

    assert_equal applications.first[:state], 'reviewing'
  end
  # rubocop:enable Metrics/AbcSize

  def continue_application
    puts '', 'Apply Now (continued):', ''

    applications = get_lending_applications(merchant_id: @merchant[:id])
    application = applications.first

    refute_empty application[:terms]

    put_lending_application_accept(id: application[:id],
                                   ubl_terms_agreed: true,
                                   pad_terms_agreed: true,
                                   payee_id: @merchant[:guid])

    puts "\u{2714} 11) Review"

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

    applications = get_lending_applications(merchant_id: @merchant[:id])
    assert_equal applications.first[:state], 'completed'

    puts "\u{2714} 12) Complete"
  end
end
