# frozen_string_literal: true

require 'test_helper'

class DataWarehouse::DataWarehouseServiceBaseTest < ActiveSupport::TestCase
  setup do
    @service = DataWarehouse::DataWarehouseServiceBase.new(SecureRandom.base58(16))

    @merchant_guid = "m_#{SecureRandom.base58(16)}"

    @account_guids = ["ba_#{SecureRandom.base58(16)}", "ba_#{SecureRandom.base58(16)}"]

    @aggregation_weekly = 7
  end

  #
  # #query_aggregated_accounts_insights
  #
  test '#query_aggregated_accounts_insights raises an exception if not configured to use mock data warehouse' do
    assert_raises NotImplementedError do
      @service.query_aggregated_accounts_insights(@merchant_guid, @account_guids, aggregation: @aggregation_weekly)
    end
  end
end
