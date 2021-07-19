# frozen_string_literal: true

require 'test_helper'

class DocumentsCacheHelperTest < ActionDispatch::IntegrationTest
  setup do
    @docs_cache = {}
    @docs_cache['cra_tax_assessment'] = [{ file_id: 'file_s3_key' }]
    @docs_cache['gst_hst_doc'] = []
  end

  def sign_in_and_load_user
    stub_vanity_host
    stub_users(@partner)
    @service = SessionManagerService.instance
    @service.delete_all
    ProfileAccessTokenService.any_instance.stubs(:api_access_token).returns(@api_access_token)
    sign_in_user @merchant_admin
  end

  #
  # describes #read_file_keys
  #
  test 'returns empty json if collected_docs cache is empty' do
    sign_in_and_load_user
    assert_equal read_file_keys, {}
  end

  test 'returns json of collected documents' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    collected_docs = read_file_keys
    assert_equal collected_docs, JSON.parse(@docs_cache.to_json)
    assert_includes collected_docs, 'cra_tax_assessment'
    assert_includes collected_docs, 'gst_hst_doc'
    assert(collected_docs['cra_tax_assessment'].any? { |pair| pair.key?('file_id') })
    assert(collected_docs['cra_tax_assessment'].any? { |pair| pair.value?('file_s3_key') })
  end

  test 'read_file_keys collected_docs cache is scoped by user uid' do
    @load_user = build :user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    collected_docs_current_user = read_file_keys
    assert_equal collected_docs_current_user, JSON.parse(@docs_cache.to_json)

    @load_user = build :user
    collected_docs_other_user = read_file_keys
    assert_not_equal collected_docs_current_user, collected_docs_other_user
    assert_not_equal collected_docs_other_user, JSON.parse(@docs_cache.to_json)
  end

  test 'read_file_keys handles when no user session is present' do
    stubs(:current_user).returns(nil)

    collected_docs = read_file_keys
    assert_nil collected_docs
  end

  #
  # describes #store_file_key
  #
  test 'can store file_key - when document type does not exist' do
    sign_in_and_load_user
    file_id_pair = { angular_file_id_1: 's3_file_key_1' }
    docs_cache = { ppsa: [file_id_pair] }.to_json
    store_file_key(file_id_pair, 'ppsa')

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(docs_cache), collected_docs
    assert_includes collected_docs, 'ppsa'
    assert(collected_docs['ppsa'].any? { |pair| pair.key?('angular_file_id_1') })
    assert(collected_docs['ppsa'].any? { |pair| pair.value?('s3_file_key_1') })
  end

  test 'can store file_key - when document type already exists' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    file_id_pair = { file_id_1: 'file_key_1' }
    store_file_key(file_id_pair, 'gst_hst_doc')

    @docs_cache['gst_hst_doc'].push(file_id_pair)
    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(@docs_cache.to_json), collected_docs
    assert_includes collected_docs, 'gst_hst_doc'
    assert(collected_docs['gst_hst_doc'].any? { |pair| pair.key?('file_id_1') })
    assert(collected_docs['gst_hst_doc'].any? { |pair| pair.value?('file_key_1') })
  end

  test 'can store file_key - when document type exists and already contains other keys' do
    sign_in_and_load_user
    @docs_cache['gst_hst_doc'].push(file_id_1: 'file_key_1')
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    file_id_pair = { file_id_2: 'file_key_2' }
    store_file_key(file_id_pair, 'gst_hst_doc')

    @docs_cache['gst_hst_doc'].push(file_id_pair)
    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(@docs_cache.to_json), collected_docs
    assert_includes collected_docs, 'gst_hst_doc'
    assert_equal collected_docs['gst_hst_doc'].size, 2
    assert(collected_docs['gst_hst_doc'].any? { |pair| pair.key?('file_id_1') })
    assert(collected_docs['gst_hst_doc'].any? { |pair| pair.key?('file_id_2') })
  end

  test 'skip store file_key - when file_key is already added to its document type' do
    sign_in_and_load_user
    @docs_cache['gst_hst_doc'].push(file_id_1: 'file_key_1')
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    file_id_pair = { file_id_1: 'file_key_1' }
    store_file_key(file_id_pair, 'gst_hst_doc')

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(@docs_cache.to_json), collected_docs
    assert_includes collected_docs, 'gst_hst_doc'
    assert_equal collected_docs['gst_hst_doc'].size, 1
  end

  test 'store - file_key pair hash with rocket and colon notation are treated as the same' do
    sign_in_and_load_user
    # colon notation add keys as symbols
    file_id_pair_colon_notation = { angular_file_id_1: 's3_file_key_1' }
    docs_cache_colon_notation = { ppsa: [file_id_pair_colon_notation] }.to_json
    store_file_key(file_id_pair_colon_notation, 'ppsa')

    # rocket notation add keys as strings
    file_id_pair_rocket_notation = { 'angular_file_id_1' => 's3_file_key_1' }
    docs_cache_rocket_notation = { ppsa: [file_id_pair_rocket_notation] }.to_json
    store_file_key(file_id_pair_rocket_notation, :ppsa)

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(docs_cache_colon_notation), collected_docs
    assert_equal JSON.parse(docs_cache_rocket_notation), collected_docs
    assert_includes collected_docs, 'ppsa'
    assert_equal collected_docs['ppsa'].size, 1
  end

  test 'store_file_key collected_docs cache is scoped by user uid' do
    @load_user = build :user
    file_id_pair = { file_id_1: 'file_key_1' }
    docs_cache = { ppsa: [file_id_pair] }.to_json
    store_file_key(file_id_pair, 'ppsa')
    collected_docs_current_user = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))
    assert_equal JSON.parse(docs_cache), collected_docs_current_user

    @load_user = build :user
    other_file_id_pair = { other_file_id_1: 'other_file_key_1' }
    docs_cache = { other_ppsa: [other_file_id_pair] }.to_json
    store_file_key(other_file_id_pair, 'other_ppsa')
    collected_docs_other_user = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))
    assert_equal JSON.parse(docs_cache), collected_docs_other_user

    assert_not_equal collected_docs_current_user, collected_docs_other_user
  end

  test 'store_file_key handles when no user session is present' do
    stubs(:current_user).returns(nil)

    file_id_pair = { angular_file_id_1: 's3_file_key_1' }
    assert_nil store_file_key(file_id_pair, 'ppsa')
  end

  #
  # describes #remove_file_key
  #
  test 'can remove file_key' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    remove_file_key('file_id', 'cra_tax_assessment')

    file_id_pair = { file_id: 'file_s3_key' }
    @docs_cache['cra_tax_assessment'].delete(file_id_pair)
    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(@docs_cache.to_json), collected_docs
    assert_includes collected_docs, 'cra_tax_assessment'
    assert_equal collected_docs['cra_tax_assessment'].size, 0
  end

  test 'skip remove file_key - when document type does not exist' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    remove_file_key('file_id', 'ppsa')

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(@docs_cache.to_json), collected_docs
    assert_includes collected_docs, 'cra_tax_assessment'
    assert_equal collected_docs['cra_tax_assessment'].size, 1
    assert_includes collected_docs, 'gst_hst_doc'
  end

  test 'skip remove file_key - when document type exists but file_key is not there' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    remove_file_key('not_added_file_id', 'cra_tax_assessment')

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_equal JSON.parse(@docs_cache.to_json), collected_docs
    assert_includes collected_docs, 'cra_tax_assessment'
    assert_equal collected_docs['cra_tax_assessment'].size, 1
    assert_includes collected_docs, 'gst_hst_doc'
  end

  test 'remove_file_key works with string and symbol for file_key and document type' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    remove_file_key('file_id', 'cra_tax_assessment')

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_includes collected_docs, 'cra_tax_assessment'
    assert_equal collected_docs['cra_tax_assessment'].size, 0

    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    remove_file_key(:file_id, :cra_tax_assessment)

    collected_docs = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))

    assert_includes collected_docs, 'cra_tax_assessment'
    assert_equal collected_docs['cra_tax_assessment'].size, 0
  end

  test 'remove_file_key collected_docs cache is scoped by user uid' do
    # remove file_key from one merchant
    @load_user = build :user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    remove_file_key('file_id', 'cra_tax_assessment')
    collected_docs_current_user = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))
    assert_empty collected_docs_current_user['cra_tax_assessment']

    # other merchant should still have that file_key
    @load_user = build :user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    collected_docs_other_user = JSON.parse(Rails.cache.read('collected_docs', namespace: cache_namespace))
    assert_not_empty collected_docs_other_user['cra_tax_assessment']

    assert_not_equal collected_docs_current_user, collected_docs_other_user
  end

  test 'remove_file_key handles when no user session is present' do
    stubs(:current_user).returns(nil)

    assert_nil remove_file_key('file_id', 'cra_tax_assessment')
  end

  #
  # describes #file_key_exists?
  #
  test 'returns true if present' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)

    assert file_key_exists?('file_id', 'cra_tax_assessment')
  end

  test 'returns false if not present' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)

    refute file_key_exists?('file_id_100', 'cra_tax_assessment')
  end

  test 'file_key_exists? works with string and symbol for file_key and document type' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)

    assert file_key_exists?('file_id', 'cra_tax_assessment')
    assert file_key_exists?(:file_id, 'cra_tax_assessment')
    assert file_key_exists?('file_id', :cra_tax_assessment)
    assert file_key_exists?(:file_id, :cra_tax_assessment)
  end

  test 'file_key_exists? handles when no user session is present' do
    stubs(:current_user).returns(nil)

    assert_nil file_key_exists?('file_id', 'cra_tax_assessment')
  end

  #
  # describes #clear_docs_cache
  #
  test 'do nothing if collected_docs cache is empty' do
    sign_in_and_load_user
    assert_nothing_raised { clear_docs_cache }
  end

  test 'clears cache' do
    sign_in_and_load_user
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    clear_docs_cache

    collected_docs = Rails.cache.read('collected_docs', namespace: cache_namespace)

    assert_nil collected_docs
  end

  test 'clear_docs_cache collected_docs cache is scoped by user uid' do
    # with first merchant, write and don't clear
    first_merchant = build :user
    @load_user = first_merchant
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)

    # with second merchant, write and clear
    second_merchant = build :user
    @load_user = second_merchant
    Rails.cache.write('collected_docs', @docs_cache.to_json, namespace: cache_namespace)
    clear_docs_cache

    # first merchant should still contain data in cache
    @load_user = first_merchant
    collected_docs_current_user = read_file_keys
    assert_equal collected_docs_current_user, JSON.parse(@docs_cache.to_json)

    # second merchant cache should be empty
    @load_user = second_merchant
    collected_docs_other_user = read_file_keys
    assert_empty collected_docs_other_user
  end

  test 'clear_docs_cache handles when no user session is present' do
    stubs(:current_user).returns(nil)

    assert_nil clear_docs_cache
  end
  #
  # describes integration test
  #
  test 'can store key, then read it and finally delete it' do
    sign_in_and_load_user
    file_id_pair = { file_id_1: 'file_s3_key_1' }
    store_file_key(file_id_pair, 'ppsa')
    collected_docs = read_file_keys
    assert_includes collected_docs, 'ppsa'
    assert(collected_docs['ppsa'].any? { |pair| pair.key?('file_id_1') })
    assert(collected_docs['ppsa'].any? { |pair| pair.value?('file_s3_key_1') })

    remove_file_key('file_id_1', 'ppsa')
    collected_docs = read_file_keys
    assert_includes collected_docs, 'ppsa'
    refute(collected_docs['ppsa'].any? { |pair| pair.key?('file_id_1') })
    refute(collected_docs['ppsa'].any? { |pair| pair.value?('file_s3_key_1') })
  end

  test 'can store key, then read it and finally clean all' do
    sign_in_and_load_user
    file_id_pair = { file_id_1: 'file_s3_key_1' }
    store_file_key(file_id_pair, 'ppsa')
    collected_docs = read_file_keys
    assert_includes collected_docs, 'ppsa'
    assert(collected_docs['ppsa'].any? { |pair| pair.key?('file_id_1') })
    assert(collected_docs['ppsa'].any? { |pair| pair.value?('file_s3_key_1') })

    clear_docs_cache
    collected_docs = read_file_keys
    assert_empty collected_docs
  end
end
