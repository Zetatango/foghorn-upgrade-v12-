# frozen_string_literal: true

require 'test_helper'

class GoogleHelperTest < ActionView::TestCase
  teardown do
    ENV['GOOGLE_PLACES_KEY'] = ''
  end

  test 'returns empty string if GOOGLE_PLACES_KEY environment variable is not set' do
    assert_equal('', google_places_api_key)
  end

  test 'returns value of GOOGLE_PLACES_KEY environment variable if set' do
    value = 'abc123'
    ENV['GOOGLE_PLACES_KEY'] = value
    assert_equal(value, google_places_api_key)
  end

  test 'returns debug google analytics URL if debug flag is true' do
    assert_equal('https://www.google-analytics.com/analytics_debug.js', ga_url)
  end

  test 'returns debug google analytics URL if debug flag is false' do
    Rails.application.secrets.stubs(:ga).returns(track: true, debug: false, ga_tag: '')
    assert_equal('https://www.google-analytics.com/analytics.js', ga_url)
  end
end
