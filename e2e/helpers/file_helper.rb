# frozen_string_literal: true

module FileHelper
  FILE_HELPER_LOCAL_DIRECTORY = 'file_helper'

  def temp_file_path(extension = nil)
    ensure_tmp_directory_exists

    file = extension.nil? ? SecureRandom.uuid : "#{SecureRandom.uuid}#{extension}"

    Pathname.new(File.join(Dir.tmpdir, FILE_HELPER_LOCAL_DIRECTORY, file))
  end

  def ensure_tmp_directory_exists
    path = Pathname.new(File.join(Dir.tmpdir, FILE_HELPER_LOCAL_DIRECTORY))

    FileUtils.mkdir_p(path) unless File.directory?(path)
  end
end
