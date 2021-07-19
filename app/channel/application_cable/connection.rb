# frozen_string_literal: true

# :nocov:
class ApplicationCable::Connection < ActionCable::Connection::Base
  include TokenHelper
  include UserSessionHelper

  identified_by :user_identifier

  def connect
    self.user_identifier = find_verified_user
  end

  private

  def find_verified_user
    if user_signed_in?
      owner_guid_from_token(current_user.access_token)
    else
      reject_unauthorized_connection
    end
  end

  def session
    env[Rack::RACK_SESSION]
  end
end
# :nocov:
