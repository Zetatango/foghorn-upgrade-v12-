# frozen_string_literal: true

class DataWarehouse::DataWarehouseServiceBase
  class ServiceError < StandardError; end
  class QueryError < ServiceError; end
  class ConfigurationError < ServiceError; end
  class AggregationError < QueryError; end
  class ApiError < ServiceError; end

  AGGREGATION_WEEKLY_INT = 7

  attr_accessor :access_token

  def initialize(access_token)
    self.access_token = access_token
  end

  def query_aggregated_accounts_insights(_owner_guid, _account_guids, aggregation:)
    raise NotImplementedError
  end

  private

  def validate_integer_aggregation(aggregation)
    return if aggregation.is_a?(Integer) && aggregation.positive?

    raise AggregationError, 'Aggregation parameter must be a positive Integer'
  end

  def validate_account_guids(account_guids)
    return if account_guids.is_a?(Array) && account_guids.reject(&:blank?).any?

    raise QueryError, 'Account GUIDS parameter must be an Array of Flinks GUIDS'
  end
end
