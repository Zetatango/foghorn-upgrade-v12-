# frozen_string_literal: true

class CspReportsController < ApplicationController
  skip_before_action :verify_authenticity_token

  #
  # Do not enforce authz on the create endpoint, anyone visiting foghorn should be able to send CSP reports
  #
  skip_authorization_check only: %i[create]

  #
  # No authorization
  #
  # POST /csp_reports
  def create
    report_base = JSON.parse(request.body.read)
    if report_base.key?('csp-report')
      report = report_base['csp-report']
      Rails.logger.info("CSP Report: #{report.to_json}")
    end
    head :ok
  end
end
