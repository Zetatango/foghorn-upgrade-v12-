# frozen_string_literal: true

module FlinksApi
  def post_flinks_authorize(overrides = {})
    endpoint = "#{flinks_api_url}/v3/#{flinks_user_id}/BankingServices/Authorize"
    headers = {
      "content-type": 'application/json'
    }
    payload = {
      Institution: 'FlinksCapital',
      Username: 'Greatday',
      Password: 'Everyday',
      Save: true,
      MostRecentCached: false,
      Tag: 'someValue'
    }.merge(overrides)

    execute_request(:post, endpoint, headers, payload.to_json)
  end

  def post_flinks_authorize_2fa(overrides = {})
    endpoint = "#{flinks_api_url}/v3/#{flinks_user_id}/BankingServices/Authorize"
    headers = {
      "content-type": 'application/json'
    }
    payload = {
      RequestId: overrides[:request_id],
      Institution: 'FlinksCapital',
      Username: 'Greatday',
      Password: 'Everyday',
      SecurityResponses: {
        "#{overrides[:security_question]}": [flinks_security_answers[overrides[:security_question].to_sym].to_s]
      }
    }

    execute_request(:post, endpoint, headers, payload.to_json)
  end

  def flinks_security_answers
    {
      "What city were you born in?": 'Montreal',
      "What is the best country on earth?": 'Canada',
      "What shape do people like most?": 'Triangle'
    }
  end

  def delete_flinks_login(overrides = {})
    endpoint = "#{flinks_api_url}/v3/#{flinks_user_id}/BankingServices/DeleteCard/#{overrides[:login_id]}"
    headers = {
      "content-type": 'application/json'
    }
    payload = {}.merge(overrides)

    execute_request(:delete, endpoint, headers, payload.to_json)
  end

  def flinks_api_url
    Rails.application.secrets.flinks[:flinks_api_url]
  end

  def flinks_user_id
    Rails.application.secrets.flinks[:user_id]
  end
end
