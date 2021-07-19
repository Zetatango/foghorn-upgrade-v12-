# frozen_string_literal: true

require_relative '../test_helper'

class FlinksFlow < ActionDispatch::IntegrationTest
  def initialize(options = {})
    super(options)

    @ft = options[:fixtures]
    @access_token = options[:token]
    @merchant = options[:merchant]
  end

  def main_flow
    #      - POST /api/flinks/logins
    flinks_login = post_flinks_authorize
    if flinks_login[:SecurityChallenges].present?
      flinks_login = post_flinks_authorize_2fa(request_id: flinks_login[:RequestId],
                                               security_question: flinks_login[:SecurityChallenges].first[:Prompt])
    end
    login_id = flinks_login[:Login][:Id]
    flinks_response = post_flinks_login(owner_guid: @merchant[:id],
                                        login_id: login_id,
                                        institution_name: flinks_institution)
    #      - poll ztt to know if flinks is done: GET /flinks/logins/:request_id
    polling_flinks = flinks_response[:state] == 'pending'
    i = 0
    while polling_flinks && i < 10
      response = get_flinks_login(request_id: flinks_response[:request_id])
      puts "\u{3030}Polling for flinks_login..."
      polling_flinks = response[:state] == 'pending'
      i += 1
      sleep 3
    end
  end

  private

  def flinks_institution
    Rails.application.secrets.flinks[:flinks_uri]
  end
end
