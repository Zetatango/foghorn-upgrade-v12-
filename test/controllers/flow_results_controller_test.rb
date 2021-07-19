# frozen_string_literal: true

require 'test_helper'

class FlowResultsControllerTest < ActionDispatch::IntegrationTest
  test 'loads ok with no session' do
    get flow_result_path
    assert_response :ok
  end

  test 'includes status and message parameters' do
    flow_parameters = { status: 'SUCCESS', message: 'MESSAGE' }
    get flow_result_path(flow_parameters)
    assert_select "div[id='flow-parameters-div'][data-flow-parameters='#{Base64.encode64(flow_parameters.to_h.to_json)}']", count: 1
  end

  test 'excludes unknown parameters' do
    flow_parameters = { status: 'SUCCESS', message: 'MESSAGE' }
    get flow_result_path(flow_parameters.merge(other: 'OTHER'))
    assert_select "div[id='flow-parameters-div'][data-flow-parameters='#{Base64.encode64(flow_parameters.to_h.to_json)}']", count: 1
  end
end
