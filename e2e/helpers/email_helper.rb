# frozen_string_literal: true

require 'fileutils'
require 'tmpdir'

module EmailHelper
  def last_email
    emails_path, last_email = last_email_info

    File.read("#{emails_path}/#{last_email}/plain.html")
  end

  def last_email_info
    emails_path = "#{Dir.tmpdir}/letter_opener"
    last_email = Dir.entries(emails_path).max

    [emails_path, last_email]
  end

  def find_email_with_wait(contents_reg_exp)
    # Sleep times 1 second, 2, 4, 8, 16, 32 for a total of 63 seconds of sleeping
    6.times do |index|
      results = find_email(contents_reg_exp)

      return results unless results.all?(&:nil?)

      sleep(2**(index + 1))
    end

    results = find_email(contents_reg_exp)

    return results unless results.all?(&:nil?)

    [nil, nil, nil]
  end

  def clear_emails
    emails_directory = "#{Dir.tmpdir}/letter_opener"

    FileUtils.rm_rf(Dir.glob("#{emails_directory}/*"))
  end

  def self.clear_emails
    emails_directory = "#{Dir.tmpdir}/letter_opener"

    FileUtils.rm_rf(Dir.glob("#{emails_directory}/*"))
  end

  private

  def find_email(contents_reg_exp)
    emails_directory = "#{Dir.tmpdir}/letter_opener"

    return [nil, nil, nil] unless File.directory?(emails_directory)

    Dir.foreach(emails_directory) do |email_dir|
      next if (email_dir == '.') || (email_dir == '..')

      email_path = "#{emails_directory}/#{email_dir}"

      next unless File.directory?(email_path)

      plaintext_email_path = "#{email_path}/plain.html"

      next unless File.file?(plaintext_email_path)

      email_contents = File.read(plaintext_email_path)

      return [email_contents, emails_directory, email_dir] if /#{contents_reg_exp}/.match?(email_contents)
    end

    [nil, nil, nil]
  end
end
