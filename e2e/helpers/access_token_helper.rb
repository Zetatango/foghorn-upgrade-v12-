# frozen_string_literal: true

module AccessTokenHelper
  def access_token_after_sandbox_reset(overrides = {})
    @idp_token = get_access_token(overrides)
    temp_token = new_app_access_token(@idp_token)
    reset_sandbox(temp_token)
    # Generate a new access token, because reset_sandbox removed 'new_app'
    new_app_access_token(@idp_token)
  end

  def access_token_no_reset(overrides = {})
    # get idp token
    @idp_token = get_access_token(overrides)
    # get new app access token i.e. for ztt
    new_app_access_token(@idp_token)
  end

  def new_app_access_token(access_token)
    partner_id, partner_secret = create_application(access_token)
    get_access_token(client_id: partner_id, client_secret: partner_secret, scope: 'ztt:api')
  end

  def get_access_token(overrides = {})
    endpoint, headers, payload = get_access_token_data(overrides)
    response = RestClient::Request.execute(method: :post,
                                           url: endpoint,
                                           headers: headers,
                                           payload: payload)

    JSON.parse(response.body, symbolize_names: true)[:access_token]
  end

  def create_application(token)
    endpoint, headers, payload = create_application_data({}, token: token)
    response = RestClient::Request.execute(method: :post,
                                           url: endpoint,
                                           headers: headers,
                                           payload: payload)

    client_info = JSON.parse(response.body, symbolize_names: true)

    [client_info[:client_id], client_info[:client_secret]]
  end

  private

  def get_access_token_data(overrides = {})
    endpoint = "#{idp_url}/oauth/token"
    headers = {}
    payload = {
      grant_type: :client_credentials,
      client_id: Rails.application.secrets.ztt_doorkeeper_app[:credentials][:client_id],
      client_secret: Rails.application.secrets.ztt_doorkeeper_app[:credentials][:client_secret],
      scope: Rails.application.secrets.ztt_doorkeeper_app[:credentials][:scope]
    }.merge(overrides)

    [endpoint, headers, payload]
  end

  def create_application_data(overrides = {}, options = {})
    endpoint = "#{idp_url}/api/clients/applications"
    headers = {
      'Authorization' => "Bearer #{options[:token]}"
    }
    payload = {
      name: 'Default application',
      scopes: 'ztt:api',
      parameters: {
        partner: @partner_id # TODO: pass fixture partner
      }.to_json
    }.merge(overrides)

    [endpoint, headers, payload]
  end

  def idp_url
    Rails.configuration.e2e_roadrunner_url
  end
end
