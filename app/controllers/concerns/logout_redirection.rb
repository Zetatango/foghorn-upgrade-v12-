# frozen_string_literal: true

module LogoutRedirection
  extend ActiveSupport::Concern

  protected

  def roadrunner_logout_url
    roadrunner_url('/users/sign_out', redirect: logout_redirect_location.to_s)
  end

  private

  def logout_redirect_location
    "#{root_url}/logout"
  end
end
