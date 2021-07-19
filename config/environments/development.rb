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

  logger           = ActiveSupport::Logger.new(Rails.root.join('log', 'development.log'))
  logger.formatter = config.log_formatter
  config.logger    = ArioLogger.new(logger)

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # SassC::Engine options
  config.sassc            = OpenStruct.new
  config.sassc.cache      = ENV['SASS_CACHE'] == 'true'
  config.sassc.read_cache = ENV['SASS_READ_CACHE'] == 'true'
  config.sassc.style      = ENV['SASS_EXPANDED'] == 'false' ? :compressed : :expanded

  config.render_css = true

  # Do not eager load code on boot.
  config.eager_load = true

  # Use Minikube for running a local Kubernetes environment
  config.use_minikube = ENV['MINIKUBE'] == 'true'

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
    },
    driver: :ruby,
    ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }
  }

  config.public_file_server.headers = {
    'Cache-Control' => "public, max-age=#{2.days.seconds.to_i}"
  }

  # Attempt to read encrypted secrets from `config/secrets.yml.enc`.
  # Requires an encryption key in `ENV["RAILS_MASTER_KEY"]` or
  # `config/secrets.yml.key`.
  config.read_encrypted_secrets = true

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  config.zetatango_url = "http://#{ENV.fetch('ZETATANGO_HOST', 'dev.zetatango.local:3000')}/"
  config.foghorn_url = "http://#{ENV.fetch('FOGHORN_HOST', 'wlmp.zetatango.local:3001')}/"
  config.roadrunner_url = "http://#{ENV.fetch('ROADRUNNER_HOST', 'idp.zetatango.local:3002')}/"
  config.wilee_url = "http://#{ENV.fetch('WILEE_HOST', 'kyc.zetatango.local:3003')}/"
  config.speedy_url = "http://#{ENV.fetch('SPEEDY_HOST', 'speedy.zetatango.local:3004')}/"

  config.zetatango_domain = ENV.fetch('ZETATANGO_DOMAIN', 'zetatango.local')

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

  if config.use_minikube
    angular_es2015_stats_file = File.read('public/stats-es2015.json')
    es2015_data_hash = JSON.parse(angular_es2015_stats_file)
    compiled_chunks = es2015_data_hash['assetsByChunkName']
    compiled_with_sourcemaps = compiled_chunks['main'].is_a?(Array)

    config.angular_polyfills_es5_asset_path = compiled_with_sourcemaps ? compiled_chunks['polyfills-es5'][0] : compiled_chunks['polyfills-es5']
    config.angular_polyfills_es2015_asset_path = compiled_with_sourcemaps ? compiled_chunks['polyfills'][0] : compiled_chunks['polyfills']
    config.angular_main_asset_path = compiled_with_sourcemaps ? compiled_chunks['main'][0] : compiled_chunks['main']
    config.angular_scripts_asset_path = compiled_with_sourcemaps ? compiled_chunks['scripts'][0] : compiled_chunks['scripts']
    config.angular_runtime_asset_path = compiled_with_sourcemaps ? compiled_chunks['runtime'][0] : compiled_chunks['runtime']
  end

  config.throttle_limit = 100
  config.throttle_period = 60

  config.sensitive_throttle_limit = 5
  config.sensitive_throttle_period = 60

  config.empty_ua_maxretry = 20
  config.empty_ua_scan_period_mins = 120.minutes
  config.empty_ua_ban_period_hrs = 24.hours

  config.environment_name = Rails.env
  config.use_cloud_storage = ENV.fetch('USE_CLOUD_STORAGE', false)

  config.cloud_platform = 'local'

  config.use_speedy = ENV.fetch('USE_SPEEDY', 'false') == 'true'

  #
  # #sinkhole_vanity_url
  #
  config.sinkhole_vanity_url = ENV.fetch('SINKHOLE_VANITY_URL', 'http://dreampayments.zetatango.local:3001') unless config.use_minikube
  config.sinkhole_vanity_url = ENV.fetch('SINKHOLE_VANITY_URL', 'http://dreampayments.dev.zetatango.com') if config.use_minikube

  config.hosts << /[a-z0-9\-]+\.zetatango\.local/ unless config.use_minikube
  config.hosts << /[a-z0-9\-]+\.dev\.zetatango\.com/ if config.use_minikube

  # Data warehouse
  config.data_warehouse_api_url = 'http://dev.zetatango.local:8000'
  config.mock_data_warehouse = ENV.fetch('MOCK_DATA_WAREHOUSE', 'true') == 'true'

  # Access asset pipeline through precompile, like production.
  if ENV['CI_PRECOMPILE'] == 'true'
    p 'Using Rails precompiled assets.'
    config.assets.debug = false
    config.assets.digest = true
    config.assets.compile = false
    config.assets.js_compressor = Uglifier.new(harmony: true)
  end

  #
  # SSL Configuration
  #
  # Facebook Login requires redirect URIs to use the HTTPS protocol (even in local development). The following
  # configuration variables setup SSL on the WLMP and configure the server to listen on a port for TLS connections.
  #
  # These should only be set in development
  #
  config.wlmp_ssl_port = 3004 # The SSL port that Puma will be configured to listen on

  # Enable user token for IDP calls
  config.idp_user_token_enabled = true

  #
  # RestClient Configuration
  #
  # open_timeout: The number of seconds to wait on opening an HTTP connection
  # read_timeout: The number of seconds to wait on reading from an HTTP connection
  # connection_error_retries: The number of retries to perform on connection error before giving up
  #
  config.rest_client_open_timeout = 5
  config.rest_client_read_timeout = 5
  config.connection_error_retries = 2
end
