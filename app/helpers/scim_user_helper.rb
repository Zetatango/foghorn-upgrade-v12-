# frozen_string_literal: true

module ScimUserHelper
  private

  def scim_api_users_url(user_guid = nil)
    base = "#{Rails.configuration.roadrunner_url}api/scim/v2/Users"

    return base if user_guid.nil?

    "#{base}/#{user_guid}"
  end

  def scim_urn_ario_extension
    'urn:ietf:params:scim:schemas:extension:ario:2.0:User'
  end
end
