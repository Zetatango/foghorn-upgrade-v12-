# frozen_string_literal: true

class Logger::JSONFormatter < ActiveSupport::Logger::SimpleFormatter
  def call(severity, timestamp, _program, message)
    {
      type: severity,
      time: timestamp.utc,
      message: parse(message)
    }
  end

  private

  def parse(message)
    if message.is_a?(String)
      JSON.parse(message)
    else
      message
    end
  rescue JSON::ParserError
    message
  end
end
