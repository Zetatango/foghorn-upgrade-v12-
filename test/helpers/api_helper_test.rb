# frozen_string_literal: true

require 'test_helper'

class ApiHelperTest < ActionView::TestCase
  include HerokuHelper

  test 'parse_api_error returns hash when exception response is JSON' do
    e = SwaggerClient::ApiError.new(response_body: '{"message": "", "code": 20100, "status": 400}')
    result = parse_api_error(e)
    assert_kind_of Hash, result
    assert_equal %i[message code status], result.keys
  end

  test 'parse_api_error returns hash when exception response is not JSON' do
    e = SwaggerClient::ApiError.new(response_body: '500: Internal Server')

    result = parse_api_error(e)
    assert_kind_of Hash, result
    assert_equal %i[message code status], result.keys
  end

  test 'parse_api_error returns hash when exception has no response body' do
    e = SwaggerClient::ApiError.new

    result = parse_api_error(e)
    assert_kind_of Hash, result
    assert_equal %i[message code status], result.keys
  end

  test 'parse_api_error logs response body if it is not parseable' do
    e = SwaggerClient::ApiError.new(response_body: 'hello', code: 401)
    log_message = 'Could not parse SwaggerClient::ApiError resp : hello code: 401'

    assert_logs :warn, log_message do
      parse_api_error(e)
    end
  end

  test 'parse_api_error logs empty response_body if response_body not set' do
    e = SwaggerClient::ApiError.new('Unauthorized')
    log_message = 'Could not parse SwaggerClient::ApiError resp :  code: '

    assert_logs :warn, log_message do
      parse_api_error(e)
    end
  end

  test 'parse_api_error does not cause bugsnag when response_body is not present' do
    e = SwaggerClient::ApiError.new('error')

    Bugsnag.expects(:notify).never
    parse_api_error(e)
  end

  test 'parse_api_error causes bugsnag when response_body is malformed' do
    e = SwaggerClient::ApiError.new(response_body: '401 Unauthorized')

    Bugsnag.expects(:notify)
    parse_api_error(e)
  end

  test 'parse_api_error does not cause bugsnag when response_body is valid json' do
    e = SwaggerClient::ApiError.new(response_body: '{"message": "", "code": 20100, "status": 400}')

    Bugsnag.expects(:notify).never
    parse_api_error(e)
  end

  test 'parse_api_error does not raise a bugsnag on service unavailable' do
    e = SwaggerClient::ApiError.new(
      response_body: heroku_service_unavailable_html,
      code: 503
    )

    Bugsnag.expects(:notify).never
    parse_api_error(e)
  end
end
