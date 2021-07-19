# frozen_string_literal: true

require 'test_helper'

class ZetatangoServiceTest < ActiveSupport::TestCase
  setup do
    @partner = create :partner
    @other_partner = create :partner

    @zetatango_service = ZetatangoService.instance
    @zetatango_service.clear

    @merchant_guid = "m_#{SecureRandom.base58(16)}"

    @tracked_object_id = "obj_#{SecureRandom.base58(16)}"
    @tracked_object_event = 'invited'
  end

  teardown do
    @zetatango_service.clear
  end

  test '#partner_lookup raises error with zetatango offline' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ETIMEDOUT)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}")
      .to_raise(Errno::ETIMEDOUT)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.partner_lookup(@partner.subdomain)
    end
  end

  test '#partner_lookup raises error with zetatango non-responsive' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ECONNREFUSED)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}")
      .to_raise(Errno::ECONNREFUSED)

    assert_raises ZetatangoService::ConnectionException do
      @zetatango_service.partner_lookup(@partner.subdomain)
    end
  end

  test '#partner_lookup raises error when unauthorized' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_return(status: 401)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}")
      .to_return(status: 401)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.partner_lookup(@partner.subdomain)
    end
  end

  test '#partner_lookup raises error when malformed json is returned' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: '{ invalid: json: invalid }')

    assert_raises ZetatangoService::MalformedResponseException do
      @zetatango_service.partner_lookup(@partner.subdomain)
    end
  end

  test '#partner_lookup returns nil when partner is not found' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 404)

    assert_nil @zetatango_service.partner_lookup(@partner.subdomain)
  end

  test '#partner_lookup makes a remote call to zetatango' do
    stub_partner_lookup_api(@partner)
    @zetatango_service.partner_lookup(@partner.subdomain)

    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.subdomain}", times: 1
  end

  test '#partner_lookup returns valid hash' do
    stub_partner_lookup_api(@partner)
    assert_kind_of Hash, @zetatango_service.partner_lookup(@partner.subdomain)
  end

  test '#partner_look returns hash with correct keys' do
    stub_partner_lookup_api(@partner)
    partner_info = @zetatango_service.partner_lookup(@partner.subdomain)
    assert partner_info.key?(:id)
    assert partner_info.key?(:subdomain)
    assert partner_info.key?(:idp_id)
    assert partner_info.key?(:conf_allow_multiple_businesses)
    assert partner_info.key?(:conf_onboard_supported)
    assert partner_info.key?(:conf_merchant_welcome)
    assert partner_info.key?(:theme_name)
    assert partner_info.key?(:theme_css_url)
    assert partner_info.key?(:mode)
    assert partner_info.key?(:lender_partner_id)
    assert partner_info.key?(:endorsing_partner_ids)
  end

  test '#partner_vanity raises error with zetatango offline' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ETIMEDOUT)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}")
      .to_raise(Errno::ETIMEDOUT)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.partner_vanity(@partner.id)
    end
  end

  test '#partner_vanity raises error with zetatango non-responsive' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ECONNREFUSED)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}")
      .to_raise(Errno::ECONNREFUSED)

    assert_raises ZetatangoService::ConnectionException do
      @zetatango_service.partner_vanity(@partner.id)
    end
  end

  test '#partner_vanity raises error when unauthorized' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_return(status: 401)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}")
      .to_return(status: 401)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.partner_vanity(@partner.id)
    end
  end

  test '#partner_vanity raises error when malformed json is returned' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: '{ invalid: json: invalid }')

    assert_raises ZetatangoService::MalformedResponseException do
      @zetatango_service.partner_vanity(@partner.id)
    end
  end

  test '#partner_vanity returns nil when partner is not found' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 404)

    assert_nil @zetatango_service.partner_vanity(@partner.id)
  end

  test '#partner_vanity makes a remote call to zetatango' do
    stub_partner_lookup_api(@partner)
    @zetatango_service.partner_vanity(@partner.id)

    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}", times: 1
  end

  test '#partner_lookup lookup of vanity based on partner before vanity is cached returns nil' do
    stub_partner_lookup_api(@partner)
    assert_not_nil @zetatango_service.partner_vanity(@partner.id)
  end

  test '#partner_vanity does not lookup of vanity after vanity is cached' do
    stub_partner_lookup_api(@partner)
    partner_info = @zetatango_service.partner_lookup(@partner.subdomain)
    assert_equal @partner.subdomain, @zetatango_service.partner_vanity(partner_info[:id])
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/partners/#{@partner.id}", times: 0
  end

  test '#merchant_lookup raises error with zetatango offline' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ETIMEDOUT)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}")
      .to_raise(Errno::ETIMEDOUT)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.merchant_lookup(@merchant_guid)
    end
  end

  test '#merchant_lookup raises error with zetatango non-responsive' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_raise(Errno::ECONNREFUSED)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}")
      .to_raise(Errno::ECONNREFUSED)

    assert_raises ZetatangoService::ConnectionException do
      @zetatango_service.merchant_lookup(@merchant_guid)
    end
  end

  test '#merchant_lookup raises error when unauthorized' do
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/oauth/token")
      .to_return(status: 401)
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}")
      .to_return(status: 401)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.merchant_lookup(@merchant_guid)
    end
  end

  test '#merchant_lookup raises error when malformed json is returned' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: '{ invalid: json: invalid }')

    assert_raises ZetatangoService::MalformedResponseException do
      @zetatango_service.merchant_lookup(@merchant_guid)
    end
  end

  test '#merchant_lookup returns nil when partner is not found' do
    access_token = stub_oauth_token_request
    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 404)

    assert_nil @zetatango_service.merchant_lookup(@merchant_guid)
  end

  test '#merchant_lookup makes a remote call to zetatango' do
    stub_merchant_lookup_api
    @zetatango_service.merchant_lookup(@merchant_guid)

    assert_requested :post, "#{Rails.configuration.roadrunner_url}/oauth/token", times: 1
    assert_requested :get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}", times: 1
  end

  test '#merchant_lookup returns valid hash' do
    stub_merchant_lookup_api

    assert_kind_of Hash, @zetatango_service.merchant_lookup(@merchant_guid)
  end

  def stub_merchant_lookup_api
    access_token = stub_oauth_token_request

    response_body = {
      id: @merchant_guid,
      partner_id: 'p_wSL1HoY9L3VrVh6x',
      email: 'mer1@example.com',
      partner_merchant_id: '12345678900',
      business_num: '12345678900',
      name: 'Merchant_1',
      address: '15 Fitzgerald Rd, Bells Corners, ON',
      incorporated_in: nil,
      campaigns: []
    }.to_json

    stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{@merchant_guid}")
      .with(
        headers: {
          authorization: "Bearer #{access_token}"
        }
      )
      .to_return(status: 200, body: response_body)
  end

  #
  # #add_tracked_object_event
  #
  test '#add_tracked_object_event raises error with zetatango offline' do
    stub_oauth_token_request
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_raise(Errno::ETIMEDOUT)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.add_tracked_object_event(@tracked_object_id, @tracked_object_event)
    end
  end

  test '#add_tracked_object_event raises error with zetatango non-responsive' do
    stub_oauth_token_request
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_raise(Errno::ECONNREFUSED)

    assert_raises ZetatangoService::ConnectionException do
      @zetatango_service.add_tracked_object_event(@tracked_object_id, @tracked_object_event)
    end
  end

  test '#add_tracked_object_event raises error on bad request error' do
    stub_oauth_token_request
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 400)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.add_tracked_object_event(@tracked_object_id, @tracked_object_event)
    end
  end

  test '#add_tracked_object_event raises error when unauthorized (Zetatango API)' do
    stub_oauth_token_request
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 401)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.add_tracked_object_event(@tracked_object_id, @tracked_object_event)
    end
  end

  test '#add_tracked_object_event raises error on not found error' do
    stub_oauth_token_request
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 404)

    assert_raises ZetatangoService::ApiException do
      @zetatango_service.add_tracked_object_event(@tracked_object_id, @tracked_object_event)
    end
  end

  test '#add_tracked_object_event does not raise an error on success' do
    stub_oauth_token_request
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 201)

    assert_nothing_raised do
      @zetatango_service.add_tracked_object_event(@tracked_object_id, @tracked_object_event)
    end
  end
end
