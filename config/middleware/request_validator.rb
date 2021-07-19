# frozen_string_literal: true

class RequestValidator
  class BadRequestError < StandardError
    def response
      headers = { 'Content-Type' => 'text/plain' }
      response = Rack::Response.new([message], 400, headers)
      response.finish
    end
  end

  class NotFoundError < StandardError
    def response
      headers = { 'Content-Type' => 'text/plain' }
      response = Rack::Response.new([message], 404, headers)
      response.finish
    end
  end

  def initialize(app)
    @app = app
  end

  class QueryValidator
    ENV_VAR_NAME = 'QUERY_STRING'

    class << self
      def call(env)
        parameters = Rack::Utils.parse_nested_query(env[ENV_VAR_NAME].to_s)
        ActionDispatch::Request::Utils.check_param_encoding(parameters)
        parameters.each { |_key, value| validate_null_byte(value) }
      rescue Rack::Utils::InvalidParameterError => e
        message = "Request validator encountered invalid query parameters: #{e.message}"
        Rails.logger.error(message)
        raise NotFoundError, message
      end

      def validate_null_byte(value)
        null_byte = "\0"
        return unless value.present? && value.include?(null_byte)

        message = "Request validator encountered an invalid parameter: #{value} contains null byte"
        Rails.logger.error(message)
        raise NotFoundError, message
      end
    end
  end

  class PathValidator
    ENV_VAR_NAME = 'PATH_INFO'

    class << self
      def call(env)
        path_info = env[ENV_VAR_NAME].to_s
        validate_parameter_encoding(path_info)
        validate_null_byte(path_info)
      end

      def validate_parameter_encoding(path_info)
        route_parameters =
          begin
            # This can throw an ActionController::RoutingError if:
            #   - the path does not represent a valid route
            #   - there is no controller defined for this route
            #
            Rails.application.routes.recognize_path(path_info)
          rescue ActionController::RoutingError
            # The path is invalid.
            # If the path has a valid encoding, the request will return a 404 further down the stack.
            # If the path has an invalid encoding, it will raise an unhandled InvalidParameterError and result in a 500.
            # We can take this opportunity to instead return a 400 to indicate a bad encoding.
            #
            path_info = ActionDispatch::Journey::Router::Utils.unescape_uri(path_info)
            path_info.force_encoding(::Encoding::UTF_8)
            ActionDispatch::Request::Utils.check_param_encoding(path_info)

            # An invalid route has no parameters
            nil
          end

        return unless route_parameters.present?
        return unless route_parameters[:format].present?

        controller_name = route_parameters[:controller]
        action = route_parameters[:action]
        format = route_parameters[:format]

        # The validity of a path's given encoding is determined by the definition of the corresponding controller
        # action. While a binary encoding may be valid for some actions, it may not be valid for others.
        #
        controller = controller_class_for controller_name
        if controller.action_encoding_template action
          format.force_encoding(::Encoding::ASCII_8BIT)
        else
          format = ActionDispatch::Journey::Router::Utils.unescape_uri(format)
          format.force_encoding(::Encoding::UTF_8)
        end

        ActionDispatch::Request::Utils.check_param_encoding(format)
      rescue Rack::Utils::InvalidParameterError => e
        message = "Request validator encountered an invalid path: #{e.message}"
        Rails.logger.error(message)
        raise NotFoundError, message
      end

      def validate_null_byte(path_info)
        null_byte = "\0"
        unescaped_path_info = ActionDispatch::Journey::Router::Utils.unescape_uri(path_info)
        return unless unescaped_path_info.include? null_byte

        message = "Request validator encountered an invalid path: #{path_info} contains null byte"
        Rails.logger.error(message)
        raise NotFoundError, message
      end

      def controller_class_for(name)
        controller_param = name.underscore
        const_name = "#{controller_param.camelize}Controller"
        ActiveSupport::Dependencies.constantize(const_name)
      end
    end
  end

  class HeaderValidator
    ACCEPT_ENV_VAR_NAME = 'HTTP_ACCEPT'
    CONTENT_TYPE_ENV_VAR_NAME = 'CONTENT_TYPE'

    class << self
      def call(env)
        http_accept = env[ACCEPT_ENV_VAR_NAME]
        return if http_accept.nil?

        Mime::Type.parse(http_accept)

        content_type = env[CONTENT_TYPE_ENV_VAR_NAME]
        return if content_type.nil?

        Mime::Type.parse(content_type.split(';').first)
      rescue Mime::Type::InvalidMimeType => e
        message = "Request validator encountered invalid accept header or content type mime type: #{e.message}"
        Rails.logger.error(message)
        raise NotFoundError, message
      end
    end
  end

  def call(env)
    QueryValidator.call(env)
    PathValidator.call(env)
    HeaderValidator.call(env)
    @app.call(env)
  rescue BadRequestError, NotFoundError => e
    e.response
  rescue ActionDispatch::Http::Parameters::ParseError, JSON::ParserError => e
    message = "Error occurred while parsing parameters: #{e.message}"
    Rails.logger.error(message)
    headers = { 'Content-Type' => 'text/plain' }
    response = Rack::Response.new([message], 404, headers)
    response.finish
  rescue ActionController::BadRequest => e
    message = "Bad request error: #{e.message}"
    Rails.logger.error(message)
    headers = { 'Content-Type' => 'text/plain' }
    response = Rack::Response.new([message], 400, headers)
    response.finish
  end
end
