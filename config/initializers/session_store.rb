# frozen_string_literal: true

# :nocov:
unless Rails.env.test?
  Foghorn::Application.config.session_store :cache_store,
                                            servers: [Rails.application.secrets.redis_url],
                                            key: "_#{Rails.application.class.module_parent_name.downcase}_session",
                                            expire_after: Rails.configuration.session_timeout
end
# :nocov:
