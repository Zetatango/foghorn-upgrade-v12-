# frozen_string_literal: true

require 'test_helper'

class Api::V1::DataWarehouseControllerTest < ActionDispatch::IntegrationTest
  include DataWarehouseTestHelper
  include SpeedyTestHelper

  def setup
    stub_vanity_host
    stub_users(@partner)
    sign_in_user @merchant_new

    @account_guids = ["ba_#{SecureRandom.base58(16)}", "ba_#{SecureRandom.base58(16)}"].to_s
    @aggregation_weekly = 7

    Rails.configuration.stubs(mock_data_warehouse: false)
    Rails.configuration.stubs(use_speedy: false)
  end

  #
  # describe #GET /aggregated_bank_accounts
  #
  test 'returns success code - DWH' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query

    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids, aggregation: @aggregation_weekly)
    assert_response :ok
  end

  test 'returns success code - Speedy' do
    Rails.configuration.stubs(use_speedy: true)

    stub_speedy_schema
    stub_speedy_aggregated_accounts_insights_query

    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids, aggregation: @aggregation_weekly)
    assert_response :ok
  end

  test 'returns data from the warehouse service call as JSON' do
    data = 'Hello World'
    returned_value = { status: 'Success', message: 'Returned aggregated accounts insights', data: data }
    DataWarehouse::DataWarehouseService.any_instance.stubs(:query_aggregated_accounts_insights).returns(data)

    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids, aggregation: @aggregation_weekly)
    assert_equal returned_value.to_json, response.body
  end

  test 'returns data from the Speedy service call as JSON' do
    Rails.configuration.stubs(use_speedy: true)

    data = 'Hello World'
    returned_value = { status: 'Success', message: 'Returned aggregated accounts insights', data: data }
    Speedy::InsightsService.any_instance.stubs(:query_aggregated_accounts_insights).returns(data)

    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids, aggregation: @aggregation_weekly)
    assert_equal returned_value.to_json, response.body
  end

  test 'requires aggregation parameter' do
    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids)
    assert_response :bad_request
  end

  test 'requires account guids parameter 1/2' do
    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: '', aggregation: @aggregation_weekly)
    assert_response :bad_request
  end

  test 'requires account guids parameter 2/2' do
    get api_v1_data_warehouse_aggregated_bank_accounts_url(aggregation: @aggregation_weekly)
    assert_response :bad_request
  end

  test 'returns bad request code when DWH query returns an error' do
    stub_data_warehouse_schema
    stub_data_warehouse_aggregated_accounts_insights_query_error

    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids, aggregation: @aggregation_weekly)
    assert_response :bad_request
  end

  test 'returns bad request code when Speedy query returns an error' do
    Rails.configuration.stubs(use_speedy: true)

    stub_speedy_schema
    stub_speedy_aggregated_accounts_insights_query_error

    get api_v1_data_warehouse_aggregated_bank_accounts_url(account_guids: @account_guids, aggregation: @aggregation_weekly)
    assert_response :bad_request
  end
end
