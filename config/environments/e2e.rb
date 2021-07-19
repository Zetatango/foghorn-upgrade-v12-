# frozen_string_literal: true

require './lib/ario_logger'

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Prepend all log lines with the following tags.
  # NOTE: uncomment user agent temporarily for testing if needed.
  config.log_tags = [
    ->(request) { request.uuid.split('-').last.last(4) },
    ->(request) { request.local? || ENV['MIN_LOGS'] == 'true' ? '' : request.remote_ip },
    ->(request) { request.method.bold },
    ->(request) { request.env['HTTP_HOST'] unless ENV['MIN_LOGS'] == 'true' },
    lambda do |request|
      path = request.env['REQUEST_PATH'].split('/')
      return unless path.present?

      path.push(path.pop.bold).join('/')
    end
    # ->(request) { request.env['HTTP_USER_AGENT'] }
  ]

  config.e2e_env = ENV.fetch('E2E_ENV', 'local')

  logger = if Rails.configuration.e2e_env == 'heroku'
             ActiveSupport::Logger.new($stdout)
           else
             ActiveSupport::Logger.new(Rails.root.join('log', 'e2e.log'))
           end
  logger.formatter = config.log_formatter
  config.logger    = ArioLogger.new(logger)

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # SassC::Engine options
  config.sassc            = OpenStruct.new
  config.sassc.cache      = false
  config.sassc.read_cache = false
  config.sassc.style      = :compressed

  config.render_css = true

  # Eager load code on boot.
  config.eager_load = true

  # Minikube is only for local development to simulate a production Kubernetes environment
  config.use_minikube = false

  # Show full error reports.
  config.consider_all_requests_local = true

  config.action_controller.perform_caching = true

  config.cache_store = :redis_cache_store, {
    url: Rails.application.secrets.redis_url,
    reconnect_attempts: ENV.fetch('REDIS_RECONNECT_ATTEMPTS', 1).to_i,
    connect_timeout: ENV.fetch('REDIS_CONNECT_TIMEOUT', 3).to_i,
    read_timeout: ENV.fetch('REDIS_READ_TIMEOUT', 1).to_i,
    write_timeout: ENV.fetch('REDIS_WRITE_TIMEOUT', 1).to_i,
    error_handler: lambda { |method:, returning:, exception:|
      Rails.logger.warn("Redis error: #{exception}, method: #{method}, returning: #{returning}")
    }
  }

  config.public_file_server.headers = {
    'Cache-Control' => "public, max-age=#{2.days.seconds.to_i}"
  }

  # Attempt to read encrypted secrets from `config/secrets.yml.enc`.
  # Requires an encryption key in `ENV["RAILS_MASTER_KEY"]` or
  # `config/secrets.yml.key`.
  config.read_encrypted_secrets = true

  config.action_mailer.delivery_method = :test

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = false

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  config.zetatango_url = ENV.fetch('ZETATANGO_HOST', 'http://dev.zetatango.local:3000/')
  config.foghorn_url = ENV.fetch('FOGHORN_HOST', 'http://wlmp.zetatango.local:3001/')
  config.roadrunner_url = ENV.fetch('ROADRUNNER_HOST', 'http://idp.zetatango.local:3002/')
  config.wilee_url = ENV.fetch('WILEE_HOST', 'http://kyc.zetatango.local:3003/')
  config.speedy_url = ENV.fetch('SPEEDY_HOST', 'http://speedy.zetatango.local:3004/')

  config.zetatango_domain = ENV.fetch('ZETATANGO_DOMAIN', 'zetatango.local')

  config.e2e_zetatango_url = ENV.fetch('E2E_ZETATANGO_URL', 'http://dev.zetatango.local:3000')
  config.e2e_foghorn_url = ENV.fetch('E2E_FOGHORN_URL', 'http://wlmp.zetatango.local:3001')
  config.e2e_roadrunner_url = ENV.fetch('E2E_ROADRUNNER_URL', 'http://idp.zetatango.local:3002')

  # AWS configuration
  # S3 Bucket name for file uploads
  config.aws_s3_bucket_static_assets = ENV.fetch('AWS_S3_BUCKET_STATIC_ASSETS', 'ario-static-assets-local-dev')
  config.aws_s3_bucket_file_transfer = ENV.fetch('AWS_S3_BUCKET_FILE_TRANSFER', 'file-transfer')

  # Session timeouts
  #
  # inactivity_timeout: Sessions are automatically timed out after the user has been inactive for this period of time
  # session_timeout: Sessions are automatically timed out after this period of time from when the user's session was created

  config.inactivity_timeout = 8.hours
  config.session_timeout = 12.hours

  # Cache timeouts
  #
  # cache_timeout: Cached values are automatically timed out after this period of time (minutes)

  config.cache_timeout = 5

  # When an angular app is compiled with --prod flag in 'ng build --prod' a hash is inserted in the name of the bundles (= compiled assets chunks).
  # These hashes are hardly predictable from the Rails Application perspective.
  #
  # To solve that we log those production bundles names in public/stats.json by using the --stats-json flag in 'ng build --prod --stats-json'
  # Grab the names of the bundles (= compiled assets chunks) from the /public/stats.json
  # and make them available to the rails app through rails application config.
  angular_es2015_stats_file = File.read('public/stats.json')
  es2015_data_hash = JSON.parse(angular_es2015_stats_file)
  compiled_chunks = es2015_data_hash['assetsByChunkName']
  compiled_with_sourcemaps = compiled_chunks['main'].is_a?(Array)

  config.angular_polyfills_asset_path = compiled_with_sourcemaps ? compiled_chunks['polyfills'][0] : compiled_chunks['polyfills']
  config.angular_main_asset_path = compiled_with_sourcemaps ? compiled_chunks['main'][0] : compiled_chunks['main']
  config.angular_scripts_asset_path = compiled_with_sourcemaps ? compiled_chunks['scripts'][0] : compiled_chunks['scripts']
  config.angular_runtime_asset_path = compiled_with_sourcemaps ? compiled_chunks['runtime'][0] : compiled_chunks['runtime']

  config.throttle_limit = 100
  config.throttle_period = 60

  config.sensitive_throttle_limit = 5
  config.sensitive_throttle_period = 60

  config.empty_ua_maxretry = 20
  config.empty_ua_scan_period_mins = 120.minutes
  config.empty_ua_ban_period_hrs = 24.hours

  config.environment_name = Rails.env
  config.use_cloud_storage = false
  config.cloud_platform = ENV.fetch('CLOUD_PLATFORM', 'local')

  config.use_speedy = ENV.fetch('USE_SPEEDY', 'false') == 'true'

  #
  # #sinkhole_vanity_url
  #
  config.sinkhole_vanity_url = ENV['SINKHOLE_VANITY_URL']

  # Data warehouse
  config.data_warehouse_api_url = 'http://dev.zetatango.local:8000'
  config.mock_data_warehouse = false

  # Enable user token for IDP calls
  config.idp_user_token_enabled = true

  #
  # RestClient Configuration
  #
  # open_timeout: The number of seconds to wait on opening an HTTP connection
  # read_timeout: The number of seconds to wait on reading from an HTTP connection
  # connection_error_retries: The number of retries to perform on connection error before giving up
  #
  config.rest_client_open_timeout = ENV.fetch('REST_CLIENT_OPEN_TIMEOUT', 2).to_i
  config.rest_client_read_timeout = ENV.fetch('REST_CLIENT_READ_TIMEOUT', 15).to_i
  config.connection_error_retries = ENV.fetch('CONNECTION_ERROR_RETRIES', 2).to_i
end
