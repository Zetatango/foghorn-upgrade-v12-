# frozen_string_literal: true

require 'tmpdir'

module GeneralHelper
  def self.confirmation_email_path
    emails_path = "#{Dir.tmpdir}/letter_opener"
    last_email = Dir.entries(emails_path).max
    p "#{emails_path}/#{last_email}/rich.html"
    "#{emails_path}/#{last_email}/rich.html"
  end

  # rubocop:disable Style/ExplicitBlockArgument
  def within_row(text)
    within :xpath, "//table//tr[td[contains(.,\"#{text}\")]]" do
      yield
    end
  end
  # rubocop:enable Style/ExplicitBlockArgument
end
