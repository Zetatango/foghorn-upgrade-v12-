# frozen_string_literal: true

require 'test_helper'

class DataWarehouse::DataWarehouseServiceFactoryTest < ActiveSupport::TestCase
  setup do
    @access_token = SecureRandom.base58(16)
  end

  test '#create returns a DataWarehouseService object when mock_data_warehouse is false' do
    Rails.configuration.stubs(mock_data_warehouse: false)

    service = DataWarehouse::DataWarehouseServiceFactory.create(@access_token)

    assert service.is_a?(DataWarehouse::DataWarehouseService)
  end

  test '#create returns a MockDataWarehouseService object when mock_data_warehouse is true' do
    Rails.configuration.stubs(mock_data_warehouse: true)

    service = DataWarehouse::DataWarehouseServiceFactory.create(@access_token)

    assert service.is_a?(DataWarehouse::MockDataWarehouseService)
  end
end
