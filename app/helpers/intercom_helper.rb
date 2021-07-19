# frozen_string_literal: true

module IntercomHelper
  protected

  def intercom_identity_verification_hash
    return nil if current_user.nil?

    OpenSSL::HMAC.hexdigest(
      'sha256',
      intercom_identity_verification_secret,
      current_user.uid
    )
  end

  def intercom_identity_verification_secret
    Rails.application.secrets.intercom[:identity_verification_secret]
  end
end
