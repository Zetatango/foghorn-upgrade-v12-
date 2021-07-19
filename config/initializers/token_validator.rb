# frozen_string_literal: true

require 'token_validator'

TokenValidator::ValidatorConfig.configure(
  client_id: Rails.application.secrets.idp_api[:credentials][:client_id],
  client_secret: Rails.application.secrets.idp_api[:credentials][:client_secret],
  requested_scope: Rails.application.secrets.idp_api[:credentials][:scope],
  issuer_url: Rails.configuration.roadrunner_url,
  audience: Rails.configuration.foghorn_url
)
