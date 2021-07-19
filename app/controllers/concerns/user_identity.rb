# frozen_string_literal: true

module UserIdentity
  include UserSessionHelper
  extend ActiveSupport::Concern

  protected

  def authenticate_user!
    signed_in = user_signed_in? || redirected_user_signed_in?
    session[:return_to] = request.fullpath unless signed_in
    redirect_to '/auth/user' unless signed_in
  end

  def current_access_token
    return redirected_user_access_token if redirected_user_signed_in?
    return load_user.access_token if user_signed_in?

    nil
  end

  def redirected_user_access_token
    session[:api_access_token]
  end

  def redirected_user_signed_in?
    session.key?(:api_access_token) && session[:api_access_token].present?
  end

  def log_user_id
    Rails.logger.info "[UID: #{current_user.uid}]" if user_signed_in?
  end
end
