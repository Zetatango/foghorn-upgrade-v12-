# frozen_string_literal: true

require_relative 'test_helper'

class InternalFlowTest < CapybaraSetup
  #
  # The first time an internal page is rendered during E2E the assets for the page are compiled. This takes a random
  # amount of time and more often than not Selenium times out on the request as a result.
  #
  # This only happens on the first request. To address this issue the before handler will make a request and capture
  # the read time out error before executing the remainder of the tests in this collection of tests.
  #

  test 'Manage partner admins' do
    puts '', 'Manage partner administrators:', ''

    name = Faker::Name.name
    email = Faker::Internet.email
    attributes = %w[customer_service underwriter treasury account_management user_management marketing customer_success_advisor]
    attributes_display = %w[underwriter_1 underwriter_2 treasury account_management user_management marketing CSA]

    internal_log_in('e2e-admin@arioplatform.com', ENV.fetch('E2E_ADMIN_PASSWORD'))

    assert_match 'Welcome, E2E Admin!', page.body
    puts "\u{2714} 1) Logged in successfully"

    add_partner_admin(name, email, attributes)

    find_internal_user(name, email)

    assert_match name, page.body
    assert_match email, page.body

    expected_settings = "Partner administrator for Zetatango Test Partner (Attributes: #{attributes_display.map { |x| humanize_with_acronym(x) }.join(', ')})"

    assert_selector 'tr', text: email do |element|
      assert_match expected_settings, element.text
    end

    # TODO : fix this to be able to test with email in the new e2e env in heroku
    if heroku?
      # assert_match 'Welcome to the Ario platform!', last_email
      puts "\u{2716} 2) Added a new partner administrator -- test skipped"
    else
      assert_match 'Welcome to Thinking Capital!', last_email
      puts "\u{2714} 2) Added a new partner administrator"
    end

    find(:xpath, "//tr[contains(.,'#{email}')]/td/a", text: 'Edit').click

    uncheck 'underwriter'
    click_on 'commit'

    attributes_display.delete('underwriter_2')
    expected_settings = "Partner administrator for Zetatango Test Partner (Attributes: #{attributes_display.map { |x| humanize_with_acronym(x) }.join(', ')})"

    find_internal_user(name, email)

    assert_selector 'tr', text: email do |element|
      assert_match expected_settings, element.text
    end
    puts "\u{2714} 3) Updated partner administrator attributes"

    find(:xpath, "//tr[contains(.,'#{email}')]/td/form/input[@value='Disable']").click

    assert_match 'Partner admin was successfully disabled.', page.body
    puts "\u{2714} 4) Disabled partner administrator"

    find_internal_user(name, email)

    find(:xpath, "//tr[contains(.,'#{email}')]/td/form/input[@value='Enable']").click

    assert_match 'Partner admin was successfully enabled.', page.body
    puts "\u{2714} 5) Re-enabled partner administrator"

    find_internal_user(name, email)

    find(:xpath, "//tr[contains(.,'#{email}')]/td/form/input[@value='Reset']").click

    assert_match "The partner admin's password was successfully reset.", page.body

    # TODO : fix this to be able to test with email in the new e2e env in heroku
    if heroku?
      # assert_match 'Password changed', last_email
      puts "\u{2716} 6) Reset partner administrator password -- test skipped"
    else
      assert_match 'Password changed', last_email
      puts "\u{2714} 6) Reset partner administrator password"
    end
  end

  def humanize_with_acronym(str)
    return str if str.upcase == str

    str.humanize
  end
end
