# frozen_string_literal: true

require 'singleton'

class SessionManagerService
  include Singleton

  class SessionManagerException < RuntimeError; end
  class LockException < SessionManagerException; end
  class RedisException < SessionManagerException; end

  def create_session(uid)
    session_id = SecureRandom.base64(32)

    write_session_info(session_id, uid: uid,
                                   created_at: Time.now.utc,
                                   updated_at: Time.now.utc)

    session_id
  end

  def destroy_session(session_id)
    return unless session_id.present?

    delete_session_info(session_id)
  end

  def created_at(session_id)
    return unless session_id.present?

    info = read_session_info(session_id)

    return nil if info.nil?

    info[:created_at]
  end

  def updated_at(session_id)
    return unless session_id.present?

    info = read_session_info(session_id)

    return nil if info.nil?

    info[:updated_at]
  end

  def touch(session_id)
    return unless session_id.present?

    info = read_session_info(session_id)

    return if info.nil?

    info[:updated_at] = Time.now.utc

    write_session_info(session_id, info)
  end

  def valid?(session_id, user)
    return false unless session_id.present? && user.present?

    info = read_session_info(session_id)

    return false if info.nil?

    (Time.now.utc.to_i <= (info[:created_at] + Rails.configuration.session_timeout).utc.to_i) &&
      (Time.now.utc.to_i <= (info[:updated_at] + Rails.configuration.inactivity_timeout).utc.to_i) &&
      info[:uid] == user.uid
  end

  def delete_all
    Rails.cache.clear(namespace: SESSION_NAMESPACE)
  end

  def delete_all_for_uid(user_uid)
    return unless user_uid.present?

    delete_session_info_for_uid(user_uid)
  end

  private

  SESSION_NAMESPACE = 'f1246a12-dac4-483d-8cd9-93f7c4f8f720'

  def initialize
    @lock_manager = Redlock::Client.new([redis])
  end

  def redis
    params = {
      url: Rails.application.secrets.redis_url,
      reconnect_attempts: ENV.fetch('REDIS_RECONNECT_ATTEMPTS', 3).to_i,
      connect_timeout: ENV.fetch('REDIS_CONNECT_TIMEOUT', 3).to_i
    }

    unless Rails.env.e2e?
      params[:driver] = :ruby
      params[:ssl_params] = {
        verify_mode: OpenSSL::SSL::VERIFY_NONE
      }
    end

    Redis.new(params)
  end

  def read_session_info(session_id)
    @lock_manager.lock!(session_id, 1000) do
      Rails.cache.read(session_id, namespace: SESSION_NAMESPACE)
    end
  rescue Redlock::LockError => e
    Rails.logger.error(e.message)
    raise LockException
  rescue Redis::TimeoutError => e
    Rails.logger.error(e.message)
    raise RedisException
  end

  def write_session_info(session_id, session_info)
    @lock_manager.lock!(session_id, 1000) do
      Rails.cache.write(session_id, session_info, expires_in: Rails.configuration.session_timeout, namespace: SESSION_NAMESPACE)
    end
    track_user_session(session_id, session_info)
  rescue Redlock::LockError => e
    Rails.logger.error(e.message)
    raise LockException
  rescue Redis::TimeoutError => e
    Rails.logger.error(e.message)
    raise RedisException
  end

  def track_user_session(session_id, session_info)
    @lock_manager.lock!(session_info[:uid], 1000) do
      user_sessions = Rails.cache.fetch(session_info[:uid], namespace: SESSION_NAMESPACE) { [] }
      user_sessions << session_id unless user_sessions.include?(session_id)
      Rails.cache.write(session_info[:uid], user_sessions, namespace: SESSION_NAMESPACE)
    end
  end

  def delete_session_info(session_id)
    session_info = nil
    @lock_manager.lock!(session_id, 1000) do
      session_info = Rails.cache.read(session_id, namespace: SESSION_NAMESPACE)
      Rails.cache.delete(session_id, namespace: SESSION_NAMESPACE)
    end
    delete_user_session(session_id, session_info) if session_info.present?
  rescue Redlock::LockError => e
    Rails.logger.error(e.message)
    raise LockException
  rescue Redis::TimeoutError => e
    Rails.logger.error(e.message)
    raise RedisException
  end

  def delete_session_info_for_uid(user_uid)
    user_sessions = nil
    @lock_manager.lock!(user_uid, 1000) do
      user_sessions = Rails.cache.read(user_uid, namespace: SESSION_NAMESPACE)
    end
    user_sessions&.each do |session_id|
      @lock_manager.lock!(session_id, 1000) do
        Rails.cache.delete(session_id, namespace: SESSION_NAMESPACE)
      end
    end
    @lock_manager.lock!(user_uid, 1000) do
      Rails.cache.delete(user_uid, namespace: SESSION_NAMESPACE)
    end
    true
  rescue Redlock::LockError, Redis::TimeoutError => e
    Rails.logger.error(e.message)
    false
  end

  def delete_user_session(session_id, session_info)
    @lock_manager.lock!(session_info[:uid], 1000) do
      user_sessions = Rails.cache.fetch(session_info[:uid], namespace: SESSION_NAMESPACE) { [] }
      user_sessions.delete(session_id)

      return Rails.cache.delete(session_info[:uid], namespace: SESSION_NAMESPACE) if user_sessions.count.zero?

      Rails.cache.write(session_info[:uid], user_sessions, namespace: SESSION_NAMESPACE)
    end
  end
end
