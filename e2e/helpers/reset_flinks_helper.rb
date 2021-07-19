# frozen_string_literal: true

module ResetFlinksHelper
  def reset_flinks
    puts '', 'Resetting Flinks LoginID', ''
    #      - POST /api/flinks/logins
    flinks_login = post_flinks_authorize
    if flinks_login[:SecurityChallenges].present?
      flinks_login = post_flinks_authorize_2fa(request_id: flinks_login[:RequestId],
                                               security_question: flinks_login[:SecurityChallenges].first[:Prompt])
    end
    login_id = flinks_login[:Login][:Id]
    puts "\u{2714} Successfully logged in with Flinks"

    delete_response = delete_flinks_login(login_id: login_id)
    status = delete_response[:StatusCode] == 200 ? "\u{2714}" : "\u{2718}"
    puts "#{status} #{delete_response[:Message]}", ''
  rescue RestClient::Exceptions::ReadTimeout => e
    puts "\u{2718} Flinks delete request timed out #{e}", ''
  end
end
