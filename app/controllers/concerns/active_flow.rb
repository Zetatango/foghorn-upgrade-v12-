# frozen_string_literal: true

module ActiveFlow
  extend ActiveSupport::Concern

  included do
    helper_method :current_flow
  end

  protected

  # Sets the flow param into session
  def store_flow(flow)
    session[:flow] = flow
  end

  # Reads the flow param from session
  def current_flow
    return nil unless session.key?(:flow)

    # Can't explicitly test this branch as you are not able to manipulate the session in minitest in Rails 5+.
    # :nocov:
    load_flow
    # :nocov:
  end

  private

  # Can't explicitly test this branch as you are not able to manipulate the session in minitest in Rails 5+.
  # :nocov:
  def load_flow
    @load_flow ||= session[:flow]
  end
  # :nocov:
end
