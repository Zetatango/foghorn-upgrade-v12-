# frozen_string_literal: true

class Api::V1::LogController < ApplicationController
  before_action :validate_params, only: %i[create]

  DEBUG_SEVERITY = 'debug'
  INFO_SEVERITY = 'info'
  WARN_SEVERITY = 'warn'
  ERROR_SEVERITY = 'error'

  def create
    log_debug if log_params[:severity] == DEBUG_SEVERITY
    log_info if log_params[:severity] == INFO_SEVERITY
    log_warning if log_params[:severity] == WARN_SEVERITY
    log_error if log_params[:severity] == ERROR_SEVERITY

    render json: {}, status: :ok
  end

  private

  def validate_params
    return render json: { status: 'Error', message: 'Message is required' }, status: :bad_request if log_params[:message].blank?
    return render json: { status: 'Error', message: 'Severity is required' }, status: :bad_request if log_params[:severity].blank?

    render json: { status: 'Error', message: 'Unknown log severity specified' }, status: :bad_request if log_params[:severity].present? && unknown_severity?
  end

  def log_params
    params.permit(:message, :severity)
  end

  def log_debug
    Rails.logger.debug(log_params[:message])
  end

  def log_info
    Rails.logger.info(log_params[:message])
  end

  def log_warning
    Rails.logger.warn(log_params[:message])
  end

  def log_error
    Rails.logger.error(log_params[:message])
  end

  def unknown_severity?
    return true if log_params[:severity] != DEBUG_SEVERITY && log_params[:severity] != INFO_SEVERITY && log_params[:severity] != WARN_SEVERITY &&
                   log_params[:severity] != ERROR_SEVERITY

    false
  end
end
