# frozen_string_literal: true

module ActiveInvoiceId
  extend ActiveSupport::Concern

  included do
    helper_method :current_invoice_id
  end

  protected

  # Sets the invoice param into session
  def store_invoice_id(invoice_id)
    session[:invoice_id] = invoice_id
  end

  # Reads the invoice param from session
  def current_invoice_id
    return nil unless session.key?(:invoice_id)

    # Can't explicitly test this branch as you are not able to manipulate the session in minitest in Rails 5+.
    # :nocov:
    load_invoice_id
    # :nocov:
  end

  private

  # Can't explicitly test this branch as you are not able to manipulate the session in minitest in Rails 5+.
  # :nocov:
  def load_invoice_id
    @load_invoice_id ||= session[:invoice_id]
  end
  # :nocov:
end
