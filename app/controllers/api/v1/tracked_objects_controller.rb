# frozen_string_literal: true

class Api::V1::TrackedObjectsController < ApplicationController
  before_action :validate_token, :validate_tracked_object_guid, :validate_listing_parameters

  # GET /api/v1/tracked_objects/{tracked_object_id}/tracked_object_events
  def tracked_object_events
    params = {
      offset: tracked_object_events_params[:offset],
      limit: tracked_object_events_params[:limit]
    }
    params[:order_by] = tracked_object_events_params[:order_by] if tracked_object_events_params.key?(:order_by)
    params[:order_direction] = tracked_object_events_params[:order_direction] if tracked_object_events_params.key?(:order_direction)
    params[:filter] = tracked_object_events_params[:filter] if tracked_object_events_params.key?(:filter)

    response = ztt_client.tracked_objects_api.get_tracked_object_events(tracked_object_events_params[:id], params)

    render json: { status: 'SUCCESS', message: 'Business partner merchants tracked objects listed successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while listing business partner merchants tracked objects: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def validate_tracked_object_guid
    tracked_object_guid = tracked_object_events_params[:id]

    return render json: { status: 'Error', message: 'Tracked object guid is required' }, status: :bad_request if tracked_object_guid.blank?

    render json: { status: 'Error', message: 'Tracked object guid is invalid' }, status: :bad_request unless tracked_object_guid_valid?(tracked_object_guid)
  end

  def tracked_object_guid_valid?(tracked_object_guid)
    /^obj_\w{16}$/.match?(tracked_object_guid)
  end

  def validate_listing_parameters
    offset = tracked_object_events_params[:offset]
    limit = tracked_object_events_params[:limit]

    return render json: { status: 'Error', message: 'Offset is required' }, status: :bad_request if offset.blank?
    return render json: { status: 'Error', message: 'Limit is required' }, status: :bad_request if limit.blank?
  end

  def tracked_object_events_params
    params.permit(:id, :offset, :limit, :order_by, :order_direction, :filter)
  end
end
