# frozen_string_literal: true

# rubocop:disable Metrics/ModuleLength
module ScimHelper
  extend ActiveSupport::Concern

  def scim_api_users_path(user_guid = nil)
    base = "#{Rails.configuration.roadrunner_url}api/scim/v2/Users"

    return base if user_guid.nil?

    "#{base}/#{user_guid}"
  end

  def api_users_path(user_guid, resource)
    "#{Rails.configuration.roadrunner_url}/api/users/#{user_guid}/#{resource}"
  end

  def scim_urn_user
    'urn:ietf:params:scim:schemas:core:2.0:User'
  end

  def scim_urn_ario_extension
    'urn:ietf:params:scim:schemas:extension:ario:2.0:User'
  end

  def scim_urn_list_response
    'urn:ietf:params:scim:api:messages:2.0:ListResponse'
  end

  def scim_users(users, start_index = 1, items_per_page = 10, total_results = -1)
    total_results = total_results.negative? ? users.count : total_results

    user_list = {
      schemas: [scim_urn_list_response],
      totalResults: total_results,
      startIndex: start_index,
      itemsPerPage: items_per_page,
      Resources: []
    }

    users.each do |user|
      user_list[:Resources] << scim_user(user)
    end

    user_list
  end

  def create_scim_user(parameters)
    user_guid = "u_#{SecureRandom.base58(16)}"
    scim_user = {
      schemas: [scim_urn_user, scim_urn_ario_extension],
      meta: {
        resourceType: 'User',
        created: Time.now.utc.iso8601,
        lastModified: Time.now.utc.iso8601,
        location: scim_api_users_path(user_guid),
        confirmed: Time.now.utc.iso8601,
        lastSignInIP: Faker::Internet.ip_v4_address
      },
      id: user_guid,
      userName: parameters[:email],
      active: true,
      emails: [
        {
          value: parameters[:email],
          primary: true
        }
      ],
      'urn:ietf:params:scim:schemas:extension:ario:2.0:User': {
        referrer: 'www.myproduct.com',
        caslPreference: {
          optIn: false,
          lastModified: Time.now.utc.iso8601
        },
        insightsPreference: if parameters.key?(:insights_preference_opt_in)
                              {
                                optIn: parameters[:insights_preference_opt_in],
                                lastModified: Time.now.utc.iso8601
                              }
                            end
      }
    }
    scim_user[:name] = {
      formatted: parameters[:name]
    }

    if parameters[:phone_number].present?
      scim_user[:phoneNumbers] = [
        {
          value: parameters[:phone_number]
        }
      ]
    end

    return scim_user unless parameters.key?(:profiles)

    scim_user[scim_ario_extension.to_sym][:profiles] = []
    parameters[:profiles].each { |profile| scim_user[scim_ario_extension.to_sym][:profiles] << profile }

    scim_user
  end

  def scim_user(user)
    scim_user = {
      schemas: [scim_urn_user, scim_urn_ario_extension],
      meta: {
        resourceType: 'User',
        created: user.created_at.to_datetime.iso8601,
        lastModified: user.created_at.to_datetime.iso8601,
        location: scim_api_users_path(user.uid),
        confirmed: Time.now.utc.iso8601,
        lastSignInIP: Faker::Internet.ip_v4_address
      },
      id: user.uid,
      userName: user.email,
      name: {
        formatted: user.name
      },
      emails: [
        {
          value: user.email,
          primary: true
        }
      ],
      active: user.enabled,
      'urn:ietf:params:scim:schemas:extension:ario:2.0:User': {
        profiles: [],
        referrer: 'www.myproduct.com',
        caslPreference: {
          optIn: false,
          lastModified: Time.now.utc.iso8601
        },
        insightsPreference: if user.insights_preference.nil?
                              nil
                            else
                              {
                                optIn: user.insights_preference,
                                lastModified: Time.now.utc.iso8601
                              }
                            end
      },
      preferredLanguage: 'en'
    }

    user.profiles.each do |profile|
      profile_info = { id: profile[:uid] }

      profile[:properties].each do |key, value|
        profile_info[key] = value
      end

      scim_user[scim_urn_ario_extension.to_sym][:profiles] << profile_info
    end

    scim_user
  end

  def stub_get_user
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_return(status: 200, body: scim_user(@user).to_json)
  end

  def stub_get_user_error(error = Security::IdPService::IdPException)
    stub_request(:get, scim_api_users_path(@user.uid))
      .to_raise(error)
  end

  def stub_update_user
    stub_request(:put, scim_api_users_path(@user.uid))
      .to_return(status: 200, body: scim_user(@user).to_json)
  end
end
# rubocop:enable Metrics/ModuleLength
