# frozen_string_literal: true

# :nocov:
class ApplicationCable::Channel < ActionCable::Channel::Base
  def subscribed
    stream_from user_identifier
  end
end
# :nocov:
