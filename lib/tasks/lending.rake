# frozen_string_literal: true

# :nocov:

require 'csv'
require 'json'

DEFAULT_CONFIGURATION_FILE = 'csv_load.json'

namespace :lending do
  desc 'Load ubls from csv: rake lending:load_ubls_from_csv RAILS_ENV=test'
  task :load_ubls_from_csv, [:configuration_file] => :environment do |_task, args|
    require Rails.root.join('e2e', 'flows', 'bill_market_flow.rb')
    require Rails.root.join('e2e', 'api', 'zetatango_api.rb')
    Dir[Rails.root.join('e2e', 'helpers', '*.rb')].sort.each { |file| require file }

    self.class.send :include, FixturesHelper
    self.class.send :include, AccessTokenHelper
    self.class.send :include, DatabaseSetupHelper
    self.class.send :include, ZetatangoApi
    self.class.send :include, RequestsHelper

    configuration_file_path = args.configuration_file || DEFAULT_CONFIGURATION_FILE
    return lending_csv_create_default_config_file unless File.file?(configuration_file_path)

    configuration_file = File.read(configuration_file_path)
    configuration = JSON.parse(configuration_file, symbolize_names: true)

    @partner_id = configuration[:partner_guid]
    @suppliers = configuration[:suppliers]
    Rails.configuration.e2e_roadrunner_url = configuration[:e2e_roadrunner_url] if configuration[:e2e_roadrunner_url].present?
    Rails.configuration.e2e_zetatango_url = configuration[:e2e_zetatango_url] if configuration[:e2e_zetatango_url].present?
    @access_token = access_token_after_sandbox_reset(configuration.slice(:client_id, :client_secret)) if configuration[:sandbox_reset]
    @access_token ||= new_app_access_token(get_access_token(configuration.slice(:client_id, :client_secret)))

    preload_suppliers

    CSV.foreach(configuration[:csv_file], headers: true) do |row|
      row = row.to_h
      access_token = new_app_access_token(get_access_token(configuration.slice(:client_id, :client_secret)))

      row_fixture = from_csv(row)

      flow = BillMarketFlow.new(fixtures: row_fixture, token: access_token)
      flow.main_flow
    end
  end
end

def lending_csv_create_default_config_file
  hash = {
    partner_guid: 'p_7J9FJv6qpnG8Q8E2',
    client_id: Rails.application.secrets.ztt_doorkeeper_app[:credentials][:client_id],
    client_secret: Rails.application.secrets.ztt_doorkeeper_app[:credentials][:client_secret],
    csv_file: 'merchants.csv',
    sandbox_reset: false,
    e2e_zetatango_url: 'http://dev.zetatango.local:3000',
    e2e_foghorn_url: 'http://wlmp.zetatango.local:3001',
    e2e_roadrunner_url: 'http://idp.zetatango.local:3002',
    suppliers: [
      {
        name: 'Parmalat',
        institution_number: '1234',
        transit_number: '444444',
        account_number: '54321123',
        address_line_1: '490 Gordon St',
        city: 'Winchester',
        country: 'Canada',
        postal_code: 'K0C 2K0',
        state_province: 'ON',
        phone_number: '(613) 774-2310',
        business_number: '998877665544',
        jurisdiction: 'ON',
        operate_in: 'ON',
        supplier_url: 'parmalat',
        ef_merchant_number: '1232123',
        ef_customer_code: 'AB443322'
      }
    ]
  }
  File.open(DEFAULT_CONFIGURATION_FILE, 'w') do |f|
    f.write(JSON.pretty_generate(hash))
  end

  puts 'Please update csv_load.json and run the task again'
end
# :nocov:
