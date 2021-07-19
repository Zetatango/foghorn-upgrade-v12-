# frozen_string_literal: true

require 'test_helper'

class DataWarehouse::DataWarehouseServiceTest < ActiveSupport::TestCase
  include DataWarehouseTestHelper

  setup do
    stub_jwks_response

    @service = DataWarehouse::DataWarehouseService.new(SecureRandom.base58(16))

    @merchant_guid = "m_#{SecureRandom.base58(16)}"

    @account_guids = ["ba_#{SecureRandom.base58(16)}", "ba_#{SecureRandom.base58(16)}"]

    Rails.configuration.stubs(mock_data_warehouse: false)
  end

  #
  # #query_aggregated_accounts_insights
  #
  test '#query_aggregated_accounts_insights raises a ConfigurationError if mock_data_warehouse is true' do
    Rails.configuration.stubs(mock_data_warehouse: true)

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ConfigurationError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle error from data warehouse (on schema download)' do
    stub_data_warehouse_schema_not_running

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle timeout error from data warehouse (on schema download)' do
    stub_data_warehouse_schema_timeout

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will SSL error (on schema download)' do
    stub_data_warehouse_schema_ssl_error

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle error from data warehouse' do
    stub_data_warehouse_query_not_running

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle timeout error from data warehouse' do
    stub_data_warehouse_query_timeout

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle SSL error' do
    stub_data_warehouse_ssl_error

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle socket EOF error (on schema download)' do
    stub_data_warehouse_schema_socket_eof

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will handle socket EOF error' do
    stub_data_warehouse_query_socket_eof

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - recover from data warehouse not running' do
    stub = stub_data_warehouse_query_not_running

    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end

    remove_request_stub(stub)

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query
    assert_nothing_raised do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - handles data warehouse outage' do
    stub_data_warehouse_schema
    stub = stub_data_warehouse_aggregated_accounts_insights_query
    assert_nothing_raised do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end

    remove_request_stub(stub)

    stub_data_warehouse_schema_not_running
    assert_raises(DataWarehouse::DataWarehouseServiceBase::ApiError) do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - handles query error' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_error
    assert_raises DataWarehouse::DataWarehouseServiceBase::QueryError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - raises an error on invalid aggregation (String)' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_error
    assert_raises DataWarehouse::DataWarehouseServiceBase::AggregationError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids, aggregation: 'daily')
    end
  end

  test '#query_aggregated_accounts_insights - raises an error on invalid aggregation (Negative Integer)' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_error
    assert_raises DataWarehouse::DataWarehouseServiceBase::AggregationError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids, aggregation: -1)
    end
  end

  test '#query_aggregated_accounts_insights - raises an error on invalid on invalid account giuds (empty Array)' do
    @account_guids = []

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_error
    assert_raises DataWarehouse::DataWarehouseServiceBase::QueryError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - raises an error on invalid on invalid account giuds (Array with empty String)' do
    @account_guids = ['']

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_error
    assert_raises DataWarehouse::DataWarehouseServiceBase::QueryError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - passes account guids and aggregation level to query' do
    merchant_guid = "m_#{SecureRandom.base58(16)}"
    account_guids = ["ba_#{SecureRandom.base58(16)}"]
    aggregation = 7

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query(account_guids: account_guids)

    @service.query_aggregated_accounts_insights(merchant_guid, account_guids, aggregation: aggregation)

    assert_requested(:post, data_warehouse_url) do |request|
      query = JSON.parse(request.body, symbolize_names: true)

      next unless query.key?(:variables)

      query[:variables][:guid] == merchant_guid && query[:variables][:account_guids] == account_guids &&
        query[:variables][:aggregation] == aggregation
    end
  end

  test '#query_aggregated_accounts_insights - passes the correct access token' do
    account_guids = ["ba_#{SecureRandom.base58(16)}"]

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query(account_guids: account_guids)

    access_token = SecureRandom.base58(32)

    service = DataWarehouse::DataWarehouseService.new(access_token)
    service.query_aggregated_accounts_insights("m_#{SecureRandom.base58(16)}", account_guids, aggregation: 1)

    # Once for the schema, once for the data
    assert_requested(:post, data_warehouse_url, times: 2) do |request|
      request.headers['Authorization'].split.second == access_token
    end
  end

  test '#query_aggregated_accounts_insights - will default aggregation level to weekly (7 days)' do
    merchant_guid = "m_#{SecureRandom.base58(16)}"
    account_guids = ["ba_#{SecureRandom.base58(16)}"]

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query(account_guids: account_guids)

    @service.query_aggregated_accounts_insights(merchant_guid, account_guids)

    assert_requested(:post, data_warehouse_url) do |request|
      query = JSON.parse(request.body, symbolize_names: true)

      next unless query.key?(:variables)

      query[:variables][:guid] == merchant_guid && query[:variables][:account_guids] == account_guids &&
        query[:variables][:aggregation] == 7
    end
  end

  test '#query_aggregated_accounts_insights - will return just the insights data' do
    last_transaction_date = (Time.now - rand(100).days).to_date.to_s

    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query(account_guids: @account_guids, last_transaction_date: last_transaction_date)
    result = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    assert_equal last_transaction_date, result[:aggregatedBankAccounts][:lastTransactionDate]
  end

  test '#query_aggregated_accounts_insights - returns balance + projection in date ascending order' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query(account_guids: @account_guids)
    result = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    assert result[:aggregatedBankAccounts][:balance][0][:date] <= result[:aggregatedBankAccounts][:balance][1][:date]
    assert result[:aggregatedBankAccounts][:projection][0][:date] <= result[:aggregatedBankAccounts][:projection][1][:date]
  end

  test '#query_aggregated_accounts_insights - returns empty balance + projection when nil is received from dwh' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_empty
    result = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    assert_equal [], result[:aggregatedBankAccounts][:balance]
    assert_equal [], result[:aggregatedBankAccounts][:projection]
  end

  test '#query_aggregated_accounts_insights - returns values with 2 decimal points' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query(account_guids: @account_guids)
    result = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    keys = %i[averageDailyExpenses currentBalance previousBalance currentOperatingRatio previousOperatingRatio]
    balance_keys = %i[credits debits operatingRatio openingBalance loBalance hiBalance]

    keys.each do |k|
      assert_equal result[:aggregatedBankAccounts][k].round(2), result[:aggregatedBankAccounts][k] unless result[:aggregatedBankAccounts][k].nil?
    end

    balance_keys.each do |bk|
      result[:aggregatedBankAccounts][:projection].each do |projection|
        assert_equal projection[bk].round(2), projection[bk] unless projection[bk].nil?
      end

      result[:aggregatedBankAccounts][:balance].each do |balance|
        assert_equal balance[bk].round(2), balance[bk] unless balance[bk].nil?
      end
    end
  end

  test '#query_aggregated_accounts_insights - will return nil when no merchant is returned from the DWH' do
    DataWarehouse::DataWarehouseService.any_instance.stubs(:send_request).returns(OpenStruct.new(data: nil))

    stub_data_warehouse_schema

    assert_nothing_raised do
      assert_nil @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights - will return nil when no data is returned from the DWH' do
    DataWarehouse::DataWarehouseService.any_instance.stubs(:send_request).returns(nil)

    stub_data_warehouse_schema

    assert_nothing_raised do
      assert_nil @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end
end
