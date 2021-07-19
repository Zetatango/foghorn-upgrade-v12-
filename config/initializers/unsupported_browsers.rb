# frozen_string_literal: true

Browser = Struct.new(:browser, :version)

Rails.application.config.supported_browsers = JSON.parse(File.read('config/supported_browsers.json'))

supported_browsers_formatted = []

Rails.application.config.supported_browsers.each do |browser|
  supported_browsers_formatted.push(Browser.new(browser['name'], browser['major']))
end

Rails.application.config.supported_browsers_formatted = supported_browsers_formatted

Rails.application.config.good_browsers = JSON.parse(File.read('config/user_agents.json'))['good_browsers']
Rails.application.config.bad_browsers = JSON.parse(File.read('config/user_agents.json'))['bad_browsers']
