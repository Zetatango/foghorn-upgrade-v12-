# frozen_string_literal: true

module TransactionsHelper
  extend ActiveSupport::Concern

  def transactions_api_path
    '/api/v1/transactions'
  end
end
