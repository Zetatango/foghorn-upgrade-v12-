# frozen_string_literal: true

class Api::V1::MarketingCampaignsController < ApplicationController
  before_action :validate_token
  before_action :validate_create_campaign_params, only: :create

  # POST /api/v1/marketing_campaigns
  def create
    ztt_client.marketing_api.create_marketing_campaign(
      create_campaign_params[:scheduled_at]
    )
    render json: { status: 'SUCCESS', message: 'Marketing campaign successfully created', data: {} }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while creating a new marketing campaign: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/marketing_campaigns
  def index
    params = marketing_campaigns_list_params.slice(:offset, :limit, :order_by, :order_direction)
    response = ztt_client.marketing_api.get_marketing_campaigns(params)

    render json: { status: 'SUCCESS', message: 'Marketing campaigns listed successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting marketing campaigns listing: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # GET /api/v1/marketing_campaigns/{id}
  def show
    response = ztt_client.marketing_api.get_marketing_campaign(
      show_marketing_campaigns_params[:id]
    )

    render json: { status: 'SUCCESS', message: 'Retrieved marketing campaign successfully', data: response }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while requesting a marketing campaign: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  # DELETE /api/v1/marketing_campaigns/{id}
  def destroy
    ztt_client.marketing_api.delete_marketing_campaign(
      delete_marketing_campaigns_params[:id]
    )

    render json: { status: 'SUCCESS', message: 'Marketing campaign successfully deleted', data: {} }, status: :ok
  rescue SwaggerClient::ApiError => e
    response = parse_api_error(e)
    Rails.logger.error("An error with code, #{response[:code]}, occurred while deleting a marketing campaign: #{response[:message]}")
    render json: { status: 'Error', message: response[:message], code: response[:code] }, status: response[:status]
  end

  private

  def create_campaign_params
    params.permit(:scheduled_at)
  end

  def validate_create_campaign_params
    scheduled_at = create_campaign_params[:scheduled_at]

    return render json: { status: 'Error', message: 'Schedule date is required' }, status: :bad_request if scheduled_at.blank?

    if scheduled_at < 1.day.from_now.beginning_of_day
      return render json: {
        status: 'Error',
        message: 'Schedule date must start after the end of today'
      }, status: :bad_request
    end

    return unless scheduled_at > 30.days.from_now.utc.end_of_day

    render json: {
      status: 'Error',
      message: 'Schedule date must be at least within 30 days'
    }, status: :bad_request
  end

  def marketing_campaigns_list_params
    params.permit(:offset, :limit, :order_by, :order_direction)
  end

  def show_marketing_campaigns_params
    params.permit(:id)
  end

  def delete_marketing_campaigns_params
    params.permit(:id)
  end
end
