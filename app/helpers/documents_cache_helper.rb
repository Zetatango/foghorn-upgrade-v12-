# frozen_string_literal: true

module DocumentsCacheHelper
  class NoSessionError < StandardError; end

  protected

  #
  # Cache Hash Structure (`collected_docs` is the cache key)
  #
  # h = {
  #   doc_type_1: [
  #     'angular_file_id_11': 's3_file_key_11x',
  #     'angular_file_id_12': 's3_file_key_12x',
  #     ...
  #   ],
  #   doc_type_2: [
  #     'angular_file_id_21': 's3_file_key_21x',
  #     ...
  #   ],
  #   ...
  # }
  #

  def store_file_key(file_key_pair, doc_type)
    raise NoSessionError.new(message: 'No user session found. Please sign in.') if current_user.blank?

    doc_type = doc_type.to_sym
    file_key_pair = file_key_pair.deep_symbolize_keys
    collected_docs = read_file_keys.deep_symbolize_keys

    collected_docs[doc_type] = [] unless collected_docs.include?(doc_type)
    collected_docs[doc_type].push(file_key_pair) unless collected_docs[doc_type].include?(file_key_pair)

    Rails.cache.write('collected_docs',
                      collected_docs.to_json,
                      expires_in: Rails.configuration.cache_timeout.minutes,
                      namespace: cache_namespace)
  rescue NoSessionError => e
    Rails.logger.error("Unable to access 'collected_docs' cache. Error: #{e}")
    # TODO: Bugsnag.notify(e)
    nil
  end

  def read_file_keys
    raise NoSessionError.new(message: 'No user session found. Please sign in.') if current_user.blank?

    # raise NoSessionError.new(message: 'No user session found. Please sign in.') unless user_signed_in?

    collected_docs = Rails.cache.read('collected_docs', namespace: cache_namespace)
    return {} if collected_docs.blank?

    JSON.parse(collected_docs)
  rescue NoSessionError => e
    Rails.logger.error("Unable to access 'collected_docs' cache. Error: #{e}")
    # TODO: Bugsnag.notify(e)
    nil
  end

  def remove_file_key(file_key, doc_type)
    raise NoSessionError.new(message: 'No user session found. Please sign in.') if current_user.blank?

    doc_type = doc_type.to_sym
    file_key = file_key.to_sym
    collected_docs = read_file_keys.deep_symbolize_keys

    return unless collected_docs.include?(doc_type)
    return unless collected_docs[doc_type].any? { |pair| pair.key?(file_key) }

    collected_docs[doc_type].delete_if { |pair| pair.key?(file_key) }

    Rails.cache.write('collected_docs',
                      collected_docs.to_json,
                      expires_in: Rails.configuration.cache_timeout.minutes,
                      namespace: cache_namespace)
  rescue NoSessionError => e
    Rails.logger.error("Unable to access 'collected_docs' cache. Error: #{e}")
    # TODO: Bugsnag.notify(e)
    nil
  end

  def file_key_exists?(file_key, doc_type)
    raise NoSessionError.new(message: 'No user session found. Please sign in.') if current_user.blank?

    doc_type = doc_type.to_sym
    file_key = file_key.to_sym
    collected_docs = read_file_keys.deep_symbolize_keys

    collected_docs[doc_type].present? &&
      collected_docs[doc_type].any? { |pair| pair.key?(file_key) }
  rescue NoSessionError => e
    Rails.logger.error("Unable to access 'collected_docs' cache. Error: #{e}")
    # TODO: Bugsnag.notify(e)
    nil
  end

  def clear_docs_cache
    raise NoSessionError.new(message: 'No user session found. Please sign in.') if current_user.blank?

    Rails.cache.delete('collected_docs', namespace: cache_namespace)
  rescue NoSessionError => e
    Rails.logger.error("Unable to access 'collected_docs' cache. Error: #{e}")
    # TODO: Bugsnag.notify(e)
    nil
  end

  def cache_namespace
    "docs_cache-#{current_user.uid}"
  end
end
