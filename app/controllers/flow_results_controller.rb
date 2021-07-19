# frozen_string_literal: true

class FlowResultsController < ApplicationController
  layout 'flow'

  def show
    @flow_parameters = Base64.encode64(allowed_parameters.to_h.to_json)
  end

  private

  def allowed_parameters
    params.permit(:status, :message)
  end
end
