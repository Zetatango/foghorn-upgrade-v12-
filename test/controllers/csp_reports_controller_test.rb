# frozen_string_literal: true

require 'test_helper'

class CspReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @csp_report = {
      "csp-report": {
        "document-uri": 'http://test.zetatango.local',
        referrer: '',
        "violated-directive": 'img-src',
        "effective-directive": 'img-src',
        "original-policy": "default-src 'none'; report-uri /csp_reports",
        disposition: 'enforce',
        "blocked-uri": 'http://test.zetatango.local:3000/assets/favicon.ico',
        "status-code": 200,
        "script-sample": ''
      }
    }.to_json
  end

  test 'CSP report endpoint returns ok status' do
    post csp_reports_path, params: @csp_report
    assert_response :ok
  end

  test 'CSP report endpoint logs received CSP violation report' do
    report = JSON.parse(@csp_report)
    message = "CSP Report: #{report['csp-report'].to_json}"
    assert_logs :info, message do
      post csp_reports_path, params: @csp_report
    end
  end
end
