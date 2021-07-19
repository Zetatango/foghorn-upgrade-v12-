# frozen_string_literal: true

class NotificationChannel < ApplicationCable::Channel
  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
