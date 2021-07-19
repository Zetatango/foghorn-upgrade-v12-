# frozen_string_literal: true

require 'porky_lib'

# Use the AWS KMS mock client except in production
use_mock_client = !Rails.env.production?
PorkyLib::Config.configure(aws_region: Rails.application.secrets.aws[:region],
                           aws_key_id: Rails.application.secrets.aws[:access_key_id],
                           aws_key_secret: Rails.application.secrets.aws[:access_key_secret],
                           max_file_size: Rails.application.secrets.max_file_size,
                           aws_client_mock: use_mock_client)
PorkyLib::Config.initialize_aws

ZETATANGO_SERVICE_ALIAS = "alias/zetatango_#{Rails.env}" unless Rails.configuration.environment_name == 'staging'
ZETATANGO_SERVICE_ALIAS = "alias/zetatango_sandbox_#{Rails.env}" if Rails.configuration.environment_name == 'staging'

WILE_E_SERVICE_ALIAS = "alias/wilee_#{Rails.env}" unless Rails.configuration.environment_name == 'staging'
WILE_E_SERVICE_ALIAS = "alias/wilee_sandbox_#{Rails.env}" if Rails.configuration.environment_name == 'staging'

ROADRUNNER_SERVICE_ALIAS = "alias/roadrunner_#{Rails.env}" unless Rails.configuration.environment_name == 'staging'
ROADRUNNER_SERVICE_ALIAS = "alias/roadrunner_sandbox_#{Rails.env}" if Rails.configuration.environment_name == 'staging'

FOGHORN_SERVICE_ALIAS = "alias/foghorn_#{Rails.env}" unless Rails.configuration.environment_name == 'staging'
FOGHORN_SERVICE_ALIAS = "alias/foghorn_sandbox_#{Rails.env}" if Rails.configuration.environment_name == 'staging'

tags = [
  {
    tag_key: 'service_name',
    tag_value: 'foghorn'
  }
]
PorkyLib::Symmetric.instance.create_key(tags, FOGHORN_SERVICE_ALIAS) unless PorkyLib::Symmetric.instance.cmk_alias_exists?(FOGHORN_SERVICE_ALIAS)
