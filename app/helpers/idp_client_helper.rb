# frozen_string_literal: true

module IdpClientHelper
  protected

  def idp_client(user_access_token = current_access_token)
    IdPService.new(user_access_token)
  end
end
