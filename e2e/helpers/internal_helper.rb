# frozen_string_literal: true

module InternalHelper
  def internal_log_in(username, password)
    visit internal_url

    fill_in 'Email', with: username
    fill_in 'Password', with: password
    click_on 'Sign in'
  end

  def internal_log_out
    visit "#{internal_url}/logout"
  end

  def add_partner_admin(name, email, attributes = [])
    click_on 'Partners'
    click_on 'Zetatango Test Partner'
    click_on 'Users'
    click_on 'Invite a new team member'

    fill_in 'name', with: name
    fill_in 'email', with: email

    attributes.each do |attribute|
      check attribute
    end

    click_on 'commit'
  end

  def find_internal_user(name, email)
    # :nocov:
    loop do
      page_content = page.body

      break if /#{name}/i.match(page_content) && /\(#{email}\)/i.match(page_content)

      # Prevent us from endlessly looping
      assert page_content !~ /<a href="#">Next/, 'Failed to find user'

      click_on 'Next'
    end
    # :nocov:
  end
end
