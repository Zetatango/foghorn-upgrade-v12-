# frozen_string_literal: true

module DataWarehouseTestHelper
  include DataWarehouseDataStubHelper

  def stub_data_warehouse_schema_ssl_error
    GraphQL::Client.stubs(:load_schema).raises(OpenSSL::SSL::SSLError)
  end

  def stub_data_warehouse_schema_not_running
    stub_request(:post, data_warehouse_url).to_raise(Errno::ECONNREFUSED)
  end

  def stub_data_warehouse_schema_timeout
    stub_request(:post, data_warehouse_url).to_raise(Net::ReadTimeout)
  end

  def stub_data_warehouse_ssl_error
    stub_request(:post, data_warehouse_url).to_return({ status: 200, body: data_warehouse_schema })

    GraphQL::Client.any_instance.stubs(:query).raises(OpenSSL::SSL::SSLError)
  end

  def stub_data_warehouse_query_not_running
    stub_request(:post, data_warehouse_url)
      .to_return({ status: 200, body: data_warehouse_schema })
      .then
      .to_raise(Errno::ECONNREFUSED)
  end

  def stub_data_warehouse_query_timeout
    stub_request(:post, data_warehouse_url)
      .to_return({ status: 200, body: data_warehouse_schema })
      .then
      .to_raise(Net::ReadTimeout)
  end

  def stub_data_warehouse_schema_socket_eof
    stub_request(:post, data_warehouse_url).to_raise(EOFError)
  end

  def stub_data_warehouse_query_socket_eof
    stub_request(:post, data_warehouse_url)
      .to_return({ status: 200, body: data_warehouse_schema })
      .then
      .to_raise(EOFError)
  end

  def stub_data_warehouse_schema
    stub_request(:post, data_warehouse_url)
      .with(body: /.*query IntrospectionQuery*/)
      .to_return({ status: 200, body: data_warehouse_schema })
  end

  def stub_data_warehouse_aggregated_accounts_insights_query(account_guids: [], last_transaction_date: nil)
    stub_request(:post, data_warehouse_url)
      .with(body: /.*query AggregatedAccountsInsightsQuery.*/)
      .to_return({ status: 200, body: sample_aggregated_accounts_insights_response(account_guids, last_transaction_date: last_transaction_date).to_json })
  end

  def stub_data_warehouse_aggregated_accounts_insights_query_empty(account_guids: [], last_transaction_date: nil)
    stub_request(:post, data_warehouse_url)
      .with(body: /.*query AggregatedAccountsInsightsQuery.*/)
      .to_return({ status: 200, body: sample_empty_aggregated_accounts_insights_response(account_guids, last_transaction_date: last_transaction_date).to_json })
  end

  def stub_data_warehouse_aggregated_accounts_insights_query_error
    stub_request(:post, data_warehouse_url)
      .with(body: /.*query AggregatedAccountsInsightsQuery.*/)
      .to_return({ status: 400 })
  end

  def data_warehouse_url
    Rails.application.config.data_warehouse_api_url
  end

  private

  def data_warehouse_schema
    # to refresh the schema json have a look at
    File.read(File.join(Rails.root, 'test', 'fixtures', 'files', 'data_warehouse_schema.json'))
  end
end
