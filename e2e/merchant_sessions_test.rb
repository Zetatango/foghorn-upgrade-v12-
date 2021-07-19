# frozen_string_literal: true

require_relative 'test_helper'

class MerchantSessionsTest < CapybaraSetup
  include CommonFlowHelper

  setup do
    @merchant = {
      first_name: 'Hello',
      last_name: 'Kitty',
      phone_number: '6135555555',
      email: 'merchant5000@hello.kitty',
      password: 'Password4'
    }
  end

  test 'Merchant portal interaction with IDP (multi session)' do
    puts '', 'Merchant portal interaction with IDP (multi session)', ''

    # Merchant can create an account
    foghorn_start_page = heroku? ? 'https://dreampayments.e2e.zetatango.com/merchants/new' : 'http://dreampayments.zetatango.local:3001/merchants/new'
    idp_profile_page = heroku? ? 'https://dreampayments.e2e.zetatango.com/users/profile' : 'http://id.ztt-auth.zetatango.local:3002/users/profile'

    Capybara.using_session(:default) do
      visit foghorn_start_page
      click_on('Apply now', match: :first)
      fill_in 'First name', with: @merchant[:first_name]
      fill_in 'Last name', with: @merchant[:last_name]
      fill_in 'Phone number', with: @merchant[:phone_number]
      fill_in 'Email', with: @merchant[:email]
      fill_in 'Password', with: @merchant[:password]
      click_on 'Get started'
      puts "\u{2714} Signed up for new merchant account in first session"

      follow_link_from_last_email
      assert_match 'Angular WLMP Embedding', page.body
      puts "\u{2714} Arrived in merchant portal after clicking email link in first session"
    end

    puts '', 'Log in and out of multiple sessions (merchant portal):', ''

    # Log into a second session
    Capybara.using_session(:other) do
      # Log into second session
      visit_foghorn_and_sign_in(foghorn_start_page, @merchant[:email], @merchant[:password])
      assert_match 'Angular WLMP Embedding', page.body
      puts "\u{2714} Logged in to merchant portal in second session"
    end

    # Log out of first session
    Capybara.using_session(:default) do
      visit_idp_profile_and_sign_out(idp_profile_page)
      assert_match 'Sign in', page.body
      puts "\u{2714} Logged out of first session and returned to sign in page"
    end

    # Second session should be invalidated and be able to log back in and out
    Capybara.using_session(:other) do
      refresh
      assert_match 'Sign in', page.body
      puts "\u{2714} Second session was invalidated by logging out of first session"

      visit_foghorn_and_sign_in(foghorn_start_page, @merchant[:email], @merchant[:password])
      assert_match 'Angular WLMP Embedding', page.body
      puts "\u{2714} Successfully logged back in to merchant portal in second session"

      visit_idp_profile_and_sign_out(idp_profile_page)
      assert_match 'Sign in', page.body
      puts "\u{2714} Logged out of second session and returned to sign in page"
    end

    puts '', 'Password reset with multiple sessions (merchant portal):', ''

    new_password = 'NyuuPaasuwaado111!!!'

    Capybara.using_session(:default) do
      # log into a session
      visit_foghorn_and_sign_in(foghorn_start_page, @merchant[:email], @merchant[:password])
      assert_match 'Angular WLMP Embedding', page.body
      puts "\u{2714} Logged into first session"
    end

    Capybara.using_session(:no_session) do
      # reset password from another session which is not logged in
      visit foghorn_start_page
      click_on 'Sign in'
      click_on 'I forgot my password'
      fill_in 'Email', with: @merchant[:email]
      click_on 'Submit'
      puts "\u{2714} Submitted password reset form from second (not logged in) session"

      # click link in reset password email
      follow_link_from_last_email
      fill_in 'New password', with: new_password
      click_on 'Set password'

      assert_match 'Angular WLMP Embedding', page.body
      puts "\u{2714} Password was reset from second session and is now logged in"
    end

    Capybara.using_session(:default) do
      # first session should have been logged out and be able to log back in with new password
      refresh
      assert_match 'Sign in', page.body
      puts "\u{2714} First session was invalidated by password reset from second session"

      visit_foghorn_and_sign_in(foghorn_start_page, @merchant[:email], new_password)
      assert_match 'Angular WLMP Embedding', page.body
      puts "\u{2714} Logged back into first session with new password"
    end
  end

  def visit_foghorn_and_sign_in(foghorn_start_page, email, password)
    visit foghorn_start_page
    click_on 'Sign in'
    fill_in 'Email', with: email
    fill_in 'Password', with: password
    click_on 'Sign in'
  end

  def visit_idp_profile_and_sign_out(idp_profile_page)
    visit idp_profile_page
    Capybara.current_session.current_window.resize_to(1400, 1400)
    click_on 'Activity'
    click_on 'Sign out of all sessions'
  end
end
