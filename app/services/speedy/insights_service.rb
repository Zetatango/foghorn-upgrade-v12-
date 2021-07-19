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
      'User-Agent': 'Foghorn Speedy GraphQL Client',
      Authorization: "Bearer #{@access_token}"
    }
  end
end

class Speedy::InsightsService < Speedy::ServiceBase
  include InsightsHelper

  def query_aggregated_accounts_insights(merchant_guid, account_guids, aggregation: AGGREGATION_WEEKLY_INT)
    validate_integer_aggregation(aggregation)
    validate_account_guids(account_guids)

    variables = {
      guid: merchant_guid,
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
    raise ApiException, 'SSL error on download schema'
  rescue EOFError
    Rails.logger.error('Socked unexpectedly closed')
    raise ApiException, 'Socked unexpectedly closed'
  rescue Errno::ECONNREFUSED
    Rails.logger.error('Unable to reach Speedy')
    raise ApiException, 'Unable to reach Speedy'
  rescue Timeout::Error => e
    Rails.logger.error("Unable to reach Speedy: #{e.message}")
    raise ApiException, "Unable to reach Speedy: #{e.message}"
  end

  def client
    @client ||= init_client
  end

  def init_client
    client = GraphQL::Client.new(schema: schema, execute: http)
    client.allow_dynamic_queries = true
    client
  end

  def speedy_graphql_url
    "#{Rails.configuration.speedy_url}graphql"
  end

  def http
    CustomClient.new(speedy_graphql_url, access_token)
  end

  def send_request(query, variables)
    client.query(query, variables: variables)
  rescue OpenSSL::OpenSSLError
    Rails.logger.error('SSL error on query')
    raise ApiException, 'SSL error on query'
  rescue EOFError
    Rails.logger.error('Socked unexpectedly closed')
    raise ApiException, 'Socked unexpectedly closed'
  rescue Errno::ECONNREFUSED
    Rails.logger.error('Unable to reach Speedy')
    raise ApiException, 'Unable to reach Speedy'
  rescue JSON::ParserError, GraphQL::Client::Error => e
    Rails.logger.error("Query request error: #{e.message}")
    raise QueryError, e.message
  rescue Timeout::Error => e
    Rails.logger.error("Unable to reach Speedy: #{e.message}")
    raise ApiException, "Unable to reach Speedy: #{e.message}"
  end

  def validate_integer_aggregation(aggregation)
    return if aggregation.is_a?(Integer) && aggregation.positive?

    raise AggregationError, 'Aggregation parameter must be a positive Integer'
  end

  def validate_account_guids(account_guids)
    return if account_guids.is_a?(Array) && account_guids.reject(&:blank?).any?

    raise QueryError, 'Account GUIDS parameter must be an Array of Flinks GUIDS'
  end
end
