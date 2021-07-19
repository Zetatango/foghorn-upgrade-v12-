# frozen_string_literal: true

require 'test_helper'

class SessionManagerServiceTest < ActiveSupport::TestCase
  def setup
    @user = User.new(uid: "u_#{SecureRandom.base58(16)}", name: 'New User', email: 'new@example.com', enabled: true, created_at: Time.now)
    @other_user = User.new(uid: "u_#{SecureRandom.base58(16)}", name: 'Other User', email: 'other@example.com', enabled: true, created_at: Time.now)

    @service = SessionManagerService.instance
    @service.delete_all
  end

  teardown do
    @service.delete_all
  end

  test 'can create new session with correct created_at time' do
    session_id = @service.create_session(@user.uid)
    assert check_time(Time.now, @service.created_at(session_id))
  end

  test 'can create new session with correct updated_at time' do
    session_id = @service.create_session(@user.uid)
    assert check_time(Time.now, @service.updated_at(session_id))
  end

  test 'touching session updates updated_at time' do
    session_id = @service.create_session(@user.uid)
    current_time = Time.now
    assert check_time(current_time, @service.updated_at(session_id))

    Timecop.freeze(current_time + 3.minutes) do
      @service.touch(session_id)
      assert check_time(Time.now, @service.updated_at(session_id))
    end
  end

  test 'creates valid sessions' do
    session_id = @service.create_session(@user.uid)
    assert @service.valid?(session_id, @user)
  end

  test 'session is invalid for different user' do
    session_id = @service.create_session(@user.uid)
    @user.uid = "u_#{SecureRandom.base58(16)}"
    assert_not @service.valid?(session_id, @user)
  end

  test 'session is invalid after session timeout' do
    session_id = @service.create_session(@user.uid)

    Timecop.freeze(Time.now + Rails.configuration.session_timeout + 1.minute) do
      assert_not @service.valid?(session_id, @user)
    end
  end

  test 'session is invalid after inactivity timeout' do
    session_id = @service.create_session(@user.uid)

    Timecop.freeze(Time.now + Rails.configuration.inactivity_timeout + 1.minute) do
      assert_not @service.valid?(session_id, @user)
    end
  end

  test 'sessions kept alive are invalid after session timeout' do
    session_id = @service.create_session(@user.uid)

    inactivity = Rails.configuration.inactivity_timeout
    session = Rails.configuration.session_timeout

    Rails.configuration.inactivity_timeout = 1.minute
    Rails.configuration.session_timeout = 2.minutes

    4.times do |t|
      Timecop.freeze(Time.now + (30.seconds * t)) do
        @service.touch(session_id)
        assert @service.valid?(session_id, @user)
      end
    end

    Timecop.freeze(Time.now + 2.minutes + 1.second) do
      assert_not @service.valid?(session_id, @user)
    end

    Rails.configuration.inactivity_timeout = inactivity
    Rails.configuration.session_timeout = session
  end

  test 'invalid sessions have no created_at time' do
    assert_nil @service.created_at(SecureRandom.base64(32))
  end

  test 'destroy session removes session' do
    session_id = @service.create_session(@user.uid)
    @service.destroy_session(session_id)
    assert_not @service.valid?(session_id, @user)
  end

  test 'destroy session removes all sessions' do
    session_ids = []
    5.times do
      session_ids << @service.create_session(@user.uid)
    end
    session_ids.each do |session_id|
      @service.destroy_session(session_id)
      assert_not @service.valid?(session_id, @user)
    end
  end

  test 'delete_all clears all sessions' do
    session_ids = []
    5.times do
      session_ids << @service.create_session(@user.uid)
    end
    @service.delete_all
    session_ids.each do |session_id|
      assert_nil @service.created_at(session_id)
    end
  end

  test 'locked cache throws error on read' do
    session_id = @service.create_session(@user.uid)
    lock_manager = Redlock::Client.new([Rails.application.secrets.redis_url])
    lock_info = lock_manager.lock(session_id, 100_000)
    assert_raises(SessionManagerService::LockException) do
      @service.created_at(session_id)
    end
    lock_manager.unlock(lock_info)
  end

  test 'locked cache throws error on write' do
    session_id = @service.create_session(@user.uid)

    Rails.cache.stubs(:write).raises(Redlock::LockError.new(session_id))

    assert_raises(SessionManagerService::LockException) do
      @service.touch(session_id)
    end
  end

  test 'redis cache read timeout error throws exception' do
    session_id = @service.create_session(@user.uid)

    Rails.cache.stubs(:write).raises(Redis::TimeoutError)

    assert_raises(SessionManagerService::RedisException) do
      @service.touch(session_id)
    end
  end

  test 'locked cache throws error on destroy' do
    session_id = @service.create_session(@user.uid)
    lock_manager = Redlock::Client.new([Rails.application.secrets.redis_url])
    lock_info = lock_manager.lock(session_id, 100_000)
    assert_raises(SessionManagerService::LockException) do
      @service.destroy_session(session_id)
    end
    lock_manager.unlock(lock_info)
  end

  test 'redis timeout throws error on destroy' do
    session_id = @service.create_session(@user.uid)

    Rails.cache.stubs(:read).raises(Redis::TimeoutError)

    assert_raises(SessionManagerService::RedisException) do
      @service.destroy_session(session_id)
    end
  end

  test 'cache read timeout on valid? throws exception' do
    session_id = @service.create_session(@user.uid)

    Rails.cache.stubs(:read).raises(Redis::TimeoutError)

    assert_raises(SessionManagerService::RedisException) do
      @service.valid?(session_id, @user)
    end
  end

  test 'clearing user sessions renders them invalid' do
    session_id = @service.create_session(@user.uid)
    @service.delete_all_for_uid(@user.uid)
    assert_not @service.valid?(session_id, @user)
  end

  test 'clearing user sessions returns true' do
    @service.create_session(@user.uid)
    assert @service.delete_all_for_uid(@user.uid)
  end

  test 'failing to clear user sessions returns false' do
    @service.create_session("u_#{SecureRandom.base58(16)}")
    Rails.cache.stubs(:delete).raises(Redlock::LockError.new(SecureRandom.base64(32)))
    assert_not @service.delete_all_for_uid(@user.uid)
  end

  test "clearing user sessions only clears the user's sessions" do
    other_user_sessions = []
    3.times do
      other_user_sessions << @service.create_session(@other_user.uid)
    end
    session_id = @service.create_session(@user.uid)
    @service.delete_all_for_uid(@user.uid)
    assert_not @service.valid?(session_id, @user)
    other_user_sessions.each do |id|
      assert @service.valid?(id, @other_user)
    end
  end

  test 'delete_all_for_uid clears all user sessions' do
    session_ids = []
    5.times do
      session_ids << @service.create_session(@user.uid)
    end
    @service.delete_all_for_uid(@user.uid)
    session_ids.each do |session_id|
      assert_not @service.valid?(session_id, @user)
    end
  end

  test 'redis timeout error on delete_all_for_uid returns false' do
    session_ids = []
    5.times do
      session_ids << @service.create_session(@user.uid)
    end

    Rails.cache.stubs(:read).raises(Redis::TimeoutError)
    Rails.cache.stubs(:write).raises(Redis::TimeoutError)

    assert_not @service.delete_all_for_uid(@user.uid)
  end
end
