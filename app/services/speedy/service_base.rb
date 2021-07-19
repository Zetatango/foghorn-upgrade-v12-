# frozen_string_literal: true

require 'token_validator'

class Speedy::ServiceBase
  class SpeedyServiceException < StandardError; end
  class ConnectionException < SpeedyServiceException; end
  class ApiException < SpeedyServiceException; end
  class MalformedResponseException < SpeedyServiceException; end
  class QueryError < SpeedyServiceException; end
  class ConfigurationError < SpeedyServiceException; end
  class AggregationError < QueryError; end

  PROJECTION_JOB = 'ProjectionJob'
  PROCESS_FLINKS_TRANSACTIONS_JOB = 'ProcessFlinksTransactionsJob'
  ALL_JOBS = [PROJECTION_JOB, PROCESS_FLINKS_TRANSACTIONS_JOB].freeze
  ALL_STATES = %w[pending completed error failed succeeded running].freeze
  AGGREGATION_WEEKLY_INT = 7

  attr_accessor :access_token

  def initialize(access_token)
    self.access_token = access_token
  end
end
