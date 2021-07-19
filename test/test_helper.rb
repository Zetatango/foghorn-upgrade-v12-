# frozen_string_literal: true

if ENV['COVERAGE'] || ENV['CI']
  require 'simplecov'
  require 'codacy-coverage'
  require 'codecov'

  SimpleCov.formatter = SimpleCov::Formatter::MultiFormatter.new(
    [
      SimpleCov::Formatter::Codecov,
      SimpleCov::Formatter::HTMLFormatter,
      Codacy::Formatter
    ]
  )

  SimpleCov.coverage_dir('coverage/rails')

  SimpleCov.start do
    add_filter '/test/'
    add_filter 'app/secrets'
  end
end

require File.expand_path('../config/environment', __dir__)

require 'rails/test_help'
require 'mocha/minitest'
require 'webmock/minitest'
require 'minitest/ci'
require 'token_validator'
require 'awesome_print'

WebMock.disable_net_connect!(allow: 'https://api.codacy.com')

Minitest::Ci.report_dir = "#{ENV['CIRCLE_TEST_REPORTS']}/reports" if ENV['CIRCLECI']

Dir[Rails.root.join('test', 'support', '*.rb')].sort.each { |file| require file }

Minitest::Reporters.use! [Minitest::Reporters::DefaultReporter.new(color: true)]

Mocha.configure { |c| c.stubbing_non_existent_method = :prevent }
Timecop.safe_mode = true

class ActiveSupport::TestCase
  include ActiveJob::TestHelper
  include AccessTokenHelper
  include VanityHelper
  include UsersHelper
  include ZetatangoServiceHelper
  include LoggerAssertionsHelper
  include FileTransferHelper
  include EnvironmentConfigHelper
  include MerchantHelper

  include FactoryBot::Syntax::Methods

  TIME_VARIANCE_TOLERANCE = 30.seconds.freeze

  Rails.cache = ActiveSupport::Cache::MemoryStore.new
  parallelize(workers: :number_of_processors)

  if ENV['COVERAGE']
    parallelize_setup do |worker|
      SimpleCov.command_name "#{SimpleCov.command_name}-#{worker}"
    end

    parallelize_teardown do |_worker|
      SimpleCov.result
    end
  end

  setup do
    Rails.cache.clear
  end

  def check_time(expected, actual)
    actual.utc.to_i >= expected.utc.to_i && actual.utc.to_i <= expected.utc.to_i + TIME_VARIANCE_TOLERANCE
  end
end

class ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper
  include ActionController::Helpers
  include PartnerIdentity
  include UsersHelper
  include UserSessionHelper
  include LoggerAssertionsHelper
  include FileTransferHelper
  include EnvironmentConfigHelper
  include DocumentsCacheHelper
  include ApplicationHelper
  include BusinessPartnerHelper
  include ThemeSetupHelper

  include FactoryBot::Syntax::Methods

  Rails.cache = ActiveSupport::Cache::MemoryStore.new

  setup do
    Rails.cache.clear
  end

  def generate_jwt_path(jwt)
    merchant_auth_path + "/?jwt=#{jwt}"
  end

  def good_access_token
    { token: access_token, expires: Time.now.to_i + 1800 }
  end

  def time_now_f
    Time.now.strftime('%F')
  end

  def time_next_month_f
    (Time.now + 1.month).strftime('%F')
  end

  def time_now_utc_iso
    Time.now.utc.round(10).iso8601(3)
  end

  # {
  # "exp": 1513016073,
  #    "iat": 1513016013,
  #    "jti": "b005ca4a4f7110f4587ab6ea94725b5605832f6bd1af95824836255886ada95d615c00ece44fff57b744858ebce325ab9c0d54fcc4111437e5e8e73e178a871f",
  #    "kid": "e2946dca-5801-47fa-a49e-8dab1c7a5a18",
  #    "m_guid": "m_cNwWuMCv18KKVeo2",
  #    "sub": "p_7J9FJv6qpnG8Q8E2"
  # }
  def good_jwt
    'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.eyJleHAiOjE1MTMwMTYwNzMsImlhdCI6MTUxMzAxNjAxMywianRpIjoiYjAwNWNhNGE0ZjcxMTBmNDU4N2FiNmVhOTQ3MjViNT' \
      'YwNTgzMmY2YmQxYWY5NTgyNDgzNjI1NTg4NmFkYTk1ZDYxNWMwMGVjZTQ0ZmZmNTdiNzQ0ODU4ZWJjZTMyNWFiOWMwZDU0ZmNjNDExMTQzN2U1ZThlNzNlMTc4YTg3MWYiLCJraWQiOiJl' \
      'Mjk0NmRjYS01ODAxLTQ3ZmEtYTQ5ZS04ZGFiMWM3YTVhMTgiLCJtX2d1aWQiOiJtX2NOd1d1TUN2MThLS1ZlbzIiLCJzdWIiOiJwXzdKOUZKdjZxcG5HOFE4RTIifQ.JFrM_L7xLcMF2a0' \
      'runf147lGAvmRv4P9zBRqbBiEtJKxxIPbBa-V4SCawP0-l2_tTPtCYyHIrgFlpfdU6ePHBg'
  end

  def good_merchant
    # TODO: A Merchant factory hooked to SwaggerClient::Merchant should be defined.
    SwaggerClient::Merchant.new(
      id: 'm_3EwxpshNqhEHFEJC',
      email: 'peter.rabinovitch@zetatango.com',
      partner_merchant_id: '234654',
      business_num: '649728513',
      name: 'Peter’s π Shoppe',
      campaigns: [{
        id: '1', name: 'Dream_Pilot_Demo', description: 'jewelers', partner_id: 1,
        total_capital: 250_000.0, currency: 'CAD', start_date: Date.today,
        end_date: Date.today + 1.year, max_merchants: 10, min_amount: 2000.0, max_amount: 10_000.0,
        remittance_rates: '[10, 15, 20, 25, 30]', state: 'active', terms_template: "\nSample\n"
      }]
    )
  end

  def good_merchant_documents_listing
    SwaggerClient::MerchantDocumentsListingEntity.new(
      offset: 0,
      limit: 10,
      total_count: 20,
      filtered_count: 20,
      order_by: 'created_at',
      order_direction: 'desc',
      merchant_documents: [
        good_merchant_document,
        good_merchant_document,
        good_merchant_document
      ]
    )
  end

  def good_merchant_document
    SwaggerClient::MerchantDocument.new(
      id: "md_#{SecureRandom.base58(16)}",
      partner_id: "p_#{SecureRandom.base58(16)}",
      merchant_id: good_merchant.id,
      org_doc_name: 'acme_banking_docs.pdf',
      doc_type: 'uploaded_bank_statements',
      source_guid: good_merchant.id,
      created_at: DateTime.new,
      uploaded_at: DateTime.new,
      uploaded_by: 'Alice Merchant (alice.merchant@email.ca)'
    )
  end

  # @deprecated Remittance-based Old WCA
  def valid_offers
    [
      SwaggerClient::FinancingOffer.new(
        id: 'fo_eUJykRD1vhPR9Fmr',
        state: 'approved',
        variable: var_off,
        currency: 'CAD'
      )
    ]
  end

  # @deprecated Remittance-based Old WCA
  def good_application
    SwaggerClient::FinancingApplication.new(
      id: 'fap_d21xn72PghBPxm1W',
      state: 'approved',
      merchant_id: 'm_93RQGRqHPVDqS6KX',
      selected_offer_id: '12',
      offer_id: 'fo_ieVTivdV8iaJHwSL',
      terms: "\nThese are the terms and conditions\n",
      advance_amount: 4000.0,
      currency: 'CAD',
      factor_rate: 1.1,
      remittance_rate: 0.15,
      merchant_user_email: 'merchant@kirk.com',
      merchant_user_id: 'm1'
    )
  end

  # @deprecated Remittance-based Old WCA
  def var_off
    off_bounds = SwaggerClient::FinancingOfferBounds.new(min_adv_amount: 2000, max_adv_amount: 10_000, rates: rates_array)

    SwaggerClient::FinancingVariableOffer.new(
      id: 'fvo_Q2RJb7otetWaQ26n',
      min_adv_amount: 2000.0,
      max_adv_amount: 10_000.0,
      offer_bounds: [off_bounds]
    )
  end

  # @deprecated Remittance-based Old WCA
  def rates_array
    [SwaggerClient::FinancingRates.new(remittance_rate: 0.1),
     SwaggerClient::FinancingRates.new(remittance_rate: 0.15)]
  end

  # rubocop:disable Metrics/AbcSize
  def sign_in_user(user, session = nil)
    OmniAuth.config.test_mode = true
    user_info = mock_user_from_zt_idp
    user_info[:uid] = user.uid
    user_info[:info][:email] = user.email
    user_info[:info][:name] = user.name
    user_info[:extra][:raw_info][:enabled] = user.enabled
    user_info[:extra][:raw_info][:preferred_language] = user.preferred_language
    user_info[:extra][:raw_info][:insights_preference] = user.insights_preference

    user.properties.each do |key, value|
      user_info[:extra][:raw_info][:properties][key] = value
    end

    user.profile_info(filter: false).each do |profile_info|
      profile = ActiveSupport::HashWithIndifferentAccess.new
      profile[:uid] = profile_info[:uid]
      profile[:properties] = ActiveSupport::HashWithIndifferentAccess.new
      profile_info[:properties].each do |key, value|
        profile[:properties][key] = value
      end

      user_info[:extra][:raw_info][:profiles] << profile
    end

    OmniAuth.config.add_mock(:user, user_info)

    stub_user_profiles_lookup(user)

    if session.nil?
      get user_login_path
      follow_redirect!
    else
      session.process(:get, user_login_path)
      session.follow_redirect!
    end
  end
  # rubocop:enable Metrics/AbcSize

  def user_login_path
    '/auth/user'
  end

  def mock_user_from_zt_idp
    {
      provider: 'user',
      uid: '12345',
      info: {
        email: 'new.user@zetatango.com',
        name: 'New User'
      },
      credentials: {
        token: SecureRandom.base64(32)
      },
      extra: {
        raw_info: {
          enabled: true,
          properties: {},
          profiles: [],
          preferred_language: 'en',
          insights_preference: false
        }
      }
    }
  end

  # @deprecated Remittance-based Old WCA
  def invoices
    [].push(SwaggerClient::FinancingInvoice.new(
              id: 'iv_4r37kqW145suDVxv',
              merchant_id: 'm_Jc8jSWkxE68kW8sH',
              amount: 101,
              amount_due: 0,
              currency: 'CAD',
              issued_on: time_now_f,
              period_start_date: time_now_f,
              period_end_date: time_next_month_f,
              sales_amount: 252,
              paid_in_full_at: time_now_f,
              state: 'complete'
            ))
  end

  def pad_agreement
    {
      content: 'Default content'
    }
  end

  def bank_accounts
    [{
      id: 'ba_HLD8shTz9mAMKYvE',
      merchant_id: 'm_DZQ6kXD5yvDDB1EA',
      name: 'Main bank account',
      currency: 'CAD',
      institution_number: '000',
      transit_number: '00000',
      account_number: '0000000'
    }]
  end

  def campaigns
    [{
      id: 'cp_sfHYrGotYGxgju9A',
      name: 'Christmas Campaign',
      description: 'Focus on jewelers',
      partner_id: '54326',
      product_type: 'WCA',
      total_capital: '250_000',
      currency: 'CAD',
      start_date: time_now_f,
      end_date: time_next_month_f,
      max_merchants: 50,
      min_amount: 1000,
      max_amount: 250_000,
      remittance_rates: '0.15, 0.20, 0.25',
      state: 'active',
      terms_template: 'terms'
    }]
  end

  # @deprecated Remittance-based Old WCA
  def advances
    [{
      id: 'fa_nmkwzZYLxDGXos4v',
      state: 'remitting',
      application_id: 'fap_Q6UMzgnJfWBsceWF',
      merchant_id: 'm_tip9nHGVHREnp5Ln',
      merchant_account_id: 'a_Jc4aMUKvLP69huyZ',
      terms: 'string',
      advance_amount: '10000.00',
      currency: 'CAD',
      factor_rate: '0.15',
      remittance_rate: '0.2',
      factor_amount: '300.00',
      advance_remitted_amount: '200.00',
      factor_remitted_amount: '30.00',
      advance_remaining_amount: '1800.00',
      factor_remaining_amount: '270.00',
      activated_at: time_now_utc_iso,
      advance_sent_at: time_now_utc_iso,
      advance_deposited_at: time_now_utc_iso,
      advance_completed_at: time_now_utc_iso,
      first_remittance_at: time_now_utc_iso,
      est_time_to_repay: '45'
    }]
  end
end
