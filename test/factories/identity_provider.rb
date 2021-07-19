# frozen_string_literal: true

FactoryBot.define do
  factory :identity_provider do
    id { "ip_#{SecureRandom.base58(16)}" }
    subdomain { Faker::Internet.domain_word }
    vanity_url { "id.#{subdomain}.#{Rails.application.secrets.zetatango_domain}" }
    name { Faker::Name.name }
    created_at { Time.now.utc.iso8601 }
  end
end
