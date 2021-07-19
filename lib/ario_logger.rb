# frozen_string_literal: true

# :nocov:
module ArioLogger
  include ActiveSupport::TaggedLogging

  def self.new(logger)
    logger.formatter ||= ActiveSupport::Logger::SimpleFormatter.new
    logger.formatter.extend Formatter
    logger.extend(self)
  end

  module Formatter
    include ActiveSupport::TaggedLogging::Formatter
    def call(severity, timestamp, progname, msg)
      return unless msg.present?

      msg = msg.dup.force_encoding('UTF-8') if msg.is_a? String

      severity_tag = case severity
                     when 'ERROR', 'FATAL'
                       msg = '!! '.bold + msg.to_s.strip.light_red
                       severity.light_red
                     when 'INFO'
                       msg = "\u2219 ".bold + msg.to_s.strip.grey
                       severity.yellow
                     when 'DEBUG'
                       msg = "\u2023 ".bold + msg.to_s.strip.grey
                       severity.cyan
                     else
                       severity
                     end

      message = format_message(severity_tag, timestamp, msg, tags_text)

      self.class.instance_method(:call).bind(self).call(severity, timestamp, progname, message)
    rescue Encoding::CompatibilityError => e
      output_rescue(e)
    end

    private

    def format_message(severity_tag, timestamp, msg, tags_text)
      message = ''
      if "#{@stored_severity} #{@stored_tags}" != "#{severity_tag} #{tags_text}"
        message += "\n[#{severity_tag}]"
        message += "[#{timestamp.strftime('%X')}]" unless ENV['MIN_LOGS'] == 'true'
        message += " #{tags_text}" unless tags_text.blank?
        message += "\n"
      end
      message += msg

      @stored_severity = severity_tag
      @stored_tags = tags_text

      message
    rescue Encoding::CompatibilityError => e
      output_rescue(e)
    end

    def output_rescue(err)
      puts '!! '.bold + "Ario Logger Rescued: #{err.inspect}".red
      puts "\n#{exception.backtrace.join('\n')}".red
    end
  end
end
# :nocov:
