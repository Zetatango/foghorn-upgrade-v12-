# frozen_string_literal: true

require 'test_helper'

class Api::V1::SpeedyControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @projection_job_uuid = SecureRandom.uuid
    @process_flinks_transactions_job_uuid = SecureRandom.uuid

    @projection_job = {
      uuid: @projection_job_uuid,
      name: 'ProjectionJob',
      owner_guid: "m_#{SecureRandom.base58(16)}",
      state: 'pending'
    }

    @process_flinks_transactions_job = {
      uuid: @process_flinks_transactions_job_uuid,
      name: 'ProcessFlinksTransactionsJob',
      owner_guid: "m_#{SecureRandom.base58(16)}",
      state: 'pending'
    }

    @jobs_response = [@projection_job, @process_flinks_transactions_job]
  end

  #
  # GET /api/v1/speedy/jobs/
  #
  test 'GET /api/v1/speedy/jobs returns unauthorized when user is not signed in' do
    get api_v1_speedy_jobs_url, as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/speedy/jobs returns unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_speedy_jobs_url, as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/speedy/jobs returns bad_request if job name is not valid' do
    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url(name: 'invalid_name'), as: :json
    assert_response :bad_request
  end

  test 'GET /api/v1/speedy/jobs returns bad_request if job state is not valid' do
    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url(name: 'state_name'), as: :json
    assert_response :bad_request
  end

  test 'GET /api/v1/speedy/jobs returns bad_request code when an error occurs getting info (ApiException)' do
    Speedy::JobsService.any_instance.stubs(:get_jobs).raises(Speedy::JobsService::ApiException)

    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url, as: :json
    assert_response :unprocessable_entity
  end

  test 'GET /api/v1/speedy/jobs returns bad_request code when an error occurs getting info (ConnectionException)' do
    Speedy::JobsService.any_instance.stubs(:get_jobs).raises(Speedy::JobsService::ConnectionException)

    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url, as: :json
    assert_response :unprocessable_entity
  end

  test 'GET /api/v1/speedy/jobs returns bad_request code when an error occurs getting info (MalformedResponseException)' do
    Speedy::JobsService.any_instance.stubs(:get_jobs).raises(Speedy::JobsService::MalformedResponseException)

    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url, as: :json
    assert_response :unprocessable_entity
  end

  test 'GET /api/v1/speedy/jobs returns ok on valid request' do
    Speedy::JobsService.any_instance.stubs(:get_jobs).returns(@jobs_response)

    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url, as: :json
    assert_response :ok
  end

  test 'GET /api/v1/speedy/jobs returns jobs data as JSON' do
    returned_value = { status: 'Success', data: @jobs_response }
    Speedy::JobsService.any_instance.stubs(:get_jobs).returns(@jobs_response)

    sign_in_user @merchant_new
    get api_v1_speedy_jobs_url, as: :json
    assert_equal returned_value.to_json, response.body
  end

  #
  # POST /api/v1/speedy/jobs/
  #
  test 'POST /api/v1/speedy/jobs returns unauthorized when user is not signed in' do
    post api_v1_speedy_jobs_url, as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/speedy/jobs returns unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    post api_v1_speedy_jobs_url, as: :json
    assert_response :unauthorized
  end

  test 'POST /api/v1/speedy/jobs returns bad_request if job name is missing' do
    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { foreground: true, file_path: 's3_file_path' }
    assert_response :bad_request
  end

  test 'POST /api/v1/speedy/jobs returns bad_request if job name is invalid' do
    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'invalid_name', foreground: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/speedy/jobs returns bad_request if ProcessFlinksTransactionsJob and file path is missing' do
    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', foreground: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/speedy/jobs returns bad_request if ProjectionJob and account uuids is missing' do
    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProjectionJob', foreground: true }
    assert_response :bad_request
  end

  test 'POST /api/v1/speedy/jobs returns bad_request if job foreground is missing' do
    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', file_path: 's3_file_path' }
    assert_response :bad_request
  end

  test 'POST /api/v1/speedy/jobs returns bad_request code when an error occurs on post (ApiException) 1/2' do
    Speedy::JobsService.any_instance.stubs(:create_process_flinks_transactions_job).raises(Speedy::JobsService::ApiException)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', foreground: true, file_path: 's3_file_path' }
    assert_response :unprocessable_entity
  end

  test 'POST /api/v1/speedy/jobs returns bad_request code when an error occurs on post (ApiException) 2/2' do
    Speedy::JobsService.any_instance.stubs(:create_projection_job).raises(Speedy::JobsService::ApiException)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProjectionJob', foreground: true, account_uuids: [SecureRandom.uuid] }
    assert_response :unprocessable_entity
  end

  test 'POST /api/v1/speedy/jobs returns bad_request code when an error occurs on post (ConnectionException) 1/2' do
    Speedy::JobsService.any_instance.stubs(:create_process_flinks_transactions_job).raises(Speedy::JobsService::ConnectionException)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', foreground: true, file_path: 's3_file_path' }
    assert_response :unprocessable_entity
  end

  test 'POST /api/v1/speedy/jobs returns bad_request code when an error occurs on post (ConnectionException) 2/2' do
    Speedy::JobsService.any_instance.stubs(:create_projection_job).raises(Speedy::JobsService::ConnectionException)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProjectionJob', foreground: true, account_uuids: [SecureRandom.uuid] }
    assert_response :unprocessable_entity
  end

  test 'POST /api/v1/speedy/jobs returns bad_request code when an error occurs on post (MalformedResponseException) 1/2' do
    Speedy::JobsService.any_instance.stubs(:create_process_flinks_transactions_job).raises(Speedy::JobsService::MalformedResponseException)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', foreground: true, file_path: 's3_file_path' }
    assert_response :unprocessable_entity
  end

  test 'POST /api/v1/speedy/jobs returns bad_request code when an error occurs on post (MalformedResponseException) 2/2' do
    Speedy::JobsService.any_instance.stubs(:create_projection_job).raises(Speedy::JobsService::MalformedResponseException)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProjectionJob', foreground: true, account_uuids: [SecureRandom.uuid] }
    assert_response :unprocessable_entity
  end

  test 'POST /api/v1/speedy/jobs returns ok on valid requests 1/2' do
    Speedy::JobsService.any_instance.stubs(:create_process_flinks_transactions_job).returns(@process_flinks_transactions_job)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', foreground: true, file_path: 's3_file_path' }
    assert_response :created
  end

  test 'POST /api/v1/speedy/jobs returns ok on valid requests 2/2' do
    Speedy::JobsService.any_instance.stubs(:create_projection_job).returns(@projection_job)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProjectionJob', foreground: true, account_uuids: [SecureRandom.uuid] }
    assert_response :created
  end

  test 'POST /api/v1/speedy/jobs returns jobs data as JSON 1/2' do
    returned_value = { status: 'Success', data: @process_flinks_transactions_job }
    Speedy::JobsService.any_instance.stubs(:create_process_flinks_transactions_job).returns(@process_flinks_transactions_job)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProcessFlinksTransactionsJob', foreground: true, file_path: 's3_file_path' }
    assert_equal returned_value.to_json, response.body
  end

  test 'POST /api/v1/speedy/jobs returns jobs data as JSON 2/2' do
    returned_value = { status: 'Success', data: @projection_job }
    Speedy::JobsService.any_instance.stubs(:create_projection_job).returns(@projection_job)

    sign_in_user @merchant_new
    post api_v1_speedy_jobs_url, params: { name: 'ProjectionJob', foreground: false, account_uuids: [SecureRandom.uuid] }
    assert_equal returned_value.to_json, response.body
  end

  #
  # GET /api/v1/speedy/jobs/:id
  #
  test 'GET /api/v1/speedy/jobs/:id returns unauthorized when user is not signed in' do
    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/speedy/jobs/:id returns unauthorized when access token missing' do
    sign_in_user @merchant_new
    ApplicationController.any_instance.stubs(:current_access_token).returns(nil)

    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_response :unauthorized
  end

  test 'GET /api/v1/speedy/jobs/:id returns bad_request code when an error occurs getting info (ApiException)' do
    Speedy::JobsService.any_instance.stubs(:get_job).raises(Speedy::JobsService::ApiException)

    sign_in_user @merchant_new
    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_response :unprocessable_entity
  end

  test 'GET /api/v1/speedy/jobs/:id returns bad_request code when an error occurs getting info (ConnectionException)' do
    Speedy::JobsService.any_instance.stubs(:get_job).raises(Speedy::JobsService::ConnectionException)

    sign_in_user @merchant_new
    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_response :unprocessable_entity
  end

  test 'GET /api/v1/speedy/jobs/:id returns bad_request code when an error occurs getting info (MalformedResponseException)' do
    Speedy::JobsService.any_instance.stubs(:get_job).raises(Speedy::JobsService::MalformedResponseException)

    sign_in_user @merchant_new
    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_response :unprocessable_entity
  end

  test 'GET /api/v1/speedy/jobs/:id returns ok on valid request' do
    Speedy::JobsService.any_instance.stubs(:get_job).returns(@projection_job)

    sign_in_user @merchant_new
    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_response :ok
  end

  test 'GET /api/v1/speedy/jobs/:id returns jobs data as JSON' do
    returned_value = { status: 'Success', data: @projection_job }
    Speedy::JobsService.any_instance.stubs(:get_job).returns(@projection_job)

    sign_in_user @merchant_new
    get api_v1_speedy_job_url(@projection_job_uuid), as: :json
    assert_equal returned_value.to_json, response.body
  end
end
