# frozen_string_literal: true

ENV['RAILS_ENV'] = 'e2e'
ENV['RACK_ENV'] = 'e2e'

require File.expand_path('../config/environment', __dir__)
require 'minitest/autorun'
require 'minitest/hooks/default'
require 'minitest/reporters'

require 'capybara/rails'
require 'capybara/minitest'
require 'capybara-screenshot/minitest'

require 'awesome_print'

Dir[Rails.root.join('e2e', 'helpers', '*.rb')].sort.each { |file| require file }
Dir[Rails.root.join('e2e', 'api', '*.rb')].sort.each { |file| require file }
Dir[Rails.root.join('e2e', 'seeds', '*.rb')].sort.each { |file| require file }
Dir[Rails.root.join('e2e', 'flows', '*.rb')].sort.each { |file| require file }

Minitest::Reporters.use! [Minitest::Reporters::DefaultReporter.new(color: true),
                          Minitest::Reporters::HtmlReporter.new(reports_dir: './e2e/reports/')]

class ActionDispatch::IntegrationTest
  include RequestsHelper
  include AccessTokenHelper
  include DatabaseSetupHelper
  include FixturesHelper
  include ZetatangoApi
  include RoadrunnerApi
  include InternalHelper
  include CommonFlowHelper
  include BankAccountHelper
  include EmailHelper
  include PartnerPortalHelper
  include GeneralHelper
  include ThemeHelper
  extend RequestsHelper
  extend FlinksApi
  extend ResetFlinksHelper
  extend EnvHelper

  include Minitest::Hooks

  include EnvHelper
  include Capybara::DSL
  include Capybara::Minitest::Assertions
  include Capybara::Screenshot::MiniTestPlugin

  # reset flinks should happen once a day, so it doesn't interfers with staging testing
  reset_flinks if heroku?
  Rails.cache = ActiveSupport::Cache::MemoryStore.new

  # TODO: move this or use the class below, for now keep it to avoid breaking any setup
  setup do
    Rails.cache.clear

    if heroku?
      Capybara.register_driver :selenium_chrome_headless do |app|
        options = ::Selenium::WebDriver::Chrome::Options.new

        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1400,1400')

        Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
      end

      Capybara.javascript_driver = :selenium_chrome_headless
      Capybara.current_driver = :selenium_chrome_headless

      internal_log_in('e2e-admin@arioplatform.com', ENV.fetch('E2E_ADMIN_PASSWORD'))

      Capybara.reset_sessions!
    else
      Capybara.current_driver = ENV.fetch('CAPYBARA_E2E_DRIVER', 'selenium_chrome_headless').to_sym
      Capybara.current_session.current_window.resize_to(1400, 1400)
    end
  end

  teardown do
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end
end

class CapybaraSetup < ActionDispatch::IntegrationTest
  before(:all) do
    Rails.cache.clear

    if heroku?
      Capybara.register_driver :selenium_chrome_headless do |app|
        options = ::Selenium::WebDriver::Chrome::Options.new

        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1400,1400')

        Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
      end
      Capybara.javascript_driver = :selenium_chrome_headless
      Capybara.current_driver = :selenium_chrome_headless

      internal_log_in('e2e-admin@arioplatform.com', ENV.fetch('E2E_ADMIN_PASSWORD'))
      internal_log_out

      Capybara.reset_sessions!
    else
      Capybara.current_driver = :selenium_chrome_headless

      internal_log_in('e2e-admin@arioplatform.com', ENV.fetch('E2E_ADMIN_PASSWORD'))
      internal_log_out

      Capybara.reset_sessions!
      Capybara.use_default_driver
    end

  rescue Net::ReadTimeout => e
    Rails.logger.warn("Initially failed to access internal portal (non-fatal): #{e.message}")

    Capybara.reset_sessions!
    if heroku?
      Capybara.current_driver = :selenium_chrome_headless
    else
      Capybara.use_default_driver
    end
  end
end
