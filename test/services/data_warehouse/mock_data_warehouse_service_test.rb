# frozen_string_literal: true

require 'test_helper'

class DataWarehouse::MockDataWarehouseServiceTest < ActiveSupport::TestCase
  setup do
    stub_jwks_response

    @service = DataWarehouse::MockDataWarehouseService.new(SecureRandom.base58(16))

    @merchant_guid = "m_#{SecureRandom.base58(16)}"

    @account_guids = ["ba_#{SecureRandom.base58(16)}", "ba_#{SecureRandom.base58(16)}"]

    Rails.configuration.stubs(mock_data_warehouse: true)
  end

  #
  # #query_aggregated_accounts_insights
  #
  test '#query_aggregated_accounts_insights raises an exception if not configured to use mock data warehouse' do
    Rails.configuration.stubs(mock_data_warehouse: false)

    assert_raises DataWarehouse::DataWarehouseServiceBase::ConfigurationError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end

  test '#query_aggregated_accounts_insights returns a hash' do
    bank_accounts_insights = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    assert bank_accounts_insights.is_a?(HashWithIndifferentAccess)
  end

  test '#query_aggregated_accounts_insights returns a hash of aggregated bank accounts' do
    bank_accounts_insights = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    assert bank_accounts_insights[:aggregatedBankAccounts].length.positive?
  end

  test '#query_aggregated_accounts_insights returns valid aggregated bank accounts insights' do
    bank_accounts_insights = @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)

    aggregated_bank_accounts = bank_accounts_insights[:aggregatedBankAccounts]

    assert aggregated_bank_accounts.key?(:accountGuids)
    assert aggregated_bank_accounts.key?(:aggregation)
    assert aggregated_bank_accounts.key?(:currentBalance)
    assert aggregated_bank_accounts.key?(:lastTransactionDate)
    assert aggregated_bank_accounts.key?(:balance)
    assert aggregated_bank_accounts.key?(:projection)
    assert aggregated_bank_accounts.key?(:performance)
  end

  test '#query_aggregated_accounts_insights generates a valid result for the level of aggregation' do
    [1, 7, 30, 60, 90, 365].each do |aggregation|
      assert_nothing_raised do
        @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids, aggregation: aggregation)
      end
    end
  end

  test '#query_aggregated_accounts_insights raises a validation error on invalid aggregation (String)' do
    assert_raises DataWarehouse::DataWarehouseServiceBase::AggregationError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids, aggregation: 'daily')
    end
  end

  test '#query_aggregated_accounts_insights raises a validation error on invalid aggregation (Negative Integer)' do
    assert_raises DataWarehouse::DataWarehouseServiceBase::AggregationError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids, aggregation: -1)
    end
  end

  test '#query_aggregated_accounts_insights raises a validation error on invalid account giuds (empty Array)' do
    @account_guids = []

    assert_raises DataWarehouse::DataWarehouseServiceBase::QueryError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids)
    end
  end
end
