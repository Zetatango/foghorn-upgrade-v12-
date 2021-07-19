# frozen_string_literal: true

require 'rake/testtask'

Rake::TestTask.new('e2e') do |t|
  t.libs << 'e2e'
  t.pattern = 'e2e/*_test.rb'
  t.warning = false
  t.verbose = false
  t.options = '--backtrace'
end
