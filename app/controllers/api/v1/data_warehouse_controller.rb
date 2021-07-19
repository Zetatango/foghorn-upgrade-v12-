# frozen_string_literal: true

class Api::V1::DataWarehouseController < ApplicationController
  before_action :validate_token

  # GET /api/v1/data_warehouse/aggregated_bank_accounts
  def aggregated_bank_accounts
    account_guids = aggregated_bank_accounts_params[:account_guids] || ''
    data = service.query_aggregated_accounts_insights(
      current_user.owner_guid,
      account_guids.split(','),
      aggregation: aggregated_bank_accounts_params[:aggregation]&.to_i
    )

    render json: { status: 'Success', message: 'Returned aggregated accounts insights', data: data }, status: :ok
  rescue DataWarehouse::DataWarehouseServiceBase::AggregationError,
         DataWarehouse::DataWarehouseServiceBase::ApiError,
         DataWarehouse::DataWarehouseServiceBase::ConfigurationError,
         DataWarehouse::DataWarehouseServiceBase::QueryError,
         Speedy::InsightsService::AggregationError,
         Speedy::InsightsService::ApiException,
         Speedy::InsightsService::ConfigurationError,
         Speedy::InsightsService::QueryError => e
    render json: { status: 'Error', message: e.message }, status: :bad_request
  rescue ActionController::ParameterMissing => e
    render json: { status: 'Error', message: "Required parameter #{e.param} missing" }, status: :bad_request
  end

  private

  def aggregated_bank_accounts_params
    params.require(%i[aggregation account_guids])

    params.permit(:aggregation, :account_guids)
  end

  def service
    @service = if Rails.configuration.use_speedy
                 Speedy::InsightsService.new(current_user.access_token)
               else
                 DataWarehouse::DataWarehouseServiceFactory.create(current_user.access_token)
               end
  end
end
