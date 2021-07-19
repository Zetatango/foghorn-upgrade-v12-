# frozen_string_literal: true

require_relative '../test_helper'
require_relative 'seeds'

module WCAFlowSeed
  include Seeds

  NUM_RECEIPTS = 700

  def upload_cvs
    puts '', 'Preconditions:', ''
    merchant = post_merchants(sample_merchant)
    put_campaign_merchant(campaign_id: 'cp_LyZiiocx15ud2HMb', merchant_id: merchant[:id])

    post_user_register(sample_user(merchant[:id]))

    receipts = []
    NUM_RECEIPTS.times do |i|
      cash = 100
      credit = 0
      debit = 0
      refunds = 0
      chargebacks = 0
      fee = [-(cash + credit + debit + refunds + chargebacks) * 0.03.round(2), 0].min

      receipts.push(
        currency: 'CAD',
        record_date: (30 + i).days.ago.strftime('%F'),
        settlement_batch_id: 'string',
        cash_sales_amount: cash,
        credit_sales_amount: credit,
        debit_sales_amount: debit,
        refunds_amount: refunds,
        chargebacks_amount: chargebacks,
        fees_amount: fee
      )
    end

    payload = { receipts: receipts }

    post_merchant_receipt({ merchant_guid: merchant[:id] }, payload)

    financing_offers = []
    i = 0
    while financing_offers.empty? && i < 10
      puts "\u{3030}Polling for offer..."
      financing_offers = get_financing_offers(merchant_guid: merchant[:id])
      i += 1
      sleep 3
    end
    # refute_empty financing_offers
    selected_offer = financing_offers.first
    put_financing_offer_approve(id: selected_offer[:id])
    puts "\u{2714} Sucessfully loaded preconditions"
  end

  def sample_merchant
    {
      partner_merchant_id: '12345678',
      business_num: 'tester0',
      incorporated_in: 'AB',
      name: 'Nacho Fuenzalida',
      email: 'e2e@example.com',
      country: 'Canada',
      postal_code: 'H0H0H0',
      address_line_1: '35 Fitzgerald',
      city: 'Ottawa',
      state_province: 'ON',
      onboarding: true
    }
  end

  def sample_user(merchant_guid)
    {
      partner_guid: 'p_7J9FJv6qpnG8Q8E2',
      merchant_guid: merchant_guid,
      idp_guid: 'ip_atAJheEg8xpxbq9X',
      username: 'e2e@example.com'
    }
  end
end
