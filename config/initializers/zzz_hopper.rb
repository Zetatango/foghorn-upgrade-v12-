# frozen_string_literal: true

# :nocov:
def publishing_supported?
  return false unless Rails.application.secrets.rabbitmq[:enabled]

  # scheduler and clock dynos
  Rails.env.development? || Rails.env.production? && %w[web worker release console].include?(ENV.fetch('DYNO_TYPE', 'console'))
end

def listening_supported?
  # only web dynos should be listening for messages
  Rails.env.development? || (Rails.env.production? && ENV.fetch('DYNO_TYPE', '') == 'web')
end

if publishing_supported?
  # TODO: remove next return when RabbitMQ is deployed --- RabbitMQ transition ---
  return if Rails.env.production? && ENV['RABBITMQ_ENABLED'] != 'true'

  begin
    config = Rails.application.secrets.rabbitmq.merge(
      uncaught_exception_handler: proc do |exception, consumer|
        Rails.logger.error("Uncaught exception from consumer #{consumer}: #{exception.inspect} @ #{exception.backtrace[0]}")

        Bugsnag.notify(exception)
      end
    )
    config[:heartbeat] = 0
    config[:consumer_tag] = "foghorn-#{ENV.fetch('DYNO', Process.pid)}-#{Time.now.to_i * 1000}-#{Kernel.rand(999_999_999_999)}"
    Hopper.init_channel(config)

    if listening_supported?
      Hopper.clear if Rails.env.development? || Rails.env.test?

      Hopper.subscribe(Speedy::JobStateSubscriber, :job_state_event, [HopperEvents::SPEEDY_JOB_STATE])

      Hopper.start_listening
    end
  rescue Hopper::HopperError => e
    Rails.logger.error("Error while initializing Hopper, restart server after issue addressed: #{e.message}")
    Bugsnag.notify(e)
  end
end
# :nocov:
