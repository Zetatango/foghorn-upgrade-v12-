# frozen_string_literal: true

require 'test_helper'

class UserTest < ActiveSupport::TestCase
  def setup
    @partner = create(:partner)
    stub_users(@partner)
    stub_access_token
  end

  test 'User model has all attributes' do
    assert_respond_to(@merchant_new, :uid)
    assert_respond_to(@merchant_new, :email)
    assert_respond_to(@merchant_new, :name)
    assert_respond_to(@merchant_new, :enabled)
    assert_respond_to(@merchant_new, :profile_partner_filter)
    assert_respond_to(@merchant_new, :created_at)
    assert_respond_to(@merchant_new, :properties)
    assert_respond_to(@merchant_new, :profiles)
    assert_respond_to(@merchant_new, :selected_profile)
    assert_respond_to(@merchant_new, :insights_preference)
    assert_respond_to(@merchant_new, :product_preference)
    assert_respond_to(@merchant_new, :preferred_language)
  end

  test 'User with no attributes has no attributes' do
    user = User.new(uid: 'u_newuser', name: 'User', email: 'a@b.com')

    assert_not_nil user
    assert_equal 0, user.key_value_attributes.length
  end

  test 'User with no profiles has no attributes' do
    assert_not_nil @no_profile_user
    assert_equal 0, @no_profile_user.profile_info.count
  end

  test 'User with selected profile can check for merchant' do
    @merchant_new.selected_profile = @merchant_new.profile_info.last[:uid]

    assert @merchant_new.merchant_exists?
  end

  test 'User with attributes has attributes' do
    assert_equal 2, @merchant_new.key_value_attributes.length
  end

  test 'User with profiles has profiles' do
    assert_equal 1, @merchant_new.profile_info.count
  end

  test 'User with multiple profiles has multiple profiles' do
    assert @multi_profile_user.profile_info.count > 1
  end

  test 'Can access user properties' do
    assert_not_nil @merchant_new.key_value_attributes[:preferred_language]
  end

  test 'Can access user profile' do
    merchant_admin_profile = @merchant_admin.profile(@merchant_admin_p_guid)

    assert_equal 'merchant_admin', merchant_admin_profile[:role]
    assert_equal @partner.id, merchant_admin_profile[:partner]
  end

  test 'Can access user profiles' do
    merchant_new_profile = @multi_profile_user.profile(@multi_profile_user.first_valid_profile_guid)
    partner_admin_profile = @multi_profile_user.profile(@multi_profile_user.find_partner_admin_profile_guid)

    assert_equal 'merchant_new', merchant_new_profile[:role]
    assert_equal @partner.id, merchant_new_profile[:partner]
    assert_equal 'partner_admin', partner_admin_profile[:role]
    assert_equal @partner.id, partner_admin_profile[:partner]
  end

  test 'Can determine partner admin role' do
    assert @partner_admin.partner_admin_role?
    assert_not @merchant_new.partner_admin_role?
  end

  test 'single profile user with a role of merchant_admin is a merchant admin' do
    assert @merchant_admin.merchant_admin?
  end

  test 'multi-profile user with a partner profile selected is not a merchant admin' do
    @multi_profile_user.selected_profile = @multi_profile_user.find_partner_admin_profile_guid
    assert_not @multi_profile_user.merchant_admin?
  end

  test 'partner_admin is not a merchant admin' do
    assert_not @partner_admin.merchant_admin?
  end

  test 'no profile user is not a merchant admin' do
    assert_not @no_profile_user.merchant_admin?
  end

  test 'multi-profile user with partner filter set to random partner has no profiles' do
    @multi_profile_user.profile_partner_filter = "p_#{SecureRandom.base58(16)}"
    assert_not @multi_profile_user.multiple_profiles?
  end

  test 'multi-profile user with partner filter set can access all profiles' do
    @multi_profile_user.profile_partner_filter = "p_#{SecureRandom.base58(16)}"

    assert_not_equal @multi_profile_user.profile_info.count, @multi_profile_user.profile_info(filter: false).count
    assert_equal 0, @multi_profile_user.profile_info.count
  end

  test 'partner_admin has no merchant profile' do
    user = User.new(name: 'Test', email: 'test@example.com', profile_partner_filter: @partner)
    assert_nil user.first_valid_profile_guid
  end

  test 'a single profile account is not a multi-profile account' do
    assert_not @merchant_new.multiple_profiles?
  end

  test 'a multiple profile account is a multi-profile account' do
    assert @multi_profile_user.multiple_profiles?
  end

  test 'can retrieve profile if it exists with only one profile' do
    profile = @partner_admin.profile(@partner_admin.find_partner_admin_profile_guid)

    assert_not_nil @partner_admin
    assert 'partner_admin', profile[:role]
    assert @partner, profile[:partner]
  end

  test 'can retrieve profile if it exists with multiple profiles' do
    profile = @multi_profile_user.profile(@multi_profile_user.find_partner_admin_profile_guid)

    assert_not_nil profile
    assert 'partner_admin', profile[:role]
    assert @partner.id, profile[:partner]
  end

  test 'cannot retrieve profile if it does not exist' do
    assert_nil @multi_profile_user.profile("p_#{SecureRandom.base58(16)}")
  end

  test 'cannot retrieve profile if none exists' do
    assert_nil @no_profile_user.profile("p_#{SecureRandom.base58(16)}")
  end

  test 'can retrieve profile associated with merchant_guid' do
    profile_guid = @merchant_new.find_profile_for_merchant(@merchant_new_m_guid)

    assert_equal @merchant_new_p_guid, profile_guid
  end

  # can_add_business?
  test '"Single" profile user that has completed onboarding with merchant_add profile has can_add_business: true' do
    merchant_new_and_merchant_add_user = build :user, add_new_business: true, merchant_new: 1
    assert merchant_new_and_merchant_add_user.can_add_business?(@partner)
  end

  test 'Multi profile user that has completed onboarding has can_add_business: true' do
    assert @multi_profile_user.can_add_business?(@partner)
  end

  test 'Single profile user that has completed onboarding with no merchant_add profile has can_add_business: true' do
    assert @merchant_new.can_add_business?(@partner)
  end

  test 'Multi profile user that has completed onboarding but partner has disable multi-business can_add_business: false' do
    refute @multi_profile_user.can_add_business?(@partner2)
  end

  test 'Single profile user that has not completed onboarding(no applicant) has can_add_business: false' do
    refute @merchant_onboarding.can_add_business?(@partner)
  end

  test 'Partner admin user has can_add_business: false' do
    refute @partner_admin.can_add_business?(@partner)
  end

  test 'No profiles user has can_add_business: false' do
    refute @no_profile_user.can_add_business?(@partner)
  end

  test 'User with no applicant can_add_business: false' do
    multi_incomplete_merchant = build :user, merchant_onboarding: 2
    refute multi_incomplete_merchant.can_add_business?(@partner)
  end

  test 'merchant_lookup logs an error if merchant lookup fails' do
    ZetatangoService.any_instance.stubs(:merchant_lookup).raises(ZetatangoService::ZetatangoServiceException)
    Rails.logger.expects(:error).with("Failed to lookup merchant #{@merchant_new_m_guid}: ZetatangoService::ZetatangoServiceException")
    @merchant_new.filtered_profile_info(@partner)
  end

  test 'merchant lookup does not return a profile if an error occurs' do
    ZetatangoService.any_instance.stubs(:merchant_lookup).raises(ZetatangoService::ZetatangoServiceException)
    assert_empty @merchant_new.filtered_profile_info(@partner)
  end

  test 'filter_out_add_business removes "Add Business" profiles 1/3' do
    stub_user_profiles_lookup(@merchant_onboarding)
    profiles = @merchant_onboarding.filtered_profile_info(@partner)
    assert 0, @merchant_onboarding.filter_out_add_business(profiles).count
  end

  test 'filter_out_add_business removes "Add Business" profiles 2/3' do
    stub_user_profiles_lookup(@multi_profile_user)
    profiles = @multi_profile_user.filtered_profile_info(@partner)
    assert profiles.count - 1, @multi_profile_user.filter_out_add_business(profiles).count
  end

  test 'filter_out_add_business removes "Add Business" profiles 3/3' do
    stub_user_profiles_lookup(@merchant_new)
    profiles = @merchant_new.filtered_profile_info(@partner)
    assert profiles.count, @merchant_new.filter_out_add_business(profiles).count
  end

  test 'LOC customer should default to onboarding route' do
    user = build :user, product_preference: User::PRODUCT_LOC
    assert_equal 'onboarding', user.default_route
  end

  test 'CFA customer should default to insights route' do
    user = build :user, product_preference: User::PRODUCT_CFA
    assert_equal 'insights', user.default_route
  end

  # self.from_omniauth
  test 'should have expected properties' do
    omniauth_hash = OmniAuth::AuthHash.new(
      uid: '',
      info: {
        name: '',
        email: ''
      },
      credentials: {
        token: ''
      },
      extra: {
        raw_info: {
          enabled: true,
          properties: [],
          profiles: [],
          preferred_language: 'en',
          applicant: '',
          insights_preference: true,
          product_preference: User::PRODUCT_LOC
        }
      }
    )
    user = User.from_omniauth(omniauth_hash, @partner.id)

    assert_not_nil user
    assert_not_nil user.uid
    assert_not_nil user.name
    assert_not_nil user.email
    assert_not_nil user.enabled
    assert_not_nil user.profile_partner_filter
    assert_not_nil user.global_access_token
    assert_not_nil user.access_token
    assert_not_nil user.properties
    assert_not_nil user.profiles
    assert_not_nil user.preferred_language
    assert_not_nil user.applicant
    assert_not_nil user.preferred_language
    assert_not_nil user.insights_preference
    assert_not_nil user.product_preference
  end
end
