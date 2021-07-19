# frozen_string_literal: true

require_relative 'boot'

require 'rails'

require 'active_model/railtie'
require 'active_job/railtie'
require 'action_controller/railtie'
require 'action_mailer/railtie'
require 'action_view/railtie'
require 'action_cable/engine'
require 'sprockets/railtie'
require 'rails/test_unit/railtie'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

require_relative 'middleware/request_validator'

# rubocop:disable Style/ClassAndModuleChildren
module Foghorn
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.0
    config.autoloader = :classic

    config.paths.add File.join('app', 'services'), glob: File.join('**', '*.rb')
    config.autoload_paths += Dir[Rails.root.join('app', 'services', '**')]
    config.eager_load_paths += Dir[Rails.root.join('app', 'services', '*')]

    config.exceptions_app = routes

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    config.git_sha = ENV['HEROKU_SLUG_COMMIT'] || `git rev-parse HEAD`.chomp || 'current'

    config.i18n.available_locales = %i[en fr]
    config.i18n.default_locale = :en
    config.i18n.load_path += Dir[Rails.root.join('config', 'locales', '**', '*.{rb,yml}')]

    output_dir = ENV['CIRCLE_ARTIFACTS']
    config.output_dir = output_dir.present? ? Pathname.new(output_dir) : Rails.root.join('output')

    config.middleware.insert_before Rack::Runtime, RequestValidator
    config.middleware.use Rack::Attack
  end
end
# rubocop:enable Style/ClassAndModuleChildren
