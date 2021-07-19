# frozen_string_literal: true

require 'test_helper'

class FlinksHelperTest < ActionView::TestCase
  test 'store_flinks_data stores data in cookies if it is not nil' do
    store_flinks_data('id', 'route', nil)

    assert_equal('id', cookies[:flinks_request_id])
    assert_equal('route', cookies[:flinks_route])
  end

  test 'store_flinks_data does not store data in cookies if it is nil' do
    store_flinks_data(nil, nil, nil)

    assert_nil(cookies[:flinks_request_id])
    assert_nil(cookies[:flinks_route])
  end

  test 'store_flinks_data triggers Bugsnag if it attempts to store empty route' do
    Bugsnag.expects(:notify)
    store_flinks_data(nil, nil, nil)
  end

  test 'store_flinks_data does not trigger Bugsnag if route is set' do
    Bugsnag.expects(:notify).never
    store_flinks_data(nil, 'route', nil)
  end

  test 'store_flinks_data does not store data in cookies if it is blank' do
    store_flinks_data('', '', nil)

    assert_nil(cookies[:flinks_request_id])
    assert_nil(cookies[:flinks_route])
  end

  test 'clear_flinks_data removes data from cookies and logs actions if keys are in cookies' do
    Rails.logger.expects(:info).times(4)
    store_flinks_data('id', 'route', nil)
    clear_flinks_data

    assert_nil(cookies[:flinks_request_id])
    assert_nil(cookies[:flinks_route])
  end

  test 'clear_flinks_data removes flinks_route from cookies and logs action if key is in cookies' do
    Rails.logger.expects(:info).with('FLINKS : store_flinks_data  - route - ').once
    store_flinks_data(nil, 'route', nil)
    Rails.logger.expects(:info).with('FLINKS : clear_flinks_data route - ').once
    Rails.logger.expects(:info).with('Clearing :flinks_route from cookies').once
    clear_flinks_data

    assert_nil(cookies[:flinks_request_id])
    assert_nil(cookies[:flinks_route])
  end

  test 'clear_flinks_data removes flinks_request_id from cookies and logs action if key is in cookies' do
    Rails.logger.expects(:info).with('FLINKS : store_flinks_data id -  - ').once
    store_flinks_data('id', nil, nil)
    Rails.logger.expects(:info).with('FLINKS : clear_flinks_data  - id').once
    Rails.logger.expects(:info).with('Clearing :flinks_request_id from cookies').once
    clear_flinks_data

    assert_nil(cookies[:flinks_request_id])
    assert_nil(cookies[:flinks_route])
  end
end
