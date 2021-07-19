# frozen_string_literal: true

module ThemeHelper
  def check_theming_portal(pages)
    page.find 'meta[content="SkinFX Inc."]', visible: false
    print "\u{2714} ", pages
    puts ''
  end

  def check_theming_idp(pages)
    page.find 'meta[content="SkinFX Inc."]', visible: false
    print "\u{2714} ", pages
    puts ''
  end
end
