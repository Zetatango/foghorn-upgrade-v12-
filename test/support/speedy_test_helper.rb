# frozen_string_literal: true

# rubocop:disable Metrics/ModuleLength
module SpeedyTestHelper
  include DataWarehouseDataStubHelper
  #
  # #REST endpoints
  #
  def stub_speedy_get_query_not_running(job_uuid = nil)
    stub_request(:get, speedy_url(job_uuid)).to_raise(Errno::ECONNREFUSED)
  end

  def stub_speedy_get_query_timeout(job_uuid = nil)
    stub_request(:get, speedy_url(job_uuid)).to_raise(RestClient::Exceptions::Timeout)
  end

  def stub_speedy_get_query_exception(job_uuid = nil)
    stub_request(:get, speedy_url(job_uuid)).to_raise(RestClient::Exception)
  end

  def stub_speedy_get_query_parse_error(job_uuid = nil)
    stub_request(:get, speedy_url(job_uuid)).to_raise(JSON::ParserError)
  end

  def stub_speedy_post_query_not_running
    stub_request(:post, speedy_url).to_raise(Errno::ECONNREFUSED)
  end

  def stub_speedy_post_query_timeout
    stub_request(:post, speedy_url).to_raise(RestClient::Exceptions::Timeout)
  end

  def stub_speedy_post_query_exception
    stub_request(:post, speedy_url).to_raise(RestClient::Exception)
  end

  def stub_speedy_post_query_parse_error
    stub_request(:post, speedy_url).to_raise(JSON::ParserError)
  end

  def stub_speedy_jobs_query(job_uuid = nil, options: {})
    response = job_uuid.present? ? sample_job_response : sample_jobs_response

    stub_request(:get, speedy_url(job_uuid, options: options))
      .to_return({ status: 200, body: response.to_json })
  end

  def stub_speedy_post_jobs_query(params = nil)
    stub_request(:post, speedy_url)
      .with(body: params)
      .to_return({ status: 201, body: sample_job_response.to_json })
  end

  #
  # #GraphQL endpoints
  #
  def stub_speedy_schema_ssl_error
    GraphQL::Client.stubs(:load_schema).raises(OpenSSL::SSL::SSLError)
  end

  def stub_speedy_schema_not_running
    stub_request(:post, speedy_graphql_url).to_raise(Errno::ECONNREFUSED)
  end

  def stub_speedy_schema_timeout
    stub_request(:post, speedy_graphql_url).to_raise(Net::ReadTimeout)
  end

  def stub_speedy_ssl_error
    stub_request(:post, speedy_graphql_url).to_return({ status: 200, body: schema })

    GraphQL::Client.any_instance.stubs(:query).raises(OpenSSL::SSL::SSLError)
  end

  def stub_speedy_query_not_running
    stub_request(:post, speedy_graphql_url)
      .to_return({ status: 200, body: schema })
      .then
      .to_raise(Errno::ECONNREFUSED)
  end

  def stub_speedy_query_timeout
    stub_request(:post, speedy_graphql_url)
      .to_return({ status: 200, body: schema })
      .then
      .to_raise(Net::ReadTimeout)
  end

  def stub_speedy_schema_socket_eof
    stub_request(:post, speedy_graphql_url).to_raise(EOFError)
  end

  def stub_speedy_query_socket_eof
    stub_request(:post, speedy_graphql_url)
      .to_return({ status: 200, body: schema })
      .then
      .to_raise(EOFError)
  end

  def stub_speedy_schema
    stub_request(:post, speedy_graphql_url)
      .with(body: /.*query IntrospectionQuery*/)
      .to_return({ status: 200, body: schema })
  end

  def stub_speedy_aggregated_accounts_insights_query(account_guids: [], last_transaction_date: nil)
    stub_request(:post, speedy_graphql_url)
      .with(body: /.*query AggregatedAccountsInsightsQuery.*/)
      .to_return({ status: 200, body: sample_aggregated_accounts_insights_response(account_guids, last_transaction_date: last_transaction_date).to_json })
  end

  def stub_speedy_aggregated_accounts_insights_query_empty(account_guids: [], last_transaction_date: nil)
    stub_request(:post, speedy_graphql_url)
      .with(body: /.*query AggregatedAccountsInsightsQuery.*/)
      .to_return({ status: 200, body: sample_empty_aggregated_accounts_insights_response(account_guids, last_transaction_date: last_transaction_date).to_json })
  end

  def stub_speedy_aggregated_accounts_insights_query_error
    stub_request(:post, speedy_graphql_url)
      .with(body: /.*query AggregatedAccountsInsightsQuery.*/)
      .to_return({ status: 400 })
  end

  def speedy_url(job_uuid = nil, options: {})
    base = "#{Rails.configuration.speedy_url}api/jobs"

    return "#{base}?#{options.to_query}" if options.present?

    return base unless job_uuid

    "#{base}/#{job_uuid}"
  end

  def speedy_graphql_url
    "#{Rails.configuration.speedy_url}graphql"
  end

  private

  def sample_jobs_response
    { jobs: [sample_job_response, sample_job_response('ProcessFlinksTransactionsJob')] }
  end

  def sample_job_response(name = nil)
    {
      uuid: SecureRandom.uuid,
      name: name || 'ProjectionJob',
      owner_guid: "m_#{SecureRandom.base58(16)}",
      state: 'pending'
    }
  end

  def schema
    # to refresh the schema json have a look at
    File.read(File.join(Rails.root, 'test', 'fixtures', 'files', 'data_warehouse_schema.json'))
  end
end
# rubocop:enable Metrics/ModuleLength
