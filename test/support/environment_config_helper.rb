# frozen_string_literal: true

module EnvironmentConfigHelper
  def stub_cloud_storage
    storage = Rails.configuration.use_cloud_storage
    Rails.configuration.use_cloud_storage = true
    yield
    Rails.configuration.use_cloud_storage = storage
  end
end
