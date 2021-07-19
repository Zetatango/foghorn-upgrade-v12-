# frozen_string_literal: true

require 'test_helper'

class Speedy::JobsServiceTest < ActiveSupport::TestCase
  include SpeedyTestHelper

  setup do
    access_token = SecureRandom.base58(16)

    @service = Speedy::JobsService.new(access_token)

    @projection_job_uuid = SecureRandom.uuid
  end

  test '#get_jobs - will handle speedy not running' do
    stub_speedy_get_query_not_running

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.get_jobs(nil, nil)
    end
  end

  test '#get_jobs - will handle timeout error from speedy' do
    stub_speedy_get_query_timeout

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.get_jobs(nil, nil)
    end
  end

  test '#get_jobs - will handle query exception from speedy' do
    stub_speedy_get_query_exception

    assert_raises(Speedy::JobsService::ApiException) do
      @service.get_jobs(nil, nil)
    end
  end

  test '#get_jobs - will handle query parse error from speedy' do
    stub_speedy_get_query_parse_error

    assert_raises(Speedy::JobsService::MalformedResponseException) do
      @service.get_jobs(nil, nil)
    end
  end

  test '#get_jobs - will return jobs data 1/2' do
    stub_speedy_jobs_query

    response = @service.get_jobs(nil, nil)
    response[:jobs].each do |job|
      assert job.key?(:uuid)
      assert job.key?(:name)
      assert job.key?(:owner_guid)
      assert job.key?(:state)
    end
  end

  test '#get_jobs - will return jobs data 2/2' do
    params = { name: 'ProjectionJob', state: 'running' }

    stub_speedy_jobs_query(nil, options: params)

    response = @service.get_jobs(params[:name], params[:state])
    response[:jobs].each do |job|
      assert job.key?(:uuid)
      assert job.key?(:name)
      assert job.key?(:owner_guid)
      assert job.key?(:state)
    end
  end

  test '#get_job - will handle speedy not running' do
    stub_speedy_get_query_not_running(@projection_job_uuid)

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.get_job(@projection_job_uuid)
    end
  end

  test '#get_job - will handle timeout error from speedy' do
    stub_speedy_get_query_timeout(@projection_job_uuid)

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.get_job(@projection_job_uuid)
    end
  end

  test '#get_job - will handle query exception from speedy' do
    stub_speedy_get_query_exception(@projection_job_uuid)

    assert_raises(Speedy::JobsService::ApiException) do
      @service.get_job(@projection_job_uuid)
    end
  end

  test '#get_job - will handle query parse error from speedy' do
    stub_speedy_get_query_parse_error(@projection_job_uuid)

    assert_raises(Speedy::JobsService::MalformedResponseException) do
      @service.get_job(@projection_job_uuid)
    end
  end

  test '#get_job - will return job data' do
    stub_speedy_jobs_query(@projection_job_uuid)

    response = @service.get_job(@projection_job_uuid)
    assert response.key?(:uuid)
    assert response.key?(:name)
    assert response.key?(:owner_guid)
    assert response.key?(:state)
  end

  test '#create_projection_job - will handle speedy not running' do
    stub_speedy_post_query_not_running

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.create_projection_job(true, [SecureRandom.uuid])
    end
  end

  test '#create_projection_job - will handle timeout error from speedy' do
    stub_speedy_post_query_timeout

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.create_projection_job(true, [SecureRandom.uuid])
    end
  end

  test '#create_projection_job - will handle query exception from speedy' do
    stub_speedy_post_query_exception

    assert_raises(Speedy::JobsService::ApiException) do
      @service.create_projection_job(true, [SecureRandom.uuid])
    end
  end

  test '#create_projection_job - will handle query parse error from speedy' do
    stub_speedy_post_query_parse_error

    assert_raises(Speedy::JobsService::MalformedResponseException) do
      @service.create_projection_job(true, [SecureRandom.uuid])
    end
  end

  test '#create_projection_job - will return job data' do
    account_uuids = [SecureRandom.uuid]
    params = {
      name: 'ProjectionJob',
      foreground: true,
      account_uuids: account_uuids
    }.to_json
    stub_speedy_post_jobs_query(params)

    response = @service.create_projection_job(true, account_uuids)
    assert response.key?(:uuid)
    assert response.key?(:name)
    assert response.key?(:owner_guid)
    assert response.key?(:state)
  end

  test '#create_process_flinks_transactions_job - will handle speedy not running' do
    stub_speedy_post_query_not_running

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.create_process_flinks_transactions_job(true, 'path_to_s3')
    end
  end

  test '#create_process_flinks_transactions_job - will handle timeout error from speedy' do
    stub_speedy_post_query_timeout

    assert_raises(Speedy::JobsService::ConnectionException) do
      @service.create_process_flinks_transactions_job(true, 'path_to_s3')
    end
  end

  test '#create_process_flinks_transactions_job - will handle query exception from speedy' do
    stub_speedy_post_query_exception

    assert_raises(Speedy::JobsService::ApiException) do
      @service.create_process_flinks_transactions_job(true, 'path_to_s3')
    end
  end

  test '#create_process_flinks_transactions_job - will handle query parse error from speedy' do
    stub_speedy_post_query_parse_error

    assert_raises(Speedy::JobsService::MalformedResponseException) do
      @service.create_process_flinks_transactions_job(true, 'path_to_s3')
    end
  end

  test '#create_process_flinks_transactions_job - will return job data' do
    params = {
      name: 'ProcessFlinksTransactionsJob',
      foreground: true,
      file_path: 'path_to_s3'
    }.to_json
    stub_speedy_post_jobs_query(params)

    response = @service.create_process_flinks_transactions_job(true, 'path_to_s3')
    assert response.key?(:uuid)
    assert response.key?(:name)
    assert response.key?(:owner_guid)
    assert response.key?(:state)
  end
end
