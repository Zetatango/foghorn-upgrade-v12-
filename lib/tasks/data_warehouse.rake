# frozen_string_literal: true

namespace :data_warehouse do
  desc 'Dump the data warehouse GraphQL api to a file.'
  task dump_schema: :environment do |_task, _args|
    output_path = Rails.root.join('config', 'data_warehouse_schema.json').to_s

    GraphQL::Client.dump_schema(DataWarehouseAPI::HTTP, output_path)

    puts "Data warehouse GraphQL schema dumped to #{output_path}"
  end
end
