# frozen_string_literal: true

module EnvHelper
  def heroku?
    Rails.configuration.e2e_env == 'heroku'
  end
end
