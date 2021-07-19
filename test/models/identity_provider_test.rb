# frozen_string_literal: true

require 'test_helper'

class IdentityProviderTest < ActiveSupport::TestCase
  def setup
    @idp = build :identity_provider
  end

  test 'IdentityProvider model has all attributes' do
    assert_respond_to(@idp, :id)
    assert_respond_to(@idp, :subdomain)
    assert_respond_to(@idp, :vanity_url)
    assert_respond_to(@idp, :name)
    assert_respond_to(@idp, :created_at)
  end

  test 'IdentityProvider with uid, vanity and vanity url are valid' do
    assert @idp.valid?
  end

  test 'IdentityProvider attributes can be accessed by class as an array' do
    assert_instance_of Array, @idp.attributes
  end

  test 'IdentityProvider attribute can be accessed by instance as an array' do
    assert_instance_of Array, IdentityProvider.attributes
  end
end
