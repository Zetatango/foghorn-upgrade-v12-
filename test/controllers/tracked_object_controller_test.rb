# frozen_string_literal: true

require 'test_helper'

class TrackedObjectControllerTest < ActionDispatch::IntegrationTest
  def setup
    stub_vanity_host
    stub_users(@partner)

    @tracked_object_id = "obj_#{SecureRandom.base58(16)}"
    @tracked_object_event = 'viewed'

    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
  end

  #
  # # GET /tracked_object/:id
  #
  test 'GET /tracked_object/:id without an action replies with http ok' do
    get tracked_object_path(@tracked_object_id)

    assert_response :ok
  end

  test 'GET /tracked_object/:id with an action that is not "viewed" replies with http ok' do
    get tracked_object_path(@tracked_object_id), params: { event: 'invalid' }

    assert_response :ok
  end

  test 'GET /tracked_object/:id with an unknown tracked obje t id replies with http ok' do
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 404)

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end

  test 'GET /tracked_object/:id with a valid tracked object id replies with http ok' do
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 201)

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end

  test 'GET /tracked_object/:id with a valid tracked object id logs the request with Zetatango' do
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 201)

    ZetatangoService.instance.expects(:add_tracked_object_event).with(@tracked_object_id, @tracked_object_event)

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }
  end

  test 'GET /tracked_object/:id that results in an ApiException from Zetatango service replies with http ok' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).raises(ZetatangoService::ApiException)

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end

  test 'GET /tracked_object/:id that results in an ConnectionException from Zetatango service replies with http ok' do
    ZetatangoService.instance.stubs(:add_tracked_object_event).raises(ZetatangoService::ConnectionException)

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end

  test 'GET /tracked_object/:id can be accessed when signed in (merchant new)' do
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 201)

    sign_in_user @merchant_new

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end

  test 'GET /tracked_object/:id can be accessed when signed in (merchant admin)' do
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 201)

    sign_in_user @merchant_admin

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end

  test 'GET /tracked_object/:id can be accessed when signed in (partner admin)' do
    stub_request(:post, "#{Rails.configuration.zetatango_url}/api/tracked_objects/#{@tracked_object_id}")
      .to_return(status: 201)

    sign_in_user @partner_admin

    get tracked_object_path(@tracked_object_id), params: { event: @tracked_object_event }

    assert_response :ok
  end
end
