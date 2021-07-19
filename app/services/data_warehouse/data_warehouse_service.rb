# frozen_string_literal: true

require 'graphql/client'
require 'graphql/client/http'

class CustomClient < GraphQL::Client::HTTP
  def initialize(uri, access_token, &block)
    @access_token = access_token

    super(uri, &block)
  end

  def headers(_context)
    {
      'User-Agent': 'Foghorn Data Warehouse GraphQL Client',
      Authorization: "Bearer #{@access_token}"
    }
  end
end

class DataWarehouse::DataWarehouseService < DataWarehouse::DataWarehouseServiceBase
  include InsightsHelper

  def query_aggregated_accounts_insights(owner_guid, account_guids, aggregation: AGGREGATION_WEEKLY_INT)
    raise ConfigurationError if Rails.configuration.mock_data_warehouse

    validate_integer_aggregation(aggregation)

    validate_account_guids(account_guids)

    variables = {
      guid: owner_guid,
      account_guids: account_guids,
      aggregation: aggregation
    }
    result = send_request(merchant_aggregated_accounts_insights_query, variables)
    format_response(result&.data&.merchant&.to_h&.with_indifferent_access)
  end

  private

  def merchant_aggregated_accounts_insights_query
    @merchant_aggregated_accounts_insights_query ||= begin
      q = client.parse <<-'GRAPHQL'
                                    query($guid: String!, $account_guids: [String!], $aggregation: Int!) {
                                      merchant(guid: $guid) {
                                        aggregatedBankAccounts(accountGuids: $account_guids, aggregation: $aggregation) {
                                          accountGuids
                                          aggregation
                                          currentBalance
                                          lastTransactionDate
                                          averageDailyExpenses
                                          cashBufferDays
                                          balance {
                                            date
                                            credits
                                            debits
                                            operatingRatio
                                            openingBalance
                                          }
                                          projection {
                                            projectionId
                                            date
                                            credits
                                            debits
                                            operatingRatio
                                            openingBalance
                                            loBalance
                                            hiBalance
                                          }
                                          performance {
                                            currentDate
                                            previousDate
                                            currentBalance
                                            previousBalance
                                            currentOperatingRatio
                                            previousOperatingRatio
                                            balanceChange
                                            operatingRatioChange
                                          }
                                        }
                                      }
                                    }
      GRAPHQL
      # because we are not using a constant to store the query (using dynamic queries) we need to add a name to
      # identify the query in the unit test for stubbing
      q.instance_variable_set(:@definition_name, 'AggregatedAccountsInsightsQuery')
      q
    end
  end

  def schema
    @schema ||= GraphQL::Client.load_schema(http)
  rescue OpenSSL::OpenSSLError
    Rails.logger.error('SSL error on download schema')
    raise ApiError, 'SSL error on download schema'
  rescue EOFError
    Rails.logger.error('Socked unexpectedly closed')
    raise ApiError, 'Socked unexpectedly closed'
  rescue Errno::ECONNREFUSED
    Rails.logger.error('Unable to reach data warehouse api')
    raise ApiError, 'Unable to reach data warehouse api'
  rescue Timeout::Error => e
    Rails.logger.error("Unable to reach data warehouse api: #{e.message}")
    raise ApiError, "Unable to reach data warehouse api: #{e.message}"
  end

  def client
    @client ||= init_client
  end

  def init_client
    client = GraphQL::Client.new(schema: schema, execute: http)
    client.allow_dynamic_queries = true
    client
  end

  def http
    CustomClient.new(Rails.application.config.data_warehouse_api_url, access_token)
  end

  def send_request(query, variables)
    client.query(query, variables: variables)
  rescue OpenSSL::OpenSSLError
    Rails.logger.error('SSL error on query')
    raise ApiError, 'SSL error on query'
  rescue EOFError
    Rails.logger.error('Socked unexpectedly closed')
    raise ApiError, 'Socked unexpectedly closed'
  rescue Errno::ECONNREFUSED
    Rails.logger.error('Unable to reach data warehouse api')
    raise ApiError, 'Unable to reach data warehouse api'
  rescue JSON::ParserError, GraphQL::Client::Error => e
    Rails.logger.error("Query request error: #{e.message}")
    raise QueryError, e.message
  rescue Timeout::Error => e
    Rails.logger.error("Unable to reach data warehouse api: #{e.message}")
    raise ApiError, "Unable to reach data warehouse api: #{e.message}"
  end
end
