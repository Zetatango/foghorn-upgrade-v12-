# frozen_string_literal: true

namespace :file_transfer do
  desc 'Test the file transfer capability'
  task :test, %i[source_guid merchant_guid num_documents] => :environment do |_task, args|
    exit if Rails.configuration.environment_name == 'sandbox' ||
            Rails.configuration.environment_name == 'production'

    puts "Transferring #{args.num_documents} test file(s) to Zetatango"

    files = []
    file_transfer_service = FileTransferService.new

    args.num_documents.to_i.times do |index|
      service, report_type, destination = generate_params(index)

      document = {
        upload_ts: Time.now.utc.iso8601,
        id: SecureRandom.uuid,
        from: Rails.application.class.module_parent_name,
        to: service
      }

      file = Tempfile.new
      file.write(document.to_json)
      file.rewind

      file_key = file_transfer_service.store_file(file, service)

      puts "Stored file key: #{file_key}"

      file = {
        lookup_key: file_key
      }
      file[:report_type] = report_type
      file[:destination] = destination

      files << file
    end

    response = file_transfer_service.send_files(FileTransferService::ZETATANGO_SERVICE, args.merchant_guid, args.source_guid, files)
    file_guids = JSON.parse(response, symboize_names: true)

    file_guids.each do |guid|
      puts "File guid: #{guid}"
    end
  end

  private

  def generate_params(index)
    if index.even?
      service = FileTransferService::WILE_E_SERVICE
      report_type = 'cra_tax_assessment'
      destination = 'kyc'
    else
      service = FileTransferService::ZETATANGO_SERVICE
      report_type = 'bank_statements'
      destination = 'zetatango'
    end

    [service, report_type, destination]
  end
end
