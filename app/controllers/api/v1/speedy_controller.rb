# frozen_string_literal: true

class Api::V1::SpeedyController < ApplicationController
  before_action :validate_token
  before_action :validate_create_params, only: :create
  before_action :validate_index_params, only: :index

  # GET /api/v1/speedy/jobs/
  def index
    data = speedy_service.get_jobs(params[:name], params[:state])

    render json: { status: 'Success', data: data }, status: :ok
  rescue Speedy::JobsService::SpeedyServiceException => e
    render json: { status: 'Error', message: e.message }, status: :unprocessable_entity
  end

  # POST /api/v1/speedy/jobs
  def create
    case new_job_params[:name]
    when Speedy::JobsService::PROJECTION_JOB
      data = speedy_service.create_projection_job(new_job_params[:foreground], new_job_params[:account_uuids])
    when Speedy::JobsService::PROCESS_FLINKS_TRANSACTIONS_JOB
      data = speedy_service.create_process_flinks_transactions_job(new_job_params[:foreground], new_job_params[:file_path])
    end

    render json: { status: 'Success', data: data }, status: :created
  rescue Speedy::JobsService::SpeedyServiceException => e
    render json: { status: 'Error', message: e.message }, status: :unprocessable_entity
  end

  # GET /api/v1/speedy/jobs/:id
  def show
    data = speedy_service.get_job(params[:id])

    render json: { status: 'Success', data: data }, status: :ok
  rescue Speedy::JobsService::SpeedyServiceException => e
    render json: { status: 'Error', message: e.message }, status: :unprocessable_entity
  end

  private

  def new_job_params
    params.permit(:name, :foreground, :file_path, account_uuids: [])
  end

  def validate_index_params
    name = params[:name]
    state = params[:state]
    jobs = Speedy::JobsService::ALL_JOBS
    states = Speedy::JobsService::ALL_STATES

    return render json: { status: 'Error', message: 'Job name is not valid' }, status: :bad_request if name.present? && !jobs.include?(name)

    return render json: { status: 'Error', message: 'State is not valid' }, status: :bad_request if state.present? && !states.include?(state)
  end

  # rubocop:disable Metrics/CyclomaticComplexity
  def validate_create_params
    name = new_job_params[:name]
    foreground = new_job_params[:foreground]
    account_uuids = new_job_params[:account_uuids]
    file_path = new_job_params[:file_path]

    return render json: { status: 'Error', message: 'Required parameter name is missing' }, status: :bad_request if name.blank?
    return render json: { status: 'Error', message: 'Required parameter foreground is missing' }, status: :bad_request if foreground.nil?
    return render json: { status: 'Error', message: 'Job name is not valid' }, status: :bad_request unless Speedy::JobsService::ALL_JOBS.include?(name)

    case name
    when Speedy::JobsService::PROJECTION_JOB
      return render json: { status: 'Error', message: 'Required parameter account_uuids is missing' }, status: :bad_request if account_uuids.blank?
    when Speedy::JobsService::PROCESS_FLINKS_TRANSACTIONS_JOB
      return render json: { status: 'Error', message: 'Required parameter file_path is missing' }, status: :bad_request if file_path.blank?
    end
  end
  # rubocop:enable Metrics/CyclomaticComplexity

  def speedy_service
    @speedy_service ||= Speedy::JobsService.new(current_access_token)
  end
end
