# frozen_string_literal: true

FactoryBot.define do
  factory :lead, class: 'SwaggerClient::Lead' do
    id { "lead_#{SecureRandom.base58(16)}" }
    external_id { "#{SecureRandom.base58(4)}-#{SecureRandom.base58(4)}-#{SecureRandom.base58(4)}-#{SecureRandom.base58(4)}" }
    language { 'en' }
    casl_consent { true }
    applicant_email { Faker::Internet.email }
    merchant_name { Faker::Name.name }
    applicant_first_name { Faker::Name.first_name }
    applicant_last_name { Faker::Name.last_name }
    created_at { Time.now.utc.iso8601 }
    attributes do
      {
        applicant_first_name: Faker::Name.first_name,
        applicant_last_name: Faker::Name.last_name,
        merchant_address: Faker::Address.full_address,
        merchant_phone_number: '6135551234',
        id: "lead_#{SecureRandom.base58(16)}"
      }.to_json
    end
  end
end

FactoryBot.define do
  factory :lead_listing, class: 'SwaggerClient::LeadsListingEntity' do
    offset { 0 }
    limit { 10 }
    total_count { 1 }
    filtered_count { 1 }
    leads { [] }
  end
end
