# frozen_string_literal: true

require 'test_helper'

class RoutesTest < ActionDispatch::IntegrationTest
  include ActiveSupport::Inflector

  ACTIONS_WHITELIST = %w[apipie_validations].freeze

  # Dumb routes to make the tests crap out: add this to config/routes.rb
  #   get 'utils/toto'
  #   get 'ootils/toto'
  #   get 'saml/sso', controller: 'utils', action: 'index'
  #   get 'bank_account/:id/transactions/:id'

  test 'all routes have valid controller names' do
    errors = []
    Rails.application.routes.routes.each do |route|
      controller = route.requirements[:controller]
      next unless controller.present?

      begin
        "#{controller.camelize}Controller".constantize
      rescue NameError
        errors << {
          path: route.path.spec.to_s,
          controller: route.requirements[:controller],
          action: route.requirements[:action]
        }
      end
    end

    assert errors.empty?, message: "Invalid controller for #{pluralize('route', errors.count)}: \n" +
                                   errors.map(&:inspect).join("\n")
  end

  test 'all routes have valid action names' do
    errors = []
    each_existing_controller do |route, klass|
      next if valid_action?(klass, route.requirements[:action])

      errors << {
        path: route.path.spec.to_s,
        controller: route.requirements[:controller],
        action: route.requirements[:action]
      }
    end

    assert errors.empty?, message: "Invalid action for #{pluralize('route', errors.count)}: \n" +
                                   errors.map(&:inspect).join("\n")
  end

  test 'all routes have unique parameter names' do
    errors = []
    Rails.application.routes.routes do |route|
      next if route.parts.group_by { |e| e }.select { |_k, v| v.size > 1 }.map(&:first).empty?

      errors << {
        path: route.path.spec.to_s
      }
    end
    assert errors.empty?, message: "There are #{pluralize('route', errors.count)} routes with shadow parameters: \n" +
                                   errors.map(&:inspect).join("\n")
  end

  test 'routes are not beind hidden by other routes' do
    pathspec_to_route = {}
    errors = []
    each_existing_controller do |route, _klass|
      verbs = route.verb.split('|')

      if pathspec_to_route.key?(route.path.spec.to_s)
        hidden_routes = pathspec_to_route[route.path.spec.to_s].select do |_, first_verbs|
          first_verbs.any? { |verb| verbs.include?(verb) }
        end

        if hidden_routes.present?
          hidden_routes.each do |first_route, first_verbs|
            next if first_route.requirements.except(:controller, :action) != route.requirements.except(:controller, :action)
            next if route.app.class != first_route.app.class
            next if route.app.is_a?(ActionDispatch::Routing::Mapper::Constraints) && route.app.constraints != first_route.app.constraints

            hidden_verbs = first_verbs.select { |verb| verbs.include?(verb) }

            errors << {
              visible: {
                method: hidden_verbs.join('|'),
                path: first_route.path.spec.to_s,
                requirements: first_route.requirements,
                controller: first_route.requirements[:controller],
                action: first_route.requirements[:action]
              },
              hidden: {
                method: hidden_verbs.join('|'),
                path: route.path.spec.to_s,
                requirements: route.requirements,
                controller: route.requirements[:controller],
                action: route.requirements[:action]
              }
            }
          end
        end
      end

      pathspec_to_route[route.path.spec.to_s] ||= []
      pathspec_to_route[route.path.spec.to_s] << [route, verbs]
    end
    assert errors.empty?, message: "There are #{errors.size} #{pluralize('route', errors.size)} that hide other routes" +
                                   errors.map(&:inspect).join("\n")
  end

  test 'all public actions for controllers that are not helper methods should be reachable through routes' do
    actions_by_controller = {}
    each_existing_action do |_, klass, action_name|
      actions_by_controller[klass] ||= []
      actions_by_controller[klass] << action_name
    end

    errors = []
    count = 0
    actions_by_controller.each_key do |klass|
      routable_actions = actions_by_controller[klass] || []
      non_routable_actions = klass.action_methods.to_a - routable_actions - klass._helper_methods.map(&:to_s) - ACTIONS_WHITELIST
      next if non_routable_actions.empty?

      errors << {
        controller: klass.to_s,
        actions: non_routable_actions
      }
      count += 1
    end
    assert errors.empty?, message: "There are #{count} controller #{pluralize('action', count)} that are public" +
                                   errors.map(&:inspect).join("\n")
  end

  test 'catchall catches frontend calls re-routes to merchants#show' do
    assert_routing '/dashboard/active_ubls', controller: 'merchants', action: 'show', path: 'dashboard/active_ubls'
  end

  test 'catchall does not catch calls to /api' do
    assert_raises ActionController::RoutingError do
      get '/api/v1/dashboard/active_ubls'
    end
  end

  test 'catchall does not catch calls to files' do
    assert_raises ActionController::RoutingError do
      get '/assets/main.123.js'
      get '/main.123.js'
      get '/500.html'
    end
  end

  private

  def each_existing_controller
    Rails.application.routes.routes.each do |route|
      controller = route.requirements[:controller]
      next unless controller.present?

      begin
        klass = "#{controller.camelize}Controller".constantize
        klass.instance_variable_set(:@action_methods, nil)
        yield route, klass
      rescue NameError => e
        raise unless e.message.include?("uninitialized constant #{controller.camelize}Controller")
      end
    end
  end

  def each_existing_action
    each_existing_controller do |route, klass|
      yield route, klass, route.requirements[:action] if valid_action?(klass, route.requirements[:action])
    end
  end

  def valid_action?(klass, wanted_action_name)
    return true if klass.action_methods.any? { |action_name| wanted_action_name == action_name }

    klass.new.template_exists?(wanted_action_name, klass._prefixes)
  end
end
