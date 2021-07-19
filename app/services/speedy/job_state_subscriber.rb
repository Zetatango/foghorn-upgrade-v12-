# frozen_string_literal: true

class Speedy::JobStateSubscriber
  def self.job_state_event(event_type, event, _source)
    Rails.logger.info("Received RabbitMQ event: #{event} for event type #{event_type}")

    Rails.logger.info("Received #{event[:name]} for #{event[:owner_guid]}, state is #{event[:state]}")

    broadcast = ActionCable.server.broadcast(
      event[:owner_guid],
      {
        job: event[:name],
        state: event[:state],
        event_type: event_type
      }
    )

    Rails.logger.error("Could not notify message for #{event[:owner_guid]}") if broadcast.to_i.zero?
  end
end
