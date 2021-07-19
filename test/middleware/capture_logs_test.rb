# frozen_string_literal: true

require 'test_helper'

class CaptureLogsTest < ActiveSupport::TestCase
  def setup
    @logger = CaptureLogs::CapturingLogger.new(CaptureLogs::AccumulatorIO.new)
    @logger.formatter = Logger::JSONFormatter.new
  end

  class NoToJsonTest
    def initialize(number, string)
      @number = number
      @string = string
    end
  end

  test 'captures all object types (Test 1)' do
    @logger.warn 'This is a string'
    @logger.error 200
    assert_equal 2, @logger.captured_output.count
    assert_equal 'This is a string', @logger.captured_output[0][:message]
    assert_equal 200, @logger.captured_output[1][:message]
  end

  test 'captures all object types (Test 2)' do
    @logger.fatal %w[a b]
    @logger.info NoToJsonTest.new(10, 'Hello!')
    @logger.warn(action: 'login_successful')
    assert_equal 3, @logger.captured_output.count
    assert_equal %w[a b], @logger.captured_output[0][:message]
    assert_kind_of NoToJsonTest, @logger.captured_output[1][:message]
    assert_equal @logger.captured_output[2][:message], action: 'login_successful'
  end

  test 'captures string logs' do
    @logger.info 'This is a test'
    @logger.warn 'Hello!'
    assert_match(/This is a test/, @logger.captured_output.to_json)
    assert_match(/Hello!/, @logger.captured_output.to_json)
  end

  test 'captures json logs' do
    @logger.info(action: 'login_successful')
    assert_equal 1, @logger.captured_output.count
    assert_equal true, @logger.captured_output[0].key?(:message)
    assert_equal @logger.captured_output[0][:message], action: 'login_successful'
  end

  test 'Middleware assigns CapturingLogger to passed objects with loggers' do
    saved_logger = Rails.logger

    app = ->(_env) { [200, { 'Content-Type' => 'text/plain' }, ['All responses are OK']] }
    env = {}

    mw = CaptureLogs.new(app, [Rails])
    mw.call(env) # Simulate Rack calling middleware

    assert_equal true, Rails.logger.is_a?(CaptureLogs::CapturingLogger)
    assert_equal true, env['rack.logger'].is_a?(CaptureLogs::CapturingLogger)

    Rails.logger = saved_logger
  end
end
