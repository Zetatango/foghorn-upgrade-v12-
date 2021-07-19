# frozen_string_literal: true

# :nocov:
Rails.application.config.content_security_policy do |policy|
  def load_ports
    (Rails.env.development? && !Rails.configuration.use_minikube) || Rails.env.test? || Rails.env.e2e? ? { wlmp: ':3001', idp: ':3002', all: ':*' } : {}
  end

  def direct_upload_url
    "https://#{Rails.configuration.aws_s3_bucket_file_transfer}.s3.#{Rails.application.secrets.aws[:region]}.amazonaws.com"
  end

  @ports = load_ports

  policy.default_src :self
  policy.script_src :self, 'www.google-analytics.com', 'https://maps.googleapis.com', 'https://app.intercom.io', 'https://widget.intercom.io',
                    'https://js.intercomcdn.com', 'https://assets.calendly.com/assets/external/widget.js', 'https://www.googletagmanager.com',
                    'https://tagmanager.google.com', 'https://www.googletagmanager.com', 'https://www.googleadservices.com',
                    'https://googleads.g.doubleclick.net', 'https://tags.srv.stackadapt.com/events.js'
  policy.style_src :self, :unsafe_inline, 'fonts.googleapis.com', 'https://assets.calendly.com/assets/external/widget.css', 'https://tagmanager.google.com',
                   'https://tags.srv.stackadapt.com'
  policy.img_src :self, :unsafe_inline, 'data:', 'www.google-analytics.com', 'https://maps.gstatic.com', 'https://js.intercomcdn.com',
                 'https://static.intercomassets.com', 'https://downloads.intercomcdn.com', 'https://uploads.intercomusercontent.com',
                 'https://gifs.intercomcdn.com', 'https://acuityplatform.com', 'https://ssl.gstatic.com/', 'www.gstatic.com',
                 'https://googleads.g.doubleclick.net', 'https://www.google.com', 'https://www.google.ca', 'https://stats.g.doubleclick.net',
                 'https://ario-logo-assets.s3.ca-central-1.amazonaws.com',
                 "https://#{Rails.application.config.aws_s3_bucket_static_assets}.s3.#{Rails.application.secrets.aws[:region]}.amazonaws.com",
                 "https://#{Rails.application.config.aws_s3_bucket_static_assets}.s3.#{Rails.application.secrets.aws[:region]}.amazon.com",
                 'https://script.google.com/macros/s/AKfycbw6VuChCDWPLg2SLVmoU1Eq3WQqQWA_dC72vCbgqS6NLk4PgJv6Y7_czuU85eBpFXR5/exec'
  policy.font_src :self, 'data:', 'fonts.gstatic.com', 'https://js.intercomcdn.com'
  policy.frame_ancestors :none
  policy.object_src :none
  policy.base_uri :self
  policy.report_uri '/csp_reports'
  policy.frame_src "*.#{Rails.application.config.zetatango_domain}#{@ports[:wlmp]}", "#{Rails.application.config.zetatango_domain}#{@ports[:wlmp]}",
                   Rails.application.secrets.flinks[:flinks_url], 'https://intercom-sheets.com/', 'https://calendly.com/', 'https://bid.g.doubleclick.net'
  policy.form_action "*.#{Rails.application.config.zetatango_domain}#{@ports[:all]}", "#{Rails.application.config.zetatango_domain}#{@ports[:all]}",
                     'https://intercom.help', 'https://calendly.com'
  policy.connect_src :self, "*.#{Rails.application.config.zetatango_domain}#{@ports[:idp]}", 'https://api.intercom.io', 'https://api-iam.intercom.io',
                     'https://api-ping.intercom.io', 'https://nexus-websocket-a.intercom.io', 'https://nexus-websocket-b.intercom.io',
                     'https://nexus-long-poller-a.intercom.io', 'https://nexus-long-poller-b.intercom.io', 'wss://nexus-websocket-a.intercom.io',
                     'wss://nexus-websocket-b.intercom.io', 'https://uploads.intercomcdn.com', 'https://uploads.intercomusercontent.com',
                     'https://*.bugsnag.com/', 'https://www.google-analytics.com', 'www.google-analytics.com', 'https://stats.g.doubleclick.net',
                     direct_upload_url, 'https://tags.srv.stackadapt.com'
  policy.child_src :self, 'https://share.intercom.io', 'https://intercom-sheets.com', 'https://www.intercom-reporting.com '
  policy.media_src :self, 'https://js.intercomcdn.com'

  # For INTERCOM list: https://www.intercom.com/help/configure-intercom/staying-secure/using-intercom-with-content-security-policy
end
# :nocov:

Rails.application.config.content_security_policy_nonce_directives = %w[script-src]
Rails.application.config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
Rails.application.config.content_security_policy_report_only = false
