# frozen_string_literal: true

require 'logger/json_formatter'

class CaptureLogs
  RACK_LOGGER = 'rack.logger'

  class AccumulatorIO < StringIO
    def initialize
      super
      @logs = []
    end

    def write(log)
      @logs << log
      super(log)
    end

    attr_reader :logs
  end

  class CapturingLogger < ActiveSupport::Logger
    def initialize(strio)
      super
      @strio = strio
    end

    def captured_output
      @strio.logs
    end
  end

  def initialize(app, captured_loggers)
    @app = app
    @captured_loggers = captured_loggers
  end

  def call(env)
    AccumulatorIO.open do |strio|
      @strio = strio

      logger = CapturingLogger.new(strio)
      logger.formatter = Logger::JSONFormatter.new
      tagged_logger = ActiveSupport::TaggedLogging.new(logger)

      @captured_loggers.each { |o| o.logger = tagged_logger }
      env[RACK_LOGGER] = tagged_logger

      status, headers, body = @app.call(env)
      @strio = nil

      [status, headers, body]
    end
  end
end
