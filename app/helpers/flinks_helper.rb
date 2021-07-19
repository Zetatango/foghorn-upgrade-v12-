# frozen_string_literal: true

module FlinksHelper
  protected

  def store_flinks_data(request_id, route, owner_guid)
    Rails.logger.info("FLINKS : store_flinks_data #{request_id} - #{route} - #{owner_guid}")
    cookies[:flinks_request_id] = request_id if request_id.present?
    cookies[:flinks_route] = route if route.present?
    Bugsnag.notify(StandardError.new("Flinks route missing for owner(lead/merchant): #{owner_guid}")) unless route.present?
  end

  def clear_flinks_data
    Rails.logger.info("FLINKS : clear_flinks_data #{cookies[:flinks_route]} - #{cookies[:flinks_request_id]}")
    clear_flinks_route if cookies[:flinks_route].present?
    clear_flinks_request_id if cookies[:flinks_request_id].present?
  end

  private

  def clear_flinks_route
    Rails.logger.info('Clearing :flinks_route from cookies')
    cookies.delete :flinks_route
  end

  def clear_flinks_request_id
    Rails.logger.info('Clearing :flinks_request_id from cookies')
    cookies.delete :flinks_request_id
  end
end
