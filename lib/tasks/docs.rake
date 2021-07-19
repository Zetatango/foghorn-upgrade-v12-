# frozen_string_literal: true

namespace :docs do
  desc 'Generate internal documentation'
  task generate: %i[clean copy markdown aasm] do
    puts 'Docs generated'
  end

  task clean: :environment do
    FileUtils.rmtree(docs_folder)
  end

  task copy: :environment do
    convert('html', proc { |input| input })
  end

  task markdown: :environment do
    require 'markup_renderer'

    markdown = MarkupRenderer.new

    convert('md', proc { |input| markdown.to_html(input) })
  end

  task aasm: :environment do
    require 'aasm-diagram'

    output_type = 'jpg'

    ObjectSpace.each_object(Class).select { |c| c.included_modules.include?(AASM) && c.try(:descends_from_active_record?) }.each do |model|
      output_dir = "#{docs_folder}/architecture/state_machines/#{model.name.deconstantize.underscore}"
      FileUtils.mkdir_p(output_dir)
      AASMDiagram::Diagram.new(model.new.aasm, "#{output_dir}/#{model.name.demodulize.underscore}.#{output_type}")
    end
  end

  private

  def docs_folder
    Rails.application.config.output_dir.join('doc')
  end

  def convert(input_extension, convert_proc, extension: 'html')
    parent_dir = Rails.root.join('doc')
    input_path = parent_dir.join('**', "*.#{input_extension}")

    Dir.glob(input_path).each do |input_file|
      output = convert_proc.call(File.new(input_file).read)
      output_filename = File.basename(input_file, ".#{input_extension}")

      # rubocop:disable Style/SlicingWithRange
      relative_output_path = File.dirname(input_file)[parent_dir.to_s.length..-1]
      # rubocop:enable Style/SlicingWithRange
      absolute_output_path = docs_folder.join(*relative_output_path.split(File::SEPARATOR))
      FileUtils.mkdir_p(absolute_output_path)
      File.write(absolute_output_path.join("#{output_filename}.#{extension}"), output)
    end
  end
end
