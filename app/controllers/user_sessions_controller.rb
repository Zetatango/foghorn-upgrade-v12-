# frozen_string_literal: true

require 'ztt_client'

class UserSessionsController < ApplicationController
  layout 'idp'

  skip_before_action :verify_authenticity_token, only: :backchannel_logout

  before_action :check_session, only: %i[auto_choose_account choose_account show_accounts switch_account]
  before_action :check_account, only: %i[auto_choose_account choose_account switch_account]
  before_action :check_show_accounts, only: %i[show_accounts]
  before_action :load_user, only: %i[show_accounts]

  skip_authorization_check only: %i[backchannel_logout]

  #
  # Authorization: will automatically call Ability.authorize!(:create, :user_sessions)
  #
  # rubocop:disable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity
  def create
    user = User.from_omniauth(auth_hash, current_partner&.lender_partner_id) if auth_hash&.provider&.to_sym == :user
    callback_profile_guid = find_profile(user)

    # Read invoice id and flow from session and store it in memory
    params = { invoice_id: current_invoice_id, flow: current_flow }.compact
    clear_session_auto_profile_vars
    unless user.nil?
      if user.multiple_profiles?
        session[:zetatango_user] = user

        next_page = if callback_profile_guid.present?
                      auto_choose_account_path(profile_uid: callback_profile_guid)
                    elsif skip_profile_select?(user)
                      auto_choose_account_path(profile_uid: user.first_valid_profile_guid)
                    else
                      accounts_path
                    end
      else
        next_page = session[:return_to]
        logged_in_user = user_login(user)

        return render file: "#{Rails.root}/public/401.html", layout: false, status: :unauthorized if logged_in_user.nil?
      end
    end

    if next_page.nil?
      redirect_to root_path(params)
    else
      redirect_to next_page
    end
  end
  # rubocop:enable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity

  #
  # Authorization: will automatically call Ability.authorize!(:show_accounts, :user_sessions)
  #
  # rubocop:disable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity
  def show_accounts
    @profiles = profile_picker_profiles.map do |profile|
      merchant = profile.dig(:properties, :merchant)
      name = profile.dig(:properties, :merchant, :name)
      business_number = profile.dig(:properties, :merchant, :business_num)

      if profile.dig(:properties, :role) == 'partner_admin'
        # Partner admin.
        {
          uid: profile[:uid],
          role: 'partner_admin',
          btn_value: I18n.t('merchants.partner_admin_label'),
          label_title: I18n.t('merchants.partner_admin_label'),
          label_body: nil
        }
      elsif profile.dig(:properties, :role) == 'merchant_new' && profile.dig(:properties, :applicant).blank?
        if merchant.present?
          # Continue onboarding.
          {
            uid: profile[:uid],
            role: 'merchant_new',
            btn_value: I18n.t('merchants.continue_onboarding_label'),
            label_title: I18n.t('merchants.continue_onboarding_label'),
            label_body: name
          }
        end
      elsif profile.dig(:properties, :role) == 'merchant_add'
        # Add new business.
        {
          uid: profile[:uid],
          role: 'merchant_add',
          btn_value: I18n.t('merchants.new_business_label'),
          label_title: I18n.t('merchants.new_business_label'),
          label_body: nil
        }
      else
        # Already onboarded.
        {
          uid: profile[:uid],
          role: 'merchant_new',
          btn_value: name,
          label_title: name,
          label_body: business_number.present? ? I18n.t('merchants.business_number_label_html', business_number: business_number).html_safe : nil
        }
      end
    end
  end
  # rubocop:enable Metrics/PerceivedComplexity, Metrics/CyclomaticComplexity

  #
  # Authorization: will automatically call Ability.authorize!(:choose_account, :user_sessions)
  #
  def choose_account
    # Read values from existing session
    return_path = session[:return_to]
    params = { invoice_id: current_invoice_id, flow: current_flow }.compact

    sign_in_user(load_user, choose_params) # Creates a new session

    redirect_to return_path || root_path(**params)
  end

  #
  # Authorization: will automatically call Ability.authorize!(:auto_choose_account, :user_sessions)
  #
  def auto_choose_account
    # Read values from existing session
    return_path = session[:return_to]
    params = { invoice_id: current_invoice_id, flow: current_flow }.compact

    sign_in_user(load_user, choose_params) # Creates a new session

    redirect_to return_path || certification_path(**params)
  end

  #
  # Authorization: will automatically call Ability.authorize!(:switch_account, :user_sessions)
  #
  def switch_account
    return_path = session[:return_to]
    sign_in_user(load_user, choose_params)
    redirect_to return_path || root_path
  end

  #
  # Authorization: will automatically call Ability.authorize!(:destroy, :user_sessions)
  #
  def destroy
    sign_out_user
    redirect_to new_merchant_path
  end

  #
  # No authorization on this endpoint
  #
  def backchannel_logout
    backchannel_logout_service.logout(backchannel_params)
    render status: 200, json: {}.to_json
  rescue BackchannelLogoutService::InvalidToken, ActionController::ParameterMissing => e
    render status: 400, json: { message: e.message }.to_json
  rescue BackchannelLogoutService::LogoutFailed
    render status: 501, json: {}.to_json
  end

  #
  # Authorization: will automatically call Ability.authorize!(:delegated_logout, :user_sessions)
  #
  def delegated_logout
    session.delete(:api_access_token)
    render json: { status: 'SUCCESS' }, status: :ok
  end

  #
  # Authorization: will automatically call Ability.authorize!(:confirm_login, :user_sessions)
  #
  def confirm_login
    locale = confirm_login_params[:locale]
    session[:reauth_return] = confirm_login_params[:reauth_return]
    redirect_to confirm_login_path(locale)
  end

  #
  # Authorization: will automatically call Ability.authorize!(:reauthenticated, :user_sessions)
  #
  def reauthenticated
    redirect_to('/#/certification') unless session.key?(:reauth_return)

    # Can't explicitly test this branch as you are not able to manipulate the session in minitest in Rails 5+.
    # :nocov:
    redirect_to("/#/#{session[:reauth_return]}") if session.key?(:reauth_return)
    # :nocov:
  end

  private

  def clear_session_auto_profile_vars
    session.delete(:merchant_guid)
    session.delete(:applicant_guid)
    session.delete(:profile_guid)
  end

  def find_profile(user)
    return user.find_profile_for_merchant(session[:merchant_guid]) if session[:merchant_guid].present?

    session[:profile_guid].dup if session[:profile_guid].present?
  end

  def check_account
    return redirect_to "#{zetatango_url}/auth/user" if partner_admin_chosen?

    redirect_to root_path unless valid_account_chosen?
  end

  def check_show_accounts
    return redirect_to root_path if user_signed_in?
  end

  def check_session
    return redirect_to new_merchant_path unless session[:zetatango_user].present?
  end

  def valid_account_chosen?
    load_user.profile_info.each do |profile|
      return true if profile[:uid] == choose_params && profile[:properties][:role] != 'partner_admin'
    end

    false
  end

  def partner_admin_chosen?
    load_user.profile_info.each do |profile|
      return true if profile[:uid] == choose_params && profile[:properties][:role] == 'partner_admin'
    end

    false
  end

  def choose_params
    params.require(:profile_uid)
  end

  def user_login(user)
    sign_in_user(user)
  end

  def auth_hash
    request.env['omniauth.auth']
  end

  def backchannel_params
    params.require(:logout_token)
  end

  def confirm_login_params
    params.permit(:reauth_return, :locale)
  end

  def confirm_login_path(locale = nil)
    path = ['/auth/user', '?', {
      auth_options: {
        prompt: :login,
        redirect_uri: '/reauth/user/callback'
      }
    }.to_query]

    path.push('&', { ui_locales: locale }.to_query) if locale

    path.join
  end

  def skip_profile_select?(user)
    profiles = user.filtered_profile_info(current_partner)
    user.filter_out_add_business(profiles).count == 1 && user.first_valid_profile_guid
  end

  def profile_picker_profiles
    profiles = current_user.filtered_profile_info(current_partner)

    profiles = current_user.filter_out_add_business(profiles) unless current_user.can_add_business?(current_partner)
    profiles
  end
end
