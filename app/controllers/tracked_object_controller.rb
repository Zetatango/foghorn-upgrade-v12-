# frozen_string_literal: true

class TrackedObjectController < ApplicationController
  before_action :vaidate_tracked_object_event, only: %i[show]

  PERMITTED_TRACKED_OBJECT_EVENTS = %w[viewed].freeze

  def show
    ZetatangoService.instance.add_tracked_object_event(show_params[:id], show_params[:event])

    respond_with_tracking_image
  rescue ZetatangoService::ZetatangoServiceException => e
    Rails.logger.warn("Error handling tracked object request: #{e.message}")

    respond_with_tracking_image
  end

  private

  def show_params
    params.permit(:id, :event)
  end

  def permitted_tracked_object_event?(action)
    PERMITTED_TRACKED_OBJECT_EVENTS.include?(action)
  end

  def vaidate_tracked_object_event
    respond_with_tracking_image unless params.key?(:event) && permitted_tracked_object_event?(params[:event])
  end

  def respond_with_tracking_image
    send_file 'public/tracking.png', type: 'image/png', disposition: 'inline', status: :ok
  end
end
