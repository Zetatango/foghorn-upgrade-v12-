# frozen_string_literal: true

module ZttClientHelper
  protected

  def ztt_client
    ZttClient.new(current_access_token)
  end
end
