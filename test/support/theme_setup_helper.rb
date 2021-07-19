# frozen_string_literal: true

module ThemeSetupHelper
  extend ActiveSupport::Concern

  def stub_load_scss_variables(theme_variables = {})
    tempfile = URI::HTTP.build(scheme: 'https') # scheme: isn't actually used.

    URI::HTTP.any_instance.stubs(:open).returns(tempfile)
    URI::HTTP.any_instance.stubs(:read).returns(generate_theme_scss(theme_variables))
  end

  def stub_config_render_css
    Rails.configuration.stubs(:render_css).returns(true)
  end

  private

  def generate_theme_scss(theme_variables)
    "$primary: #{theme_variables[:primary_colour] || '#0a4752'};\n
    $theme-colors: ( 'accent': #{theme_variables[:secondary_colour] || '#429f94'} );\n
    $partner-logo-url: '#{theme_variables[:logo_url] || 'https://s3.ca-central-1.amazonaws.com/theme_directory/logo.png'}';\n
    $partner-logo-height: #{theme_variables[:logo_height] || 48}px;\n
    $font-family-base: '#{theme_variables[:font] || 'Nunito'}', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;\n"
  end
end
