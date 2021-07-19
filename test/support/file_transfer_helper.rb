# frozen_string_literal: true

module FileTransferHelper
  extend ActiveSupport::Concern

  def file_transfer_api_url(host)
    "#{host}api/file_transfer"
  end

  def file_transfer_api_path
    '/api/file_transfer'
  end

  def stub_default_roadrunner_responses
    stub_jwks_response

    response_body = {
      access_token: SecureRandom.base58(32),
      token_type: 'bearer',
      expires_in: 7200,
      refresh_token: '',
      scope: Rails.application.secrets.idp_api[:credentials][:scope]
    }.to_json

    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .with(body: { client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
                    client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
                    scope: Rails.application.secrets.idp_api[:credentials][:scope],
                    grant_type: 'client_credentials' })
      .to_return(status: 200, body: response_body)
  end
end
