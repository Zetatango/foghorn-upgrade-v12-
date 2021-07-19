# frozen_string_literal: true

module ThemeSetup
  extend ActiveSupport::Concern

  included do
    helper_method %i[initialize_theming render_theme_styles partner_theme_name]
  end

  DEFAULT_THEME_NAME = 'Ario Default Theme'
  PARTNER_THEME_NOT_PRESENT_TEXT = '/*! configured theme not present */'
  THEME_COMPILATION_ERROR_TEXT = '/*! theme compilation error */'

  class InvalidLayoutException < StandardError; end

  protected

  def initialize_theming
    partner_theme_name
  end

  # Display the theme name / default Ario theme to the views.
  def partner_theme_name
    @partner_theme_name ||= valid_partner_theme_config? ? current_partner.theme_name : DEFAULT_THEME_NAME
  end

  # Gather up theming assets, and construct the final stylesheet.
  def render_theme_styles
    # 1. read the base stylesheet.
    begin
      layout = valid_layout?
    rescue InvalidLayoutException => e
      Bugsnag.notify(InvalidLayoutException, "Unable to process layout: #{e.message}")
      return
    end

    scss = File.read(layout_styles_path(layout))

    # 2. write variables to scss.
    begin
      scss.gsub!('// require theme_variables', load_scss_variables)
      scss.gsub!('// require ng_component_imports', ng_component_styles) if layout == 'application'
    rescue SocketError, OpenURI::HTTPError, OpenSSL::OpenSSLError, NoMethodError => e
      Rails.logger.error("Unable to open variables file: #{e.message}")

      Bugsnag.notify(e)
    end

    # 3. generate the css from the scss.
    begin
      generate_css(scss) if Rails.configuration.render_css.present?
    rescue SassC::SyntaxError => e
      Rails.logger.error("Unable to render css: #{e.message}")

      Bugsnag.notify(e)

      THEME_COMPILATION_ERROR_TEXT
    end
  end

  private

  def valid_partner_theme_config?
    current_partner.present? && current_partner.theme_css_url.present?
  end

  def layout_styles_path(layout)
    Rails.root.join('app', 'assets', 'stylesheets', layout, 'styles.scss')
  end

  def valid_layout?
    raise InvalidLayoutException, 'layout not set' unless self.class.send(:_layout).present?
    raise InvalidLayoutException, 'layout file set, but not present' unless File.file?(layout_styles_path(_layout('', '')))

    _layout('', '')
  end

  # Reads the scss variables if the partner_theme and css_url is present.
  def load_scss_variables
    return PARTNER_THEME_NOT_PRESENT_TEXT unless valid_partner_theme_config?

    css_url = current_partner.theme_css_url
    URI.parse(css_url).open.read
  end

  # Recursively goes through the ng components directories and adds their css to the stylesheet.
  def ng_component_styles
    ng_component_paths = Dir[Rails.root.join('ui-app', 'src', 'app', 'components', '**', '*.component.scss')]
    (ng_component_paths << Dir[Rails.root.join('ui-app', 'src', 'app', 'insights', '**', '*.component.scss')]).flatten!
    (ng_component_paths << Dir[Rails.root.join('ui-app', 'src', 'app', 'business-partner', '**', '*.component.scss')]).flatten!
    (ng_component_paths << Dir[Rails.root.join('ui-app', 'src', 'app', 'marketing', '**', '*.component.scss')]).flatten!
    (ng_component_paths << Dir[Rails.root.join('ui-app', 'src', 'app', 'documents', '**', '*.component.scss')]).flatten!
    (ng_component_paths << Dir[Rails.root.join('ui-app', 'src', 'app', 'partner-onboarding', '**', '*.component.scss')]).flatten!
    (ng_component_paths << Dir[Rails.root.join('ui-app', 'src', 'app', 'offer', '**', '*.component.scss')]).flatten!
    ng_component_paths.map! { |path| "'#{path}'" }

    "@import #{ng_component_paths.join(', ')};"
  end

  # Generate the css from supplied scss.
  def generate_css(scss)
    css = SassC::Engine.new(
      scss,
      syntax: :scss,
      cache: Rails.configuration.sassc.cache,
      read_cache: Rails.configuration.sassc.read_cache,
      style: Rails.configuration.sassc.style,
      load_paths: Rails.configuration.assets.paths,
      sprockets: {
        context: view_context,
        environment: Rails.configuration.assets
      }
    )

    # Rails escapes > in css selectors rendered in the head of the view. This subs them back in.
    css.render.sanitize.gsub(/&gt;/, '>').html_safe
  end
end
