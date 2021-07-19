# frozen_string_literal: true

require_relative 'test_helper'

class BillMarketFlowTest < CapybaraSetup
  setup do
    common_flow_setup
    post_create_supplier(@ft.create_supplier_payload)
    @flow = BillMarketFlow.new(fixtures: @ft, token: @access_token, flinks_flow: false)
  end

  test 'Bill Market Flow' do
    puts '', 'BillMarket flow:', ''
    @flow.start_application

    uw_name = 'ario-uw'
    uw_email = 'ario-uw@arioplatform.com'
    uw_pwd = 'P4$$w0rdP4$$w0rd1'
    uw_attributes = %w[underwriter]

    invite_and_accept_partner_admin(uw_name, uw_email, uw_pwd, uw_attributes)
    navigate_to_merchant
    verify_bank_account

    @flow.continue_application
  end
end
