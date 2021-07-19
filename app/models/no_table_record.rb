# frozen_string_literal: true

class NoTableRecord
  include ActiveModel::Model

  def self.attr_accessor(*vars)
    @attributes ||= []
    @attributes.concat vars
    super
  end

  class << self
    attr_reader :attributes
  end

  def attributes
    self.class.attributes
  end
end
