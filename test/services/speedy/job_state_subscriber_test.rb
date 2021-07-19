# frozen_string_literal: true

require 'test_helper'

class Speedy::JobStateSubscriberTest < ActionCable::TestCase
  setup do
    @owner_guid = "m_#{SecureRandom.base58(16)}"
  end

  #
  # #job_state_event
  #
  test '#job_state_event - will broadcast message for ProcessFlinksTransactionsJob' do
    Speedy::ServiceBase::ALL_STATES.each do |state|
      assert_broadcast_on(@owner_guid, job: 'ProcessFlinksTransactionsJob', state: state, event_type: HopperEvents::SPEEDY_JOB_STATE) do
        Speedy::JobStateSubscriber.job_state_event(HopperEvents::SPEEDY_JOB_STATE, job_event(@owner_guid, 'ProcessFlinksTransactionsJob', state), nil)
      end
    end
  end

  test '#job_state_event - will broadcast message for ProjectionJob' do
    Speedy::ServiceBase::ALL_STATES.each do |state|
      assert_broadcast_on(@owner_guid, job: 'ProjectionJob', state: state, event_type: HopperEvents::SPEEDY_JOB_STATE) do
        Speedy::JobStateSubscriber.job_state_event(HopperEvents::SPEEDY_JOB_STATE, job_event(@owner_guid, 'ProjectionJob', state), nil)
      end
    end
  end

  private

  def job_event(owner, name, state)
    {
      name: name,
      owner_guid: owner,
      state: state
    }
  end
end
