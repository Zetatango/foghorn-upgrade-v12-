# frozen_string_literal: true

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.cache_classes = true

  # SassC::Engine options
  config.sassc            = OpenStruct.new
  config.sassc.cache      = false
  config.sassc.read_cache = false
  config.sassc.style      = :compressed

  config.render_css = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Minikube is only for local development to simulate a production Kubernetes environment
  config.use_minikube = false

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Attempt to read encrypted secrets from `config/secrets.yml.enc`.
  # Requires an encryption key in `ENV["RAILS_MASTER_KEY"]` or
  # `config/secrets.yml.key`.
  config.read_encrypted_secrets = true

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?

  # Compress JavaScripts and CSS.
  config.assets.js_compressor = Uglifier.new(harmony: true) # old_value{ ruconfig.assets.js_compressor = :uglifier }
  # config.assets.css_compressor = :sass

  # Do fallback to assets pipeline if a precompiled asset is missed.
  config.assets.compile = false

  # `config.assets.precompile` and `config.assets.version` have moved to config/initializers/assets.rb

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.action_controller.asset_host = 'http://assets.example.com'

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX

  # Mount Action Cable outside main process or domain
  # config.action_cable.mount_path = nil
  # config.action_cable.url = 'wss://example.com/cable'
  # config.action_cable.allowed_request_origins = [ 'http://example.com', /http:\/\/example.*/ ]

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # Set default log level to info in production
  config.log_level = ENV.fetch('LOG_LEVEL', 'info').to_sym

  # Prepend all log lines with the following tags.
  config.log_tags = [
    :request_id,
    :remote_ip,
    :method,
    ->(request) { request.env['HTTP_USER_AGENT'] },
    ->(request) { request.env['HTTP_HOST'] },
    ->(request) { request.env['REQUEST_PATH'] }
  ]

  config.log_formatter = proc do |severity, time, _progname, msg|
    "[#{severity}] [#{time}] #{msg}\n"
  end

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

  # Use a real queuing backend for Active Job (and separate queues per environment)
  # config.active_job.queue_adapter     = :resque
  # config.active_job.queue_name_prefix = "foghorn_#{Rails.env}"
  config.action_mailer.perform_caching = false

  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners.
  config.active_support.deprecation = :notify

  # Use a different logger for distributed setups.
  # require 'syslog/logger'
  config.logger = ActiveSupport::TaggedLogging.new(ActiveSupport::Logger.new($stdout))

  config.foghorn_url = "https://#{ENV['FOGHORN_HOST']}/"
  config.roadrunner_url = "https://#{ENV['ROADRUNNER_HOST']}/"
  config.zetatango_url = "https://#{ENV['ZETATANGO_HOST']}/"
  config.wilee_url = "https://#{ENV['WILEE_HOST']}/"
  config.speedy_url = "https://#{ENV['SPEEDY_HOST']}/"

  config.zetatango_domain = ENV['ZETATANGO_DOMAIN']

  # AWS configuration
  # S3 Bucket name for file uploads
  config.aws_s3_bucket_static_assets = ENV['AWS_S3_BUCKET_STATIC_ASSETS']
  config.aws_s3_bucket_file_transfer = ENV['AWS_S3_BUCKET_FILE_TRANSFER']

  # Session timeouts
  #
  # inactivity_timeout: Sessions are automatically timed out after the user has been inactive for this period of time
  # session_timeout: Sessions are automatically timed out after this period of time from when the user's session was created

  config.inactivity_timeout = 1.hour
  config.session_timeout = 12.hours

  # Cache timeouts
  #
  # cache_timeout: Cached values are automatically timed out after this period of time (minutes)

  config.cache_timeout = ENV.fetch('CACHE_TIMEOUT', 5).to_i

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

  config.throttle_limit = ENV.fetch('THROTTLE_LIMIT', 25).to_i
  config.throttle_period = ENV.fetch('THROTTLE_PERIOD', 60).to_i

  config.sensitive_throttle_limit = ENV.fetch('SENSITIVE_THROTTLE_LIMIT', 5).to_i
  config.sensitive_throttle_period = ENV.fetch('SENSITIVE_THROTTLE_PERIOD', 60).to_i

  config.empty_ua_maxretry = ENV.fetch('EMPTY_UA_MAXRETRY', '1').to_i
  config.empty_ua_scan_period_mins = ENV.fetch('EMPTY_UA_SCAN_PERIOD_MINS', '5').to_i.minutes
  config.empty_ua_ban_period_hrs = ENV.fetch('EMPTY_UA_BAN_PERIOD_HRS', '24').to_i.hours

  config.environment_name = ENV['ENVIRONMENT_NAME']
  config.use_cloud_storage = true

  config.cloud_platform = ENV.fetch('CLOUD_PLATFORM', 'heroku')

  config.use_speedy = ENV.fetch('USE_SPEEDY', 'false') == 'true'

  #
  # #sinkhole_vanity_url
  #
  config.sinkhole_vanity_url = ENV['SINKHOLE_VANITY_URL']

  # Old ario/zetatango hosts (to be removed after testing the TC ones for a while)
  config.hosts << /[a-z0-9\-]+\.staging\.zetatango\.com/ if ENV['ENVIRONMENT_NAME'] == 'staging'
  config.hosts << /[a-z0-9\-]+\.sandbox\.zetatango\.com/ if ENV['ENVIRONMENT_NAME'] == 'sandbox'
  config.hosts << /[a-z0-9\-]+\.arioplatform\.com/ if ENV['ENVIRONMENT_NAME'] == 'production'

  # Allowed hosts mapping to this service
  config.hosts << /[a-z0-9\-]+\.staging\.thinkingcapital\.ca/ if ENV['ENVIRONMENT_NAME'] == 'staging'
  config.hosts << /[a-z0-9\-]+\.sandbox\.thinkingcapital\.ca/ if ENV['ENVIRONMENT_NAME'] == 'sandbox'
  config.hosts << /[a-z0-9\-]+\.thinkingcapital\.ca/ if ENV['ENVIRONMENT_NAME'] == 'production'

  # Data warehouse
  config.data_warehouse_api_url = ENV['DATA_WAREHOUSE_API_URL']
  config.mock_data_warehouse = ENV.fetch('MOCK_DATA_WAREHOUSE', 'false') == 'true'

  # Enable user token for IDP calls
  config.idp_user_token_enabled = ENV.fetch('IDP_USER_TOKEN_ENABLED', 'false') == 'true'

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
