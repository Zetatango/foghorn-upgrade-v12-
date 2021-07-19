# frozen_string_literal: true

module MerchantRedirection
  extend ActiveSupport::Concern

  protected

  def merchant_welcome_redirect_url(path)
    redirect_path = "/users/#{path}"
    redirect_params = { partner: current_partner.id }.merge(adjusted_merchant_params)

    roadrunner_url(redirect_path, redirect_params)
  end

  def merchant_welcome_redirect?
    current_partner&.valid? && current_partner&.conf_merchant_welcome == false
  end

  private

  def adjusted_merchant_params
    params.tap do |p|
      p[:referrer] = p[:supplier] if p.key?(:supplier)
    end

    params.permit(:invoice_id, :locale, :referrer, :tracked_object_id, :flow, :email, :name, :external_id)
  end
end
