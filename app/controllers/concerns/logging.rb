# frozen_string_literal: true

module Logging
  extend ActiveSupport::Concern

  protected

  def append_info_to_payload(payload)
    super

    payload[:request_id] = request.uuid
    payload[:user_agent] = request.user_agent
    payload[:ip_address] = request.ip
    payload[:session_id] = session&.id
    payload[:user_id] = current_user.uid if current_user.present?
  end
end
