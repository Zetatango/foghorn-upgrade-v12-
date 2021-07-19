# frozen_string_literal: true

module LocaleToggleHelper
  USER_DATA_TO_EXCLUDE = %w[password].freeze

  def render_locale_toggle(link_class = 'btn btn-link border-0 font-weight-bold text-dark text-uppercase pr-md-5')
    locale_toggle = case I18n.locale
                    when :en
                      [:fr, 'FR']
                    when :fr
                      [:en, 'EN']
                    end
    # authenticity_token is automatically added to forms.
    params_to_exclude = %i[action controller locale utf8 authenticity_token]
    filtered_params = request.params.except(*params_to_exclude).deep_dup
    filtered_params[:user]&.delete_if { |key, _value| USER_DATA_TO_EXCLUDE.include? key }
    button_to locale_toggle[1],
              { locale: locale_toggle[0] },
              params: filtered_params,
              method: request.method.downcase.to_sym,
              form: { class: 'd-inline' },
              class: link_class.to_s,
              id: 'lang-toggle'
  end
end
