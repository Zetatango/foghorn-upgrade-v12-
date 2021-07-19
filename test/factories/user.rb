# frozen_string_literal: true

FactoryBot.define do
  factory :user, class: User do
    transient do
      partner { build :partner }
      lead { build :lead }
      add_new_business { false }
      merchant_new { 0 }
      merchant_onboarding { 0 }
      is_partner_admin { false }
      lead_new { 0 }
    end

    uid { "u_#{SecureRandom.base58(16)}" }
    name { 'User: new' }
    email { 'merchant_new@example.com' }
    enabled { true }
    created_at { Time.now.utc.iso8601 }
    profile_partner_filter { partner.id }
    properties do
      {
        preferred_language: {
          partner.id => { language: 'en', last_updated: Time.now.utc.iso8601 }
        }.to_json,
        insights_preference: {
          partner.id => { opt_in: false, last_updated: Time.now.utc.iso8601 }
        }.to_json
      }
    end
    preferred_language { 'en' }
    insights_preference { false }
    product_preference { User::PRODUCT_LOC }
    profiles { [] }

    trait :english_language do
      preferred_language { 'en' }
    end

    trait :french_language do
      preferred_language { 'fr' }
    end

    trait :insights_opt_in do
      insights_preference { true }
    end

    trait :insights_opt_out do
      insights_preference { false }
    end

    trait :insights_not_set do
      insights_preference { nil }
    end

    trait :merchant_admin do
      name { 'User: merchant admin' }
      email { 'merchant_admin@example.com' }
      profiles do
        [{
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_admin',
            partner: partner.id,
            merchant: "m_#{SecureRandom.base58(16)}"
          }.compact
        }]
      end
    end

    trait :merchant_new do
      name { 'User: merchant onboarded' }
      email { 'merchant@example.com' }
      properties do
        {
          preferred_language: {
            partner.id => { language: 'en', last_updated: Time.now.utc.iso8601 }
          }.to_json,
          applicants: {
            partner.id => "app_#{SecureRandom.base58(16)}"
          }.to_json
        }
      end
      profiles do
        [{
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: partner.id,
            merchant: "m_#{SecureRandom.base58(16)}",
            applicant: JSON.parse(properties[:applicants])[JSON.parse(properties[:applicants]).keys.last],
            lead: lead&.id
          }.compact
        }]
      end
      applicant { JSON.parse(properties[:applicants])[JSON.parse(properties[:applicants]).keys.last] }
    end

    trait :merchant_onboarding do
      name { 'User: continue onboarding' }
      email { 'onboarding@example.com' }
      profiles do
        [{
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: partner.id,
            merchant: "m_#{SecureRandom.base58(16)}",
            lead: lead&.id
          }.compact
        }]
      end
    end

    trait :partner_admin do
      name { 'User: partner admin' }
      email { 'partner_admin@example.com' }
      profiles do
        [{
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'partner_admin',
            partner: partner.id
          }.compact
        }]
      end
    end

    trait :lead_new do
      name { 'User: lead new' }
      email { 'lead_new@example.com' }
      profiles do
        [{
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'lead_new',
            partner: partner.id,
            merchant: "m_#{SecureRandom.base58(16)}"
          }.compact
        }]
      end
    end

    after(:build) do |user, evaluator|
      if evaluator.add_new_business
        user.profiles.unshift({
                                uid: "prof_#{SecureRandom.base58(16)}",
                                properties: {
                                  role: 'merchant_new',
                                  partner: evaluator.partner.id
                                }.compact
                              })
      end

      (1..evaluator.merchant_new).each do
        if user.properties[:applicants].blank?
          user.properties[:applicants] = {
            evaluator.partner.id => "app_#{SecureRandom.base58(16)}"
          }.to_json
        end

        user.profiles << {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: evaluator.partner.id,
            merchant: "m_#{SecureRandom.base58(16)}",
            applicant: user.properties[:applicants][evaluator.partner.id],
            lead: evaluator.lead&.id
          }.compact
        }
      end

      (1..evaluator.lead_new).each do
        if user.properties[:applicants].blank?
          user.properties[:applicants] = {
            evaluator.partner.id => "app_#{SecureRandom.base58(16)}"
          }.to_json
        end

        user.profiles << {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'lead_new',
            partner: evaluator.partner.id,
            merchant: "m_#{SecureRandom.base58(16)}",
            applicant: user.properties[:applicants][evaluator.partner.id]
          }.compact
        }
      end

      (1..evaluator.merchant_onboarding).each do
        user.profiles << {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: evaluator.partner.id,
            merchant: "m_#{SecureRandom.base58(16)}",
            lead: evaluator.lead&.id
          }.compact
        }
      end

      if evaluator.is_partner_admin
        user.profiles << {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'partner_admin',
            partner: evaluator.partner.id
          }.compact
        }
      end
    end
  end

  factory :multi_partner_user, class: User do
    transient do
      partner { build :partner }
    end

    uid { "u_#{SecureRandom.base58(16)}" }
    name { 'User: multi-partner' }
    email { 'multi_partner@example.com' }
    enabled { true }
    created_at { Time.now.utc.iso8601 }
    profile_partner_filter { partner.id }
    properties do
      {
        preferred_language: {
          partner.id => { language: 'en', last_updated: Time.now.utc.iso8601 }
        }.to_json,
        applicants: {
          partner.id => "app_#{SecureRandom.base58(16)}",
          "p_#{SecureRandom.base58(16)}" => "app_#{SecureRandom.base58(16)}"
        }.to_json
      }
    end
    profiles do
      [
        {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: partner.id,
            merchant: "m_#{SecureRandom.base58(16)}"
          }
        },
        {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: partner.id,
            merchant: "m_#{SecureRandom.base58(16)}",
            applicant: JSON.parse(properties[:applicants])[JSON.parse(properties[:applicants]).keys.first]
          }
        },
        {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'merchant_new',
            partner: JSON.parse(properties[:applicants]).keys.last,
            merchant: "m_#{SecureRandom.base58(16)}",
            applicant: JSON.parse(properties[:applicants])[JSON.parse(properties[:applicants]).keys.last]
          }
        },
        {
          uid: "prof_#{SecureRandom.base58(16)}",
          properties: {
            role: 'partner_admin',
            partner: partner.id
          }
        }
      ]
    end
  end

  initialize_with do
    new({})
  end
end
