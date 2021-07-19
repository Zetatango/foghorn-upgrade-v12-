# frozen_string_literal: true

class IdentityProvider < NoTableRecord
  attr_accessor :id, :subdomain, :vanity_url, :name, :created_at

  def valid?
    id.present? && subdomain.present? && vanity_url.present?
  end
end
