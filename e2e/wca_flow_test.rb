# frozen_string_literal: true

require_relative 'test_helper'

class WcaFlowTest < CapybaraSetup
  setup do
    common_flow_setup
    @flow = WcaFlow.new(fixtures: @ft, token: @access_token, flinks_flow: false)
  end

  #
  # The first time an internal page is rendered during E2E the assets for the page are compiled. This takes a random
  # amount of time and more often than not Selenium times out on the request as a result.
  #
  # This only happens on the first request. To address this issue the before handler will make a request and capture
  # the read time out error before executing the remainder of the tests in this collection of tests.
  #

  test 'WCA Flow' do
    puts '', 'WCA Flow:', ''
    @flow.start_application

    idp_sign_in_page = heroku? ? 'https://id.ztt-auth.e2e.zetatango.com/users/sign_in' : 'http://id.ztt-auth.zetatango.local:3002/users/sign_in'

    if heroku?
      csr_email = 'e2e.csr@zetatango.com'
      csr_pwd = 'NMYp7NG2GZS7!cHf'
      uw_email = 'e2e.uw@zetatango.com'
      uw_pwd = 'NMYp7NG2GZS7!cHf'

      # invite_and_accept_partner_admin(csr_name, csr_email, csr_pwd, csr_attributes)
      puts "\u{2716} CSR accepted invite and created account -- test skipped"

      sign_in_to_partner_portal(csr_email, csr_pwd, idp_sign_in_page)
      puts "\u{2714} Visiting partner portal as a CSR, user: #{csr_email}"

      navigate_to_merchant
      verify_bank_account

      end_data_collection
      puts "\u{2714} End WCA application data collection"

      confirm_adjudication
      puts "\u{2714} CSR recorded decision"

      partner_log_out
      puts "\u{2714} CSR logged out"

      Capybara.reset_sessions!

      # invite_and_accept_partner_admin(csr_name, csr_email, csr_pwd, csr_attributes)
      puts "\u{2716} Underwriter accepted invite and created account -- test skipped"

      sign_in_to_partner_portal(uw_email, uw_pwd, idp_sign_in_page, :default)
      puts "\u{2714} Visiting partner portal as a UW, user: #{uw_email}"

    else
      puts '', 'Lender approval - create CSR and UW:', ''

      csr_attributes = %w[customer_service]

      # TODO : Put these somewhere ...
      csr_name = 'ario-csr'
      csr_email = 'ario-csr@arioplatform.com'
      csr_pwd = 'P4$$w0rdP4$$w0rd1'

      invite_and_accept_partner_admin(csr_name, csr_email, csr_pwd, csr_attributes)
      puts "\u{2714} CSR accepted invite and created account"

      navigate_to_merchant
      verify_bank_account

      end_data_collection
      puts "\u{2714} End WCA application data collection"

      confirm_adjudication
      puts "\u{2714} CSR recorded decision"

      partner_log_out
      puts "\u{2714} CSR logged out"

      Capybara.reset_sessions!

      uw_name = 'ario-underwriter'
      uw_email = 'ario-underwriter@arioplatform.com'
      uw_pwd = 'P4$$w0rdP4$$w0rd1'
      uw_attributes = %w[underwriter]

      invite_and_accept_partner_admin(uw_name, uw_email, uw_pwd, uw_attributes, :default)
      puts "\u{2714} Underwriter accepted invite and created account"
    end

    navigate_to_merchant

    # common steps rubocop moved out
    approve_adjudication
    puts "\u{2714} Underwriter recorded decision"

    assert_selector 'tr', text: 'WCA Config' do |element|
      assert_match 'Approved', element.text
    end

    puts "\u{2714} WCA Application approved"

    puts '', 'Log in and out of multiple sessions (partner portal):', ''

    # Test multiple session log in and log out
    sign_in_to_partner_portal(uw_email, uw_pwd, idp_sign_in_page, :other)
    puts "\u{2714} Logged into a second session while first session was still active"

    # log out of first (default) session
    Capybara.using_session(:default) do
      partner_log_out
      assert_match 'Welcome to Ario Platform', page.body
      puts "\u{2714} Logged out of first session successfully"
    end

    Capybara.using_session(:other) do
      # second (other) session was invalidated by logging out of first (default) session
      click_link 'BillMarket Campaign'
      assert_match 'You are not authorized', page.body
      puts "\u{2714} Second session was invalidated by logging out of first session"

      # logging back into and out of second (other) session works as intended
      sign_in_to_partner_portal(uw_email, uw_pwd, idp_sign_in_page, :other)
      puts "\u{2714} Successfully logged back into second session"
      Capybara.current_session.current_window.resize_to(1400, 1400)
      partner_log_out
      assert_match 'Welcome to Ario Platform', page.body
      puts "\u{2714} Successfully logged out of second session"
    end

    puts '', 'Password reset with multiple sessions (partner portal):', ''

    new_password = 'NyuuPaasuwaado111!!!'

    Capybara.using_session(:default) do
      # log into a session
      sign_in_to_partner_portal(uw_email, uw_pwd, idp_sign_in_page, :default)
      puts "\u{2714} Logged into first session"
    end

    Capybara.using_session(:no_session) do
      # reset password from another session which is not logged in
      visit idp_sign_in_page
      click_on 'I forgot my password'
      fill_in 'Email', with: uw_email
      click_on 'Submit'
      puts "\u{2714} Submitted password reset form from second (not logged in) session"

      # click link in reset password email
      follow_link_from_last_email
      fill_in 'New password', with: new_password
      click_on 'Set password'

      assert_match 'Campaigns', page.body
      puts "\u{2714} Password was reset from second session and is now logged in"
    end

    Capybara.using_session(:default) do
      # first session should have been logged out
      click_link 'BillMarket Campaign'
      assert_match 'You are not authorized to access', page.body
      puts "\u{2714} First session was invalidated by password reset from second session"
      sign_in_to_partner_portal(uw_email, new_password, idp_sign_in_page, :default)
      puts "\u{2714} Logged back into first session with new password"
    end

    @flow.continue_application
  end

  def sign_in_to_partner_portal(email, pwd, idp_sign_in_page, session = :default)
    visit_user_idp_and_sign_in(email, pwd, idp_sign_in_page, session)

    assert_match 'Campaigns', page.body
    puts "\u{2714} Logged in to Partner Portal - with user: #{email}"
  end

  def end_data_collection
    click_on 'Underwriting'

    within_row('WCA Config') do
      find('i.fa-arrow-right').click
    end

    page.accept_alert
  end

  def confirm_adjudication
    navigate_to_adjudication

    fill_in 'lending_adjudication_decision_lending_adjudication_max_amount', with: '25000'

    fill_in 'lending_adjudication_decision_lending_adjudication_product_terms_attributes_0_fee_factor', with: '0.1'
    fill_in 'lending_adjudication_decision_lending_adjudication_product_terms_attributes_1_fee_factor', with: '0.12'

    fill_in 'lending_adjudication_decision_notes', with: 'Approved'

    click_on 'Record decision'
    assert_match 'You are about to confirm this application for WCA Config', page.first('div#confirmationModal').text
    assert_match '$25,000.00 for 270 days at 0.1, 360 days at 0.12', page.first('div#confirmationModal').text

    click_on 'Confirm'
  end

  def approve_adjudication
    navigate_to_adjudication

    fill_in 'lending_adjudication_decision_notes', with: 'Approved'

    click_on 'Record decision'
    assert_match 'You are about to approve this application for WCA Config', page.first('div#confirmationModal').text
    assert_match '$25,000.00 for 270 days at 0.1, 360 days at 0.12', page.first('div#confirmationModal').text

    click_on 'Approve'
  end

  def navigate_to_adjudication
    click_on 'Underwriting'

    within_row('WCA Config') do
      find('i.fa-pencil').click
    end
  end
end
