# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include UserIdentity
  include PartnerIdentity
  include ActiveInvoiceId
  include ActiveFlow
  include LogoutRedirection
  include MerchantRedirection
  include Logging
  include ThemeSetup
  include UrlHelper
  include ApiHelper
  include GoogleHelper
  include ZttClientHelper
  include IdpClientHelper

  protect_from_forgery with: :exception

  helper_method :session_logout_url, :account_info_url, :escaped_partner_subdomain, :parse_api_error, :google_places_api_key

  prepend_before_action :set_locale
  before_action :set_feature_policy_header, :set_partner, :initialize_theming
  after_action :log_action, :set_csrf_token_cookie

  REDIS_UNAVAILABLE_ERROR_CODE = 10_007

  #
  # This line will enforce CanCanCan authorization checks on all controllers, all actions
  #
  # If a controller needs to be whitelisted to not include authorization checks add the following line to the
  # specific controller:
  #
  # skip_authorization_check
  #
  # If specific action(s) for a controller need to be whitelisted to not include authorization checks add the following
  # line to the controller:
  #
  # skip_authorization_check only: %i[action1 action2]
  #
  check_authorization
  authorize_resource class: false

  rescue_from CanCan::AccessDenied, ActionController::UnknownFormat do |exception|
    Rails.logger.warn("Access denied (#{exception.subject} -> #{exception.action}): #{exception.message}")
    sign_out_user unless redirected_user_signed_in?

    if redis_unavailable?
      respond_redis_unavailable
    else
      respond_unauthorized(exception, nil)
    end
  end

  rescue_from ActionController::InvalidAuthenticityToken do |exception|
    Rails.logger.info "Resetting login due to: #{exception.message}"
    sign_out_user
    redirect_location = redis_unavailable? ? '/503.html' : '/auth/user'
    respond_unauthorized(exception, redirect_location)
  end

  rescue_from ArgumentError do |exception|
    Rails.logger.warn("A request was made with an invalid argument: #{exception.message}")
    respond_not_found
  end

  rescue_from ActionController::UnknownFormat do |exception|
    Rails.logger.warn("A request was made with an unknown format: #{exception.message}")
    respond_not_found
  end

  protected

  def respond_redis_unavailable
    respond_to do |format|
      Rails.logger.warn('Redis unavailable, redirecting to /503.html.')
      redis_json_error = { status: 'Error', message: 'Service unavailable', code: REDIS_UNAVAILABLE_ERROR_CODE }
      format.json { render json: redis_json_error, status: 503, statusText: 'Service unavailable' }
      format.html { redirect_to '/503.html' }
    end
  end

  def respond_unauthorized(exception, path)
    respond_to do |format|
      format.json { head :unauthorized, content_type: 'application/json' }
      locale = params[:locale] || ''

      redirect_path = path if path.present?
      redirect_path = locale.present? ? root_path(locale: locale) : root_path unless path.present?

      format.html { redirect_to redirect_path, notice: exception.message }
      format.any do
        Rails.logger.error('Request format not supported')
        render json: { message: 'Requested Resource Not Found' }, status: 404
      end
    end
  end

  def respond_not_found
    respond_to do |format|
      format.html { redirect_to '/404.html' }
      format.any do
        render json: { message: 'Requested Resource Not Found', status: 'Error' }, status: :not_found
      end
    end
  end

  def redis_unavailable?
    return false if Rails.env.test? || Rails.env.e2e?

    # :nocov:
    Rails.cache.redis.ping
    false
  rescue Redis::CannotConnectError
    true
    # :nocov:
  end

  def session_logout_url
    return logout_url if redirected_user_signed_in?

    user_signed_in? ? roadrunner_logout_url : logout_url
  end

  def account_info_url
    roadrunner_url('/users/portal')
  end

  def backchannel_logout_service
    @backchannel_logout_service ||= BackchannelLogoutService.instance
  end

  def current_ability
    @current_ability ||= Ability.new(current_user, user_signed_in?, redirected_user_signed_in?, namespace)
  end

  def escaped_partner_subdomain
    current_partner.subdomain.downcase.tr('.', '_') if current_partner&.subdomain
  end

  def validate_token
    return if current_access_token.present?

    render json: { status: 'Error', message: 'Access Token not found' }, status: :unauthorized
  end

  private

  def set_feature_policy_header
    response.headers['Permissions-Policy'] = 'accelerometer=(), ambient-light-sensor=(), camera=(), encrypted-media=(), fullscreen=(), '\
'geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), speaker=(), sync-xhr=(), usb=(), vr=()'
  end

  def namespace
    controller_name_segments = params[:controller].split('/')
    controller_name_segments.pop
    controller_name_segments.join('/').camelize
  end

  def log_action
    log_user_id
    log_partner_id
  end

  # if locale is set grab it, otherwise use default.
  def set_locale
    locale = (params[:locale] || session[:locale]).to_s.strip.to_sym
    I18n.locale = I18n.available_locales.include?(locale) ? locale : I18n.default_locale
  end

  def set_csrf_token_cookie
    cookies[:csrftoken] = {
      value: form_authenticity_token,
      expires: 8.hours.from_now,
      httponly: false,
      secure: Rails.env.production? # Can't set secure cookies for non-SSL connections (i.e. development)
    }
  end
end
