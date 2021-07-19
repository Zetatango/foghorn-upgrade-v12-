# frozen_string_literal: true

module UserSessionHelper
  include FlinksHelper

  protected

  def user_signed_in?
    return true if @load_user.present?
    return false unless session[:zetatango_user].present? && session[:zetatango_session].present?

    load_user
    update_and_check_session?
  rescue SessionManagerService::SessionManagerException, SessionManagerService::LockException => e
    Rails.logger.warn("Destroying user session due to session exception during user sign in check: #{e.message}")
    destroy_user_session
    false
  end

  def sign_in_user(user, profile_guid = nil)
    # Preserve the partner session as it is set from the vanity
    partner = current_partner

    sign_out_user

    # Restore partner session
    session[:partner] = partner

    return nil unless user_setup?(user, profile_guid)

    session[:zetatango_user] = user
    session[:zetatango_session] = session_manager.create_session(user.uid)

    load_user
  rescue SessionManagerService::SessionManagerException, SessionManagerService::LockException => e
    Rails.logger.warn("Destroying user session due to session exception during user sign in: #{e.message}")
    destroy_user_session
  end

  def sign_out_user
    session_manager.destroy_session(session[:zetatango_session])
    destroy_user_session
  rescue SessionManagerService::SessionManagerException, SessionManagerService::LockException => e
    Rails.logger.warn("Destroying user session due to session exception during user sign out: #{e.message}")
    destroy_user_session
  end

  def current_user
    return load_user if user_signed_in?

    nil
  end

  def session_manager
    @session_manager ||= SessionManagerService.instance
  end

  private

  # NOTE: is load_partner.id even accessible here? It's a private method from partner_identity.rb
  def set_profile_access_token(user, profile_guid)
    context = { endorsing_partner: load_partner.id }
    service = ProfileAccessTokenService.new(profile_guid, user.global_access_token, context)

    user.access_token = service.api_access_token
    user.selected_profile = profile_guid

    true
  rescue ProfileAccessTokenService::ProfileAccessTokenServiceException => e
    Rails.logger.error("Could not get a profile access token: #{e.message}")
    false
  end

  def user_setup?(user, profile_guid = nil)
    return false if user.profile_info.count.zero?
    return false if profile_guid.nil? && user.profile_info.count > 1

    profile_guid = user.profile_info.first[:uid] unless user.multiple_profiles?

    return true if partner_admin_profile?(user, profile_guid)

    set_profile_access_token(user, profile_guid)
  end

  def partner_admin_profile?(user, profile_guid)
    user.profile_info.each do |profile|
      return true if profile[:uid] == profile_guid && profile[:properties][:role].to_s == 'partner_admin'
    end
    false
  end

  def update_and_check_session?
    is_valid = session_manager.valid?(session[:zetatango_session], @load_user)
    session_manager.touch(session[:zetatango_session]) if is_valid
    @load_user = nil unless is_valid
    is_valid
  end

  def destroy_user_session
    clear_flinks_data
    reset_session
    @load_user = nil
  end

  def load_user
    @load_user ||= session[:zetatango_user].is_a?(User) ? session[:zetatango_user] : User.new(session[:zetatango_user])
  end
end
