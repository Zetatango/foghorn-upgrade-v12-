# frozen_string_literal: true

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

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

  # The test environment is used exclusively to run your application's
  # test suite. You never need to work with it otherwise. Remember that
  # your test database is "scratch space" for the test suite and is wiped
  # and recreated between test runs. Don't rely on the data there!
  config.cache_classes = true

  # SassC::Engine options
  config.sassc            = OpenStruct.new
  config.sassc.cache      = false
  config.sassc.read_cache = false
  config.sassc.style      = ENV['SASS_EXPANDED'] == 'false' ? :compressed : :expanded

  config.render_css = false

  # Do not eager load code on boot. This avoids loading your whole application
  # just for the purpose of running a single test. If you are using a tool that
  # preloads Rails for running tests, you may have to set it to true.
  config.eager_load = false

  # Minikube is only for local development to simulate a production Kubernetes environment
  config.use_minikube = false

  # Configure public file server for tests with Cache-Control for performance.
  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    'Cache-Control' => "public, max-age=#{1.hour.seconds.to_i}"
  }

  # Show full error reports and disable caching.
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Raise exceptions instead of rendering exception templates.
  config.action_dispatch.show_exceptions = false

  # Disable request forgery protection in test environment.
  config.action_controller.allow_forgery_protection = false
  config.action_mailer.perform_caching = false

  # Tell Action Mailer not to deliver emails to the real world.
  # The :test delivery method accumulates sent emails in the
  # ActionMailer::Base.deliveries array.
  config.action_mailer.delivery_method = :test

  # Print deprecation notices to the stderr.
  config.active_support.deprecation = :stderr

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true
  config.zetatango_url = 'http://localhost:3000/'
  config.foghorn_url = 'http://localhost:3001/'
  config.roadrunner_url = 'http://localhost:3002/'
  config.wilee_url = 'http://localhost:3003/'
  config.speedy_url = 'http://localhost:3004/'

  config.zetatango_domain = 'zetatango.local'

  config.e2e_zetatango_url = ENV.fetch('E2E_ZETATANGO_URL', 'http://dev.zetatango.local:3000')
  config.e2e_foghorn_url = ENV.fetch('E2E_FOGHORN_URL', 'http://wlmp.zetatango.local:3001')
  config.e2e_roadrunner_url = ENV.fetch('E2E_ROADRUNNER_URL', 'http://idp.zetatango.local:3002')

  # AWS configuration
  # S3 Bucket name for file uploads
  config.aws_s3_bucket_static_assets = 'ario-static-assets-local-dev'
  config.aws_s3_bucket_file_transfer = 'file-transfer'

  # Session timeouts
  #
  # inactivity_timeout: Sessions are automatically timed out after the user has been inactive for this period of time
  # session_timeout: Sessions are automatically timed out after this period of time from when the user's session was created

  config.inactivity_timeout = 5.minutes
  config.session_timeout = 12.hours

  # Cache timeouts
  #
  # cache_timeout: Cached values are automatically timed out after this period of time (minutes)

  config.cache_timeout = 5

  config.throttle_limit = 5
  config.throttle_period = 99_999

  config.sensitive_throttle_limit = 2
  config.sensitive_throttle_period = 99_999

  config.empty_ua_maxretry = 1
  config.empty_ua_scan_period_mins = 5.minutes
  config.empty_ua_ban_period_hrs = 24.hours

  config.environment_name = Rails.env
  config.use_cloud_storage = false
  config.cloud_platform = ENV.fetch('CLOUD_PLATFORM', 'local')

  config.use_speedy = ENV.fetch('USE_SPEEDY', 'false') == 'true'

  #
  # #sinkhole_vanity_url
  #
  config.sinkhole_vanity_url = 'http://dreampayments.zetatango.local'

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
  config.rest_client_open_timeout = 5
  config.rest_client_read_timeout = 5
  config.connection_error_retries = 2
end
