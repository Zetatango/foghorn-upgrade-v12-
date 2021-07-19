# frozen_string_literal: true

class User
  PRODUCT_CFA = 'CFA'
  PRODUCT_LOC = 'LOC'

  attr_accessor :uid, :name, :email, :enabled, :profile_partner_filter, :created_at, :global_access_token, :access_token, :properties,
                :profiles, :selected_profile, :preferred_language, :applicant, :insights_preference, :product_preference

  def initialize(attributes)
    attributes.each do |key, value|
      instance_variable_set("@#{key}", value)
    end
  end

  def self.from_omniauth(omniauth_hash, partner_guid)
    User.new(
      uid: omniauth_hash.uid,
      name: omniauth_hash.info.name,
      email: omniauth_hash.info.email,
      enabled: omniauth_hash.extra.raw_info.enabled,
      profile_partner_filter: partner_guid,
      global_access_token: omniauth_hash.credentials.token,
      access_token: omniauth_hash.credentials.token,
      properties: omniauth_hash.extra.raw_info.properties,
      profiles: omniauth_hash.extra.raw_info.profiles,
      preferred_language: omniauth_hash.extra.raw_info.preferred_language,
      applicant: omniauth_hash.extra.raw_info.applicant,
      insights_preference: omniauth_hash.extra.raw_info.insights_preference,
      product_preference: omniauth_hash.extra.raw_info.product_preference
    )
  end

  def key_value_attributes
    key_value_pairs = ActiveSupport::HashWithIndifferentAccess.new
    return key_value_pairs if properties.nil?

    properties.each do |key, value|
      key_value_pairs[key] = value
    end
    key_value_pairs
  end

  def profile_info(filter: true)
    profile_info = []
    return profile_info if profiles.nil? || (filter && profile_partner_filter.blank?)

    profiles.each do |profile|
      if filter
        next unless valid_profile?(profile)
      end

      profile_info << create_profile(profile)
    end

    profile_info
  end

  def filtered_profile_info(partner)
    loaded_profiles = load_profiles(profile_info)
    filtered_profiles = filter_profiles(loaded_profiles)
    filtered_profiles = filter_out_add_business(filtered_profiles) unless can_add_business?(partner)
    filtered_profiles.sort_by { |profile| [profile.dig(:properties, :role)] }
  end

  def profile(profile_guid)
    profile_info.each do |profile|
      return profile[:properties] if profile[:uid] == profile_guid
    end

    nil
  end

  def find_profile_for_merchant(merchant_guid)
    profile_info.each do |profile|
      return profile[:uid] if profile[:properties][:merchant].to_s == merchant_guid
    end
  end

  def find_partner_admin_profile_guid
    profile_info.each do |profile|
      return profile[:uid] if profile.dig(:properties, :role) == 'partner_admin'
    end

    nil
  end

  def first_valid_profile_guid
    profile_info.each do |profile|
      return profile['uid'] if profile['uid'].present? && profile.dig(:properties, :merchant).present?
    end

    nil
  end

  def merchant_new?
    return role_multiple_profiles?('merchant_new') if multiple_profiles?

    role?('merchant_new')
  end

  def partner_admin?
    return role_multiple_profiles?('partner_admin') if multiple_profiles?

    role?('partner_admin')
  end

  def merchant_admin?
    return role_multiple_profiles?('merchant_admin') if multiple_profiles?

    role?('merchant_admin')
  end

  def merchant_exists?
    profile(@selected_profile)&.key?(:merchant)
  end

  def merchant_on_selected_profile
    profile(@selected_profile)[:merchant] if merchant_exists?
  end

  def multiple_profiles?
    profile_info.count > 1
  end

  def partner_admin_role?
    profile_info.each do |profile|
      return true if profile.dig(:properties, :role) == 'partner_admin'
    end

    false
  end

  def can_add_business?(partner)
    return false unless partner&.conf_allow_multiple_businesses

    has_applicant = false

    profile_info.each do |profile|
      has_applicant = true if profile.dig(:properties, :applicant).present?
    end

    has_applicant
  end

  def load_profiles(profiles)
    merchant_profiles = []
    profiles.each do |profile|
      modified_profile = profile.dup

      merchant_guid = profile.dig(:properties, :merchant)
      if merchant_guid.blank?
        merchant_profiles << modified_profile
        next
      end

      # NOTE: [Graham] DRY this method, and potentially implement a bugsnag.
      merchant = merchant_lookup(merchant_guid)
      next unless merchant.present?

      modified_profile[:properties][:merchant] = {
        id: merchant[:id],
        business_num: merchant[:business_num],
        name: merchant[:name],
        doing_business_as: merchant[:doing_business_as]
      }

      merchant_profiles << modified_profile
    end

    merchant_profiles
  end

  def filter_profiles(profiles)
    merchant_profiles = []
    profiles.each do |profile|
      next unless selectable_profile?(profile)

      modified_profile = profile.dup

      # If the first profile is placeholder for "add new", then simply add it.
      modified_profile[:properties][:role] = 'merchant_add' if add_placeholder_merchant?(profile)
      merchant_profiles << modified_profile
    end
    merchant_profiles
  end

  def filter_out_add_business(profiles)
    profiles.reject { |profile| profile.dig(:properties, :role) == 'merchant_add' }
  end

  def default_route
    return 'insights' if product_preference == PRODUCT_CFA

    'onboarding'
  end

  def owner_guid
    merchant_guid || lead_guid
  end

  private

  def create_profile(profile)
    info = ActiveSupport::HashWithIndifferentAccess.new
    info[:uid] = profile[:uid] || profile['uid']
    info[:properties] = ActiveSupport::HashWithIndifferentAccess.new
    profile[:properties]&.each do |key, value|
      info[:properties][key] = value
    end
    # NOTE: [Graham] can this be removed?
    profile['properties']&.each do |key, value|
      info[:properties][key] = value
    end
    info
  end

  # NOTE: this requires the string, or symbol check due to middleware.
  def valid_profile?(profile)
    profile.dig('properties', 'partner') == profile_partner_filter || profile.dig(:properties, :partner) == profile_partner_filter
  end

  def role?(role)
    return false if profile_info.count.zero?

    profile_info.first.dig(:properties, :role) == role
  end

  def role_multiple_profiles?(role)
    return false unless @selected_profile.present?

    profile_info.each do |profile|
      return true if profile[:uid] == @selected_profile && profile.dig(:properties, :role) == role
    end

    false
  end

  def placeholder_merchant?(profile)
    profile.dig(:properties, :role) == 'merchant_new' && profile.dig(:properties, :applicant).blank? && profile.dig(:properties, :merchant).blank?
  end

  def selectable_profile?(profile)
    %w[merchant_admin merchant_new partner_admin].include?(profile.dig(:properties, :role)) && selected_profile != profile[:uid]
  end

  def add_placeholder_merchant?(profile)
    placeholder_merchant?(profile)
  end

  def merchant_lookup(merchant_guid)
    merchant = nil
    begin
      merchant = ZetatangoService.instance.merchant_lookup(merchant_guid)
    rescue ZetatangoService::ZetatangoServiceException => e
      Rails.logger.error("Failed to lookup merchant #{merchant_guid}: #{e.message}")
    end
    merchant
  end

  def current_selected_profile
    profile(@selected_profile)
  end

  def merchant_guid
    current_selected_profile&.dig(:merchant)
  end

  def lead_guid
    current_selected_profile&.dig(:lead)
  end
end
