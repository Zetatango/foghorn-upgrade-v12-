# frozen_string_literal: true

require 'ztt_client'

class JwtController < ApplicationController
  before_action :download_access_token, only: :merchant_auth

  rescue_from ActionController::ParameterMissing do
    render file: "#{Rails.root}/public/404.html", layout: false, status: :bad_request
  end

  #
  # Do not enforce authz on the merchant_auth endpoint, access is govered by the delegated access token passed in
  #
  skip_authorization_check only: %i[merchant_auth]

  #
  # No authorization
  #
  def merchant_auth
    session[:api_access_token] = api_access_token
    redirect_to root_path
  end

  private

  def download_access_token
    render file: "#{Rails.root}/public/404.html", layout: false, status: :not_found if api_access_token.blank?
  end

  def api_access_token
    @api_access_token ||= ApiAccessTokenService.new(jwt_params).api_access_token
  end

  def jwt_params
    params.require(:jwt)
  end
end
