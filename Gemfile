# frozen_string_literal: true

source 'https://rubygems.org'

ruby '2.7.2'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?('/')
  "https://github.com/#{repo_name}.git"
end

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails'
# Use Puma as the app server
gem 'bugsnag'
gem 'puma'

# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# Use SCSS for stylesheets
gem 'sassc-rails'

# See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby

# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails'

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder'
# Use ActiveModel has_secure_password
# gem 'bcrypt', '~> 3.1.7'

gem 'font-awesome-sass'

gem 'redis'
gem 'redis-actionpack'
gem 'redlock'

# Use Capistrano for deployment
# gem 'capistrano-rails', group: :development

gem 'pg'
gem 'porky_lib'
gem 'shopify-money', github: 'Shopify/money'

gem 'swagger_client', github: 'Zetatango/ztt_client'

gem 'rest-client'

gem 'graphql-client'

gem 'email_validator'

gem 'jose'
gem 'jwt'

gem 'omniauth', '~> 1.9'
gem 'omniauth-facebook', github: 'Zetatango/omniauth-facebook', branch: 'feat_state_proc'
gem 'omniauth-oauth2', github: 'Zetatango/omniauth-oauth2', branch: 'feat_state_proc'
gem 'omniauth_openid_connect', github: 'Zetatango/omniauth_openid_connect'

gem 'cancancan'

# Pinning this gem to avoid CVE-2018-8048 issue
gem 'loofah'

# Pinning this gem to avoid CVE-2018-3741 issue
gem 'rails-html-sanitizer'

gem 'token_validator', github: 'Zetatango/token_validator'

# Pinning this gem to avoid CVE-2019-16892
gem 'rubyzip', '>= 1.3.0'

gem 'maxminddb'

gem 'barnes'

gem 'hopper', github: 'Zetatango/hopper'
gem 'mimemagic'

group :development, :test, :e2e do
  gem 'awesome_print'
  gem 'binding_of_caller'
  gem 'capybara-screenshot'
  gem 'factory_bot_rails'
  gem 'listen', '>= 3.0.5', '<= 3.5.1'
  gem 'mocha', require: false
  gem 'timecop', '0.9.4'
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: %i[mri mingw x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  gem 'brakeman'
  gem 'bundler-audit'
  gem 'capybara'
  gem 'codacy-coverage'
  gem 'rails-controller-testing'
  gem 'selenium-webdriver'
  gem 'webmock'
end

group :development do
  gem 'better_errors'
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'web-console', '>= 3.3.0'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'redcarpet'
  gem 'rubocop'
  gem 'rubocop-performance'
  gem 'rubocop_runner', require: false
  gem 'spring'
  gem 'spring-watcher-listen'
end

group :test, :e2e do
  gem 'codecov', require: false
  gem 'faker', github: 'Zetatango/faker'
  gem 'minitest'
  gem 'minitest-ci', require: false
  gem 'minitest-hooks'
  gem 'minitest-reporters'
  gem 'minitest-stub-const'
  gem 'simplecov', require: false
  gem 'test-unit'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: %i[mingw mswin x64_mingw jruby]

gem 'jquery-rails'

gem 'rack-attack'
gem 'rack-test', require: 'rack/test'

gem 'useragent'
