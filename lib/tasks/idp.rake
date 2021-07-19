# frozen_string_literal: true

# :nocov:
namespace :idp do
  desc 'Flushes all cached IdP configurations and refreshes their values'
  task flush_cache: :environment do
    redis = Redis.new

    cached_idp_info = redis.keys("#{IdPService::CACHE_NAMESPACE}:ip_*")

    idp_guids = []
    cached_idp_info.each do |redis_key|
      matcher = redis_key.match(/\A#{IdPService::CACHE_NAMESPACE}:(ip_.*)?\z/o)

      idp_guids << matcher[1]
    end

    # Flush all the cached idp info
    redis.del(*cached_idp_info)

    idp_guids.each do |idp_guid|
      # Refresh cached values
      info = IdPService.new.identity_provider_lookup(idp_guid)

      Rails.logger.info("#{idp_guid}: #{info[:vanity_url]}")
    rescue IdPService::IdPServiceException => e
      Rails.logger.error("Failed to lookup #{idp_guid}: #{e.message}")
    end
  end
end
# :nocov:
