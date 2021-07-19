# frozen_string_literal: true

# rubocop:disable Metrics/ModuleLength
module UsersHelper
  include ScimHelper

  # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
  def stub_users(partner, lead = nil)
    @delegated_access_user = nil
    @no_profile_user = build :user, partner: partner

    @merchant_admin = build :user, :merchant_admin, partner: partner
    @merchant_admin_p_guid = @merchant_admin.profile_info.first[:uid]
    @merchant_admin_m_guid = @merchant_admin.profile_info.first[:properties][:merchant]
    stub_user_profile_token(@merchant_admin_p_guid)
    stub_scim_user(@merchant_admin)

    @merchant_new = build :user, :merchant_new, partner: partner, lead: lead
    @merchant_new_p_guid = @merchant_new.profile_info.first[:uid]
    @merchant_new_m_guid = @merchant_new.profile_info.first[:properties][:merchant]
    stub_user_profile_token(@merchant_new_p_guid)
    stub_scim_user(@merchant_new)

    @merchant_onboarding = build :user, :merchant_onboarding, partner: partner, lead: lead
    @merchant_onboarding_p_guid = @merchant_onboarding.profile_info.first[:uid]
    @merchant_onboarding_m_guid = @merchant_onboarding.profile_info.first[:properties][:merchant]
    stub_user_profile_token(@merchant_onboarding_p_guid)
    stub_scim_user(@merchant_onboarding)

    @partner_admin = build :user, :partner_admin, partner: partner
    @partner_admin_p_guid = @partner_admin.profile_info.first[:uid]
    stub_user_profile_token(@partner_admin_p_guid)
    stub_scim_user(@partner_admin)

    @lead_new = build :user, :lead_new, partner: partner
    @lead_new_p_guid = @lead_new.profile_info.first[:uid]
    @lead_new_m_guid = @lead_new.profile_info.first[:properties][:lead]
    stub_user_profile_token(@lead_new_p_guid)
    stub_scim_user(@lead_new)

    @multi_profile_user = build :user,
                                name: 'User: multi-profile',
                                email: 'multi_profile@example.com',
                                add_new_business: true,
                                merchant_new: 1,
                                merchant_onboarding: 1,
                                is_partner_admin: true,
                                partner: partner,
                                lead: lead
    stub_scim_user(@multi_profile_user)

    @multi_profile_user2 = build :user,
                                 name: 'User: multi-profile',
                                 email: 'multi_profile@example.com',
                                 add_new_business: true,
                                 merchant_new: 2,
                                 merchant_onboarding: 1,
                                 partner: partner
    stub_scim_user(@multi_profile_user2)

    @completed_about_business_user = build :user,
                                           name: 'User: multi-profile',
                                           email: 'multi_profile@example.com',
                                           add_new_business: true,
                                           merchant_onboarding: 1,
                                           partner: partner
    stub_scim_user(@completed_about_business_user)

    @completed_about_you_user = build :user,
                                      name: 'User: multi-profile',
                                      email: 'multi_profile@example.com',
                                      add_new_business: true,
                                      merchant_new: 1,
                                      partner: partner
    stub_scim_user(@completed_about_you_user)

    @multi_profile_user.profile_info.each do |profile|
      stub_user_profile_token(profile[:uid])
    end

    @multi_partner_user = build :multi_partner_user, partner: partner
    stub_scim_user(@multi_partner_user)
  end
  # rubocop:enable Metrics/MethodLength, Metrics/AbcSize

  private

  def stub_scim_user(user)
    stub_request(:get, scim_api_users_path(user.uid))
      .to_return(status: 200, body: scim_user(user).to_json)
  end

  def stub_user_state(user, user_signed_in: true, redirect: false)
    ApplicationController.any_instance.stubs(:current_user).returns(user)
    ApplicationController.any_instance.stubs(:user_signed_in?).returns(user_signed_in)
    ApplicationController.any_instance.stubs(:redirected_user_signed_in?).returns(redirect)
    ApplicationController.any_instance.stubs(:current_access_token).returns(SecureRandom.base58(32))

    stub_user_profiles_lookup(user) unless user.blank?
  end

  # NOTE: [Graham] can we not hook this into sign_in_user?
  def stub_user_profiles_lookup(user, partner_id = 'p_wSL1HoY9L3VrVh6x')
    user.profiles.each_with_index do |profile, index|
      next unless %w[merchant_admin merchant_new].include?(profile.dig(:properties, :role))

      merchant_guid = profile.dig(:properties, :merchant)
      next if merchant_guid.blank?

      response_body = {
        id: merchant_guid,
        partner_id: partner_id,
        email: user.email,
        partner_merchant_id: '12345678900',
        business_num: '12345678900',
        doing_business_as: "Acme Business #{index}",
        name: profile.dig(:properties, :role),
        address: '15 Fitzgerald Rd, Bells Corners, ON',
        incorporated_in: nil,
        campaigns: []
      }.to_json

      stub_request(:get, "#{Rails.configuration.zetatango_url}/api/config/merchants/#{merchant_guid}")
        .with(
          headers: {
            authorization: "Bearer #{@idp_access_token}"
          }
        )
        .to_return(status: 200, body: response_body)
    end
  end

  def stub_user_profile_token(profile_guid)
    stub_request(:post, "#{Rails.configuration.roadrunner_url}/api/users/token")
      .with(body: hash_including(:context, profile_guid: profile_guid))
      .to_return(status: 201, body: { access_token: SecureRandom.base58(32), expires_in: 7200 }.to_json)
  end
end
# rubocop:enable Metrics/ModuleLength
