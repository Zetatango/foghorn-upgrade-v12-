# frozen_string_literal: true

class UtilsController < ApplicationController
  #
  # Do not enforce authz on the root action of the root controller, anyone visiting foghorn should be able to be
  # routed by this action
  #
  skip_authorization_check only: %i[root]

  #
  # No authorization
  #
  def root
    if redirected_user_signed_in?
      redirect_to merchant_path(redirect_params)
    elsif user_signed_in?
      return redirect_to "#{zetatango_url}/auth/user" if current_user.partner_admin?

      redirect_to merchant_path(redirect_params)
    else
      redirect_to merchant_welcome_redirect? ? merchant_welcome_redirect_url('sign_in') : new_merchant_path(redirect_params)
    end
  end

  private

  def redirect_params
    params.permit(:locale, :invoice_id, :flow)
  end
end
