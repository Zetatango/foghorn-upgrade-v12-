# frozen_string_literal: true

require 'ztt_client'

class MerchantsController < ApplicationController
  layout :resolve_layout

  helper_method :ario?, :sign_up_query_params, :sign_in_query_params, :unsupported_browser_params
  before_action :unsupported_browser
  before_action :authenticate_user!, except: %i[new create]
  before_action :validate_profile, except: %i[partner new create documents marketing quickbooks insights]
  before_action :validate_token, except: %i[new create]
  before_action :add_tracked_object_clicked, :capture_invoice_id, :capture_flow, only: :new
  before_action :redirect_signed_in_user, only: :new
  before_action :check_show_welcome, :load_new_merchant, only: :new
  before_action :validate_new_merchant, only: :create

  SupportedBrowsers = Rails.application.config.supported_browsers_formatted

  #
  # Authorization: will automatically call Ability.authorize!(:new, :merchant)
  #
  # GET /merchants/new
  def new
    return unless params[:user].present? && !params[:user].respond_to?(:delete_if)

    render file: "#{Rails.root}/public/404.html", layout: false, status: :not_found
  end

  #
  # Authorization: will automatically call Ability.authorize!(:create, :merchant)
  #
  # POST /merchants
  def create
    uri = roadrunner_url('/users/sign_up', partner: current_partner.id, name: @merchant_name, email: @merchant_email)
    redirect_to uri
  end

  #
  # Authorization: will automatically call Ability.authorize!(:show, :merchant)
  #
  def show
    store_invoice_id(show_params[:invoice_id])
    store_flow(show_params[:flow])
  end

  def partner; end

  def partner_onboarding; end

  def documents; end

  def quickbooks; end

  def marketing; end

  def insights; end

  private

  def resolve_layout
    case action_name
    when 'new'
      'landing'
    else
      'application'
    end
  end

  def redirect_signed_in_user
    return unless user_signed_in?

    redirect_to "/auth/user?#{sign_in_query_params.to_query}"
  end

  def sign_up_query_params
    query_parameters = { partner: current_partner&.id }

    query_parameters[:referrer] = params[:supplier] if params.key?(:supplier) # use supplier if provided
    keys = %i[referrer tracked_object_id external_id email name]
    add_query_parameters(query_parameters, keys)

    query_parameters
  end

  def sign_in_query_params
    query_parameters = { partner: current_partner&.id }

    query_parameters[:ui_locales] = I18n.locale
    query_parameters[:tracked_object_id] = params[:tracked_object_id] if params.key?(:tracked_object_id)
    query_parameters[:login_hint] = params[:email] if params.key?(:email)

    query_parameters
  end

  def capture_invoice_id
    return unless show_params.key?(:invoice_id)

    store_invoice_id(show_params[:invoice_id])
  end

  def capture_flow
    return unless show_params.key?(:flow)

    store_flow(show_params[:flow])
  end

  def add_tracked_object_clicked
    return unless params.key?(:tracked_object_id)

    ZetatangoService.instance.add_tracked_object_event(params[:tracked_object_id], ZetatangoService::TRACKED_OBJECT_EVENT_CLICKED)
  rescue ZetatangoService::ZetatangoServiceException => e
    Rails.logger.warn("Error handling tracked object event request: #{e.message}")
  end

  def ario?
    current_partner&.valid? && current_partner&.theme_css_url.blank?
  end

  # rubocop:disable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity
  def validate_profile
    onboarding_params = new_merchant_params.to_h.slice(:invoice_id, :flow).compact
    return if redirected_user_signed_in? || (user_signed_in? && current_user.merchant_admin?)
    return unless user_signed_in? && current_user.merchant_new?

    selected_profile = current_user.profile(current_user.selected_profile)

    if selected_profile&.key?(:merchant)
      redirect_to new_on_boarding_path(onboarding_params)
    else
      # Don't use flow param when the profile is onboarding
      redirect_to new_on_boarding_path(onboarding_params.except(:flow))
    end
  end
  # rubocop:enable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity

  def validate_token
    return if current_access_token.present?

    render file: "#{Rails.root}/public/404.html", layout: false, status: :not_found
  end

  def new_merchant_params
    params.permit(:invoice_id, :locale, :supplier, :tracked_object_id, :flow)
  end

  def show_params
    params.permit(:invoice_id, :flow)
  end

  def merchant_params
    params.permit(:partner, :name, :email)
  end

  def check_show_welcome
    redirect_to merchant_welcome_redirect_url('sign_up') if merchant_welcome_redirect?
  end

  def load_new_merchant
    @merchant_name = ''
    @merchant_email = ''
    flash.now[:alert] = 'Please contact us through your partner' unless current_partner&.valid?
  end

  def validate_new_merchant
    @merchant_name = merchant_params[:name] unless merchant_params[:name].blank?
    @merchant_email = merchant_params[:email] unless merchant_params[:email].blank?

    return unless validate_merchant_name
    return unless validate_merchant_email

    validate_partner
  end

  def validate_partner
    return if current_partner&.valid?

    flash.now[:alert] = 'Please contact us through your partner'
    render :new
  end

  def validate_merchant_email
    if @merchant_email.nil?
      flash.now[:alert] = 'Email cannot be blank'
      render :new
      false
    elsif !EmailValidator.valid?(@merchant_email)
      flash.now[:alert] = 'Email is invalid'
      render :new
      false
    else
      true
    end
  end

  def validate_merchant_name
    if @merchant_name.nil?
      flash.now[:alert] = 'Name cannot be blank'
      render :new
      false
    else
      true
    end
  end

  def check_browser
    # Rails tests don't send a user agent with their request
    # Test and E2E environments can switch out user agent to be a supported one
    # Development and production do not allow for user agents to be swapped out
    default_to_good_user_agent = !request.env['USER_AGENT'] && Rails.application.secrets.allow_useragent_swap
    default_user_agent = Rails.application.config.good_browsers['chrome']

    user_agent = default_to_good_user_agent ? default_user_agent : request.user_agent
    return false unless user_agent.is_a?(String)

    parsed_user_agent = UserAgent.parse(user_agent)

    return false if webview?(parsed_user_agent)

    SupportedBrowsers.detect { |browser| parsed_user_agent >= browser }
  end

  def unsupported_browser
    return unless !check_browser && user_signed_in? && Rails.application.secrets.warn_unsupported_browsers

    render layout: 'warning'
  end

  def unsupported_browser_params
    parsed_user_agent = request.user_agent.is_a?(String) ? UserAgent.parse(request.user_agent) : nil

    user_agent_version = parsed_user_agent&.version&.to_s || '?'
    version = "(v.#{user_agent_version})"
    browser = parsed_user_agent&.browser&.to_str || '?'

    {
      supported_browsers: Rails.application.config.supported_browsers,
      browser: browser,
      version: version
    }
  end

  def add_query_parameters(query_parameters, keys)
    keys.each do |key|
      query_parameters[key] = params[key] if params.key?(key)
    end
  end

  def webview?(parsed_user_agent)
    contains_webview = false

    parsed_user_agent.each do |part|
      return true if part&.comment&.include?('wv')
    end

    contains_webview
  end
end
