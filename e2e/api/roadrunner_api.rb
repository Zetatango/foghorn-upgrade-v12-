# frozen_string_literal: true

module RoadrunnerApi
  def post_user_register(overrides = {})
    endpoint = "#{idp_url}/api/users/register"
    payload = {
      partner_guid: 'string',
      merchant_guid: 'string',
      idp_guid: 'string',
      username: 'string'
    }.merge(overrides)

    execute_request(:post, endpoint, auth_headers(@idp_token), payload)
  end

  def idp_url
    Rails.configuration.e2e_roadrunner_url
  end

  def idp_logout_url
    "#{idp_url}/users/sign_out"
  end
end
