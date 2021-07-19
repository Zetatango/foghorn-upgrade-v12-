# frozen_string_literal: true

# :nocov:
class String
  def sanitize(options = {})
    ActionController::Base.helpers.sanitize(self, options)
  end

  # colorization
  def colorize(color_code)
    "\e[#{color_code}m#{self}\e[0m"
  end

  # font colors
  def default
    colorize(39)
  end

  def black
    colorize(30)
  end

  def red
    colorize(31)
  end

  def light_red
    colorize(91)
  end

  def green
    colorize(32)
  end

  def yellow
    colorize(33)
  end

  def blue
    colorize(34)
  end

  def pink
    colorize(95)
  end

  def cyan
    colorize(36)
  end

  def grey
    colorize(37)
  end

  def white
    colorize(97)
  end

  # background font colors
  def bg_black
    colorize(40)
  end

  def bg_red
    colorize(41)
  end

  def bg_green
    colorize(42)
  end

  def bg_yellow
    colorize(43)
  end

  def bg_blue
    colorize(44)
  end

  def bg_pink
    colorize(105)
  end

  def bg_cyan
    colorize(46)
  end

  def bg_grey
    colorize(47)
  end

  def bg_white
    colorize(107)
  end

  # text formatting
  def bold
    "\e[1m#{self}\e[22m"
  end

  def italic
    "\e[3m#{self}\e[23m"
  end

  def underline
    "\e[4m#{self}\e[24m"
  end

  def blink
    "\e[5m#{self}\e[25m"
  end

  def reverse_color
    "\e[7m#{self}\e[27m"
  end

  def reset
    colorize(0)
  end
end
# :nocov:
