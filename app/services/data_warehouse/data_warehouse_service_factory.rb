# frozen_string_literal: true

class DataWarehouse::DataWarehouseServiceFactory
  class << self
    def create(access_token)
      return DataWarehouse::MockDataWarehouseService.new(access_token) if Rails.configuration.mock_data_warehouse

      DataWarehouse::DataWarehouseService.new(access_token)
    end
  end
end
