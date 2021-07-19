# frozen_string_literal: true

require 'ztt_client'

class Api::V1::BankAccountController < ApplicationController
  include FlinksHelper

  #
  # Authorization: will automatically call Ability.authorize!(:flinks, :bank_account)
  #
  def flinks
    Rails.logger.info('FLINKS : connect redirected')
    if current_access_token
      clear_flinks_data
      owner_guid = current_user.owner_guid

      payload = {
        owner_guid: owner_guid,
        login_id: flinks_params[:loginId],
        institution_name: flinks_params[:institution],
        owner: flinks_params[:owner]
      }
      Rails.logger.info("FLINKS : storing login id for #{flinks_params[:institution]}")
      response = RestClient::Request.execute(
        method: :post,
        url: "#{Rails.configuration.zetatango_url}api/flinks/logins",
        payload: payload,
        timeout: 220,
        headers: headers_for(current_access_token)
      )
      request_id = JSON.parse(response&.body)['request_id'] if response.body.present?
      Rails.logger.info("FLINKS : storing flinks route: #{flinks_params[:flinks_route]}")
      store_flinks_data(request_id, flinks_params[:flinks_route], owner_guid)
    end
    redirect_to "#{foghorn_url}/"
  rescue RestClient::Exception => e
    response = JSON.parse(e.response.body).symbolize_keys if e.response.body.present?
    Rails.logger.warn("FLINKS : Got exception from flinks login: #{response}")
    render json: { status: response[:status], code: response[:code], message: response[:message] }, status: response[:status]
  end

  def flinks_request_state
    return render json: { status: 'Error', message: 'Access token is not available.' }, status: :unauthorized unless current_access_token

    response = RestClient::Request.execute(
      method: :get,
      url: "#{Rails.configuration.zetatango_url}api/flinks/logins/#{params[:request_id]}",
      timeout: 220,
      headers: headers_for(current_access_token)
    )

    state = JSON.parse(response&.body).symbolize_keys[:state] if response.body.present?
    Rails.logger.debug "RESPONDING JSON #{response.inspect}"
    # TODO: remove `message` field
    render json: { status: response.code, message: 'query completed', data: state }, status: response.code
  rescue RestClient::Exception => e
    response = JSON.parse(e.response.body).symbolize_keys if e.response.body.present?
    Rails.logger.warn("FLINKS : Got exception from polling flinks request state: #{response}")
    render json: { status: response[:status], code: response[:code], message: response[:message] }, status: response[:status]
  end

  protected

  def headers_for(current_access_token)
    { accept: 'application/json',
      "Content-Type": 'application/json',
      Authorization: "Bearer #{current_access_token}" }
  end

  def flinks_params
    params.permit(:loginId, :clientId, :institution, :flinks_route, :owner)
  end
end
