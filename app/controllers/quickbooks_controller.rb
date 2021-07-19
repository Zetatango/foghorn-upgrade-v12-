# frozen_string_literal: true

require 'ztt_client'

class QuickbooksController < OmniauthProviderBaseController
  PROVIDER = 'Quickbooks'
  QUICKBOOKS_REALMID_CHANGED_SERVER_ERROR_CODE = 20_008
  QUICKBOOKS_REALMID_CHANGED_CLIENT_ERROR_CODE = 'REALM_ID_CHANGED'

  rescue_from StandardError do |e|
    handle_standard_error(e)
  end

  private

  def provider
    PROVIDER
  end

  def callback_merchant_info
    {
      quickbooks_refresh_token: callback_refresh_token,
      quickbooks_refresh_token_expires_at: callback_refresh_token_expires_at,
      quickbooks_realm_id: callback_realm_id
    }
  end

  def callback_refresh_token_expires_at
    refresh_token_expires_in = request.env.dig('omniauth.auth', :extra, :raw_info, :x_refresh_token_expires_in)
    raise InvalidOmniauthProviderResponseError, 'x_refresh_token_expires_in missing from the QuickBooks response' unless refresh_token_expires_in.present?

    Time.now.utc + refresh_token_expires_in.to_i.seconds
  end

  def callback_refresh_token
    refresh_token = request.env.dig('omniauth.auth', :credentials, :refresh_token)
    raise InvalidOmniauthProviderResponseError, 'Refresh token not present in the QuickBook response' unless refresh_token.present?

    refresh_token
  end

  def callback_realm_id
    realm_id = params[:realmId]
    raise InvalidOmniauthProviderResponseError, 'Realm ID not specified in QuickBooks response' unless realm_id.present?

    realm_id
  end

  def handle_callback_error(err)
    return super unless realmid_changed_error?(err)

    Rails.logger.info('Merchant QuickBooks realm ID changed error')
    finalize(context[:return_url], FAILURE_STATUS, QUICKBOOKS_REALMID_CHANGED_CLIENT_ERROR_CODE)
  end

  def realmid_changed_error?(err)
    return false unless err.respond_to?(:response_body) && err.response_body.present?

    response_hash = JSON.parse(err.response_body, symbolize_names: true)
    response_hash[:code] == QUICKBOOKS_REALMID_CHANGED_SERVER_ERROR_CODE
  rescue JSON::ParserError
    false
  end
end
