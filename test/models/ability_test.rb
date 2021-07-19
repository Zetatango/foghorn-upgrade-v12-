# frozen_string_literal: true

require 'test_helper'

class AbilityTest < ActiveSupport::TestCase
  setup do
    stub_users(build(:partner))

    @skip_controllers = %w[CspReport Util Jwt]

    @user_classes = []
    @user_classes << {
      label: 'Not signed in, no delegated access',
      user: nil,
      signed_in: false,
      delegated_access: false,
      controller_authorizations: {
        'Merchant' => %w[new create],
        'Api::V1::Agreement' => [], # Class has no access
        'Api::V1::Applicant' => [], # Class has no access
        'Api::V1::BankAccount' => [], # Class has no access
        'Api::V1::BorrowerInvoice' => [], # Class has no access
        'Api::V1::Merchant' => %w[new],
        'Api::V1::Lead' => [], # Class has no access
        'Api::V1::Guarantor' => [], # Class has no access
        'Api::V1::LendingOffer' => [], # Class has no access
        'Api::V1::LendingApplication' => [], # Class has no access
        'Api::V1::LendingUbl' => [], # Class has no access
        'Api::V1::LendingRepayment' => [], # Class has no access
        'Api::V1::DirectPayment' => [], # Class has no access
        'Api::V1::UserSession' => [], # Class has no access
        'Api::V1::Support' => [], # Class has no access
        'Api::V1::Supplier' => [], # Class has no access
        'Api::V1::FileStorage' => [], # Class has no access
        'Api::V1::Configuration' => [], # Class has no access
        'Api::V1::Log' => [], # Class has no access
        'Api::V1::BusinessPartner' => [], # Class has no access
        'Api::V1::BusinessPartnerMerchant' => [], # Class has no access
        'Api::V1::TrackedObject' => [], # Class has no access
        'Api::V1::Transaction' => [], # Class has no access
        'Api::V1::SocialConnection' => [], # Class has no access
        'Api::V1::MarketingCampaign' => [], # Class has no access
        'Api::V1::Pdf' => [], # Class has no access
        'Api::V1::DataWarehouse' => [], # Class has no access
        'Api::V1::Speedy' => [], # Class has no access
        'OnBoarding' => [], # Class has no access
        'UserSession' => %w[create show_accounts choose_account backchannel_logout auto_choose_account],
        'Help' => [], # Class has no access
        'TrackedObject' => %w[show],
        'Quickbook' => %w[start callback failure],
        'Facebook' => %w[start callback failure],
        'FlowResult' => %w[show],
        'Api::V1::Crypto' => []
      }
    }

    @user_classes << {
      label: 'User with no profiles is signed in',
      user: @no_profile_user,
      signed_in: true,
      delegated_access: false,
      controller_authorizations: {
        'Merchant' => [], # Class has no access
        'Api::V1::Agreement' => [], # Class has no access
        'Api::V1::Applicant' => [], # Class has no access
        'Api::V1::BankAccount' => [], # Class has no access
        'Api::V1::BorrowerInvoice' => [], # Class has no access
        'Api::V1::Merchant' => [], # Class has no access
        'Api::V1::Lead' => [], # Class has no access
        'Api::V1::Guarantor' => [], # Class has no access
        'Api::V1::LendingOffer' => [], # Class has no access
        'Api::V1::LendingApplication' => [], # Class has no access
        'Api::V1::LendingUbl' => [], # Class has no access
        'Api::V1::LendingRepayment' => [], # Class has no access
        'Api::V1::DirectPayment' => [], # Class has no access
        'Api::V1::UserSession' => [], # Class has no access
        'Api::V1::Support' => [], # Class has no access
        'Api::V1::Supplier' => [], # Class has no access
        'Api::V1::FileStorage' => [], # Class has no access
        'Api::V1::Configuration' => [], # Class has no access
        'Api::V1::Log' => [], # Class has no access
        'Api::V1::BusinessPartner' => [], # Class has no access
        'Api::V1::BusinessPartnerMerchant' => [], # Class has no access
        'Api::V1::TrackedObject' => [], # Class has no access
        'Api::V1::Transaction' => [], # Class has no access
        'Api::V1::SocialConnection' => [], # Class has no access
        'Api::V1::MarketingCampaign' => [], # Class has no access
        'Api::V1::Pdf' => [], # Class has no access
        'Api::V1::DataWarehouse' => [], # Class has no access
        'Api::V1::Speedy' => [], # Class has no access
        'OnBoarding' => [], # Class has no access
        'UserSession' => %w[destroy auto_choose_account],
        'Help' => [], # Class has no access
        'TrackedObject' => %w[show],
        'Quickbook' => %w[start callback failure],
        'Facebook' => %w[start callback failure],
        'FlowResult' => %w[show],
        'Api::V1::Crypto' => []
      }
    }

    @user_classes << {
      label: 'User with merchant_new role is signed in',
      user: @merchant_new,
      signed_in: true,
      delegated_access: false,
      controller_authorizations: {
        # TODO: The next line should be removed when the core KYC-verified changes are pushed and properly handled by foghorn
        'Merchant' => %w[new show partner partner_onboarding quickbooks documents marketing insights],
        'Api::V1::Agreement' => %w[show accept decline opt_out],
        'Api::V1::Applicant' => %w[init_authenticate authenticate],
        'Api::V1::BankAccount' => %w[flinks flinks_request_state],
        'Api::V1::BorrowerInvoice' => %w[index show],
        # TODO: remove bank_accounts when the core KYC-verified changes are pushed and properly handled by foghorn
        'Api::V1::Merchant' => %w[index bundle new load_campaigns bank_account bank_accounts select_bank_account
                                  select_sales_volume_accounts select_insights_bank_accounts post_bank_account request_assistance increase_limit refresh_offers
                                  agreement create_branding branding edit_branding update documents],
        'Api::V1::Lead' => %w[update_selected_insights_bank_accounts update_desired_bank_account_balance],
        'Api::V1::UserSession' => %w[current_user_data update_insights_preference],
        'Api::V1::Guarantor' => %w[add],
        'Api::V1::LendingOffer' => %w[offers show_offer fee],
        # TODO: The next line should be removed when the core KYC-verified changes are pushed and properly handled by foghorn
        'Api::V1::LendingApplication' => %w[index show new show_pad show_terms accept amend fee cancel], # TODO: Should no be able to accept
        'Api::V1::LendingUbl' => %w[index show],
        'Api::V1::LendingRepayment' => %w[index show],
        'Api::V1::DirectPayment' => %w[show create],
        'Api::V1::Support' => %w[load_tickets create_ticket],
        'Api::V1::Supplier' => %w[index],
        'Api::V1::FileStorage' => %w[upload_file cache_file remove_file submit_documents clean_documents_cache],
        'Api::V1::Configuration' => %w[index version],
        'Api::V1::Log' => %w[create],
        'Api::V1::BusinessPartner' => %w[create show invite business_partner_merchants received_business_partner_invoices sent_business_partner_invoices
                                         business_partner_profile update_business_partner_profile],
        'Api::V1::BusinessPartnerMerchant' => %w[invoice subscribe],
        'Api::V1::TrackedObject' => %w[tracked_object_events],
        'Api::V1::Transaction' => %w[index],
        'Api::V1::SocialConnection' => %w[index disconnect_facebook],
        'Api::V1::MarketingCampaign' => %w[create show index destroy],
        'Api::V1::Pdf' => %w[to_pdf],
        'Api::V1::DataWarehouse' => %w[aggregated_bank_accounts],
        'Api::V1::Speedy' => %w[index create show],
        'OnBoarding' => %w[new query_merchant select_merchant submit_applicant auto_login],
        # TODO: Should not be able to confirm_login & reauthenticated
        'UserSession' => %w[create destroy show_accounts switch_account confirm_login reauthenticated],
        'Help' => %w[show],
        'TrackedObject' => %w[show],
        'Quickbook' => %w[start callback failure],
        'Facebook' => %w[start callback failure],
        'FlowResult' => %w[show],
        'Api::V1::Crypto' => %w[encryption_bundle]
      }
    }

    @user_classes << {
      label: 'User with merchant_admin role is signed in',
      user: @merchant_admin,
      signed_in: true,
      delegated_access: false,
      controller_authorizations: {
        'Merchant' => %w[show apply accept_app reject_app calculate_fee],
        'Api::V1::Agreement' => [], # Class has no access
        'Api::V1::Applicant' => [], # Class has no access
        'Api::V1::BankAccount' => %w[flinks flinks_request_state],
        'Api::V1::BorrowerInvoice' => [], # Class has no access
        'Api::V1::Merchant' => %w[index bundle load_invoices pad_agreement bank_accounts select_bank_account
                                  select_sales_volume_accounts select_insights_bank_accounts load_campaigns request_assistance],
        'Api::V1::Lead' => %w[], # Class has no access
        'Api::V1::Guarantor' => %w[], # Class has no access
        'Api::V1::LendingOffer' => %w[offers show_offer fee],
        'Api::V1::LendingApplication' => %w[index show new show_pad show_terms accept amend fee cancel],
        'Api::V1::LendingUbl' => %w[index show],
        'Api::V1::LendingRepayment' => %w[index show],
        'Api::V1::DirectPayment' => [], # Class has no access
        'Api::V1::UserSession' => %w[current_user_data update_insights_preference],
        'Api::V1::Support' => %w[load_tickets create_ticket],
        'Api::V1::Supplier' => %w[index],
        'Api::V1::FileStorage' => %w[upload_file cache_file remove_file submit_documents clean_documents_cache],
        'Api::V1::Configuration' => %w[index version],
        'Api::V1::Log' => %w[create],
        'Api::V1::BusinessPartner' => [], # Class has no access
        'Api::V1::BusinessPartnerMerchant' => [], # Class has no access
        'Api::V1::TrackedObject' => [], # Class has no access
        'Api::V1::Transaction' => [], # Class has no access
        'Api::V1::SocialConnection' => [], # Class has no access
        'Api::V1::MarketingCampaign' => [], # Class has no access
        'Api::V1::Pdf' => [], # Class has no access
        'Api::V1::DataWarehouse' => [], # Class has no access
        'Api::V1::Speedy' => [], # Class has no access
        'OnBoarding' => [], # Class has no access
        'UserSession' => %w[destroy confirm_login reauthenticated show_accounts switch_account create],
        'Help' => %w[show], # Class has no access
        'TrackedObject' => %w[show],
        'Quickbook' => %w[start callback failure],
        'Facebook' => %w[start callback failure],
        'FlowResult' => %w[show],
        'Api::V1::Crypto' => %w[encryption_bundle]
      }
    }

    @user_classes << {
      label: 'User with partner_admin role is signed in',
      user: @partner_admin,
      signed_in: true,
      delegated_access: false,
      controller_authorizations: {
        'Merchant' => [], # Class has no access
        'Api::V1::Agreement' => [], # Class has no access
        'Api::V1::Applicant' => [], # Class has no access
        'Api::V1::BankAccount' => [],
        'Api::V1::BorrowerInvoice' => [], # Class has no access
        'Api::V1::Merchant' => [], # Class has no access
        'Api::V1::Lead' => [], # Class has no access
        'Api::V1::Guarantor' => [], # Class has no access
        'Api::V1::LendingOffer' => [], # Class has no access
        'Api::V1::LendingApplication' => [], # Class has no access
        'Api::V1::LendingUbl' => [], # Class has no access
        'Api::V1::LendingRepayment' => [], # Class has no access
        'Api::V1::DirectPayment' => [], # Class has no access
        'Api::V1::UserSession' => [], # Class has no access
        'Api::V1::Support' => [], # Class has no access
        'Api::V1::Supplier' => [], # Class has no access
        'Api::V1::FileStorage' => [], # Class has no access
        'Api::V1::Configuration' => [], # Class has no access
        'Api::V1::Log' => [], # Class has no access
        'Api::V1::BusinessPartner' => [], # Class has no access
        'Api::V1::BusinessPartnerMerchant' => [], # Class has no access
        'Api::V1::TrackedObject' => [], # Class has no access
        'Api::V1::Transaction' => [], # Class has no access
        'Api::V1::SocialConnection' => [], # Class has no access
        'Api::V1::MarketingCampaign' => [], # Class has no access
        'Api::V1::Pdf' => [], # Class has no access
        'Api::V1::DataWarehouse' => [], # Class has no access
        'Api::V1::Speedy' => [], # Class has no access
        'OnBoarding' => [], # Class has no access
        'UserSession' => %w[destroy],
        'Help' => [], # Class has no access
        'TrackedObject' => %w[show],
        'Quickbook' => %w[start callback failure],
        'Facebook' => %w[start callback failure],
        'FlowResult' => %w[show],
        'Api::V1::Crypto' => []
      }
    }

    @user_classes << {
      label: 'User with delegated access',
      user: nil,
      signed_in: false,
      delegated_access: true,
      controller_authorizations: {
        'Merchant' => %w[show calculate_fee],
        'Api::V1::Agreement' => [], # Class has no access
        'Api::V1::Applicant' => [], # Class has no access
        'Api::V1::BankAccount' => [],
        'Api::V1::BorrowerInvoice' => [], # Class has no access
        'Api::V1::Merchant' => %w[index bundle load_invoices pad_agreement bank_accounts load_campaigns],
        'Api::V1::Lead' => %w[],
        'Api::V1::Guarantor' => [], # Class has no access
        'Api::V1::LendingOffer' => %w[offers show_offer fee],
        'Api::V1::LendingApplication' => %w[index show show_pad show_terms],
        'Api::V1::LendingUbl' => %w[index show],
        'Api::V1::LendingRepayment' => %w[index show],
        'Api::V1::DirectPayment' => %w[show],
        'Api::V1::UserSession' => [], # Class has no access
        'Api::V1::Support' => [], # Class has no access
        'Api::V1::Supplier' => %w[index],
        'Api::V1::FileStorage' => [], # Class has no access
        'Api::V1::Configuration' => %w[index version],
        'Api::V1::Log' => %w[create],
        'Api::V1::BusinessPartner' => [], # Class has no access
        'Api::V1::BusinessPartnerMerchant' => [], # Class has no access
        'Api::V1::TrackedObject' => [], # Class has no access
        'Api::V1::Transaction' => [], # Class has no access
        'Api::V1::SocialConnection' => [], # Class has no access
        'Api::V1::MarketingCampaign' => [], # Class has no access
        'Api::V1::Pdf' => [], # Class has no access
        'Api::V1::DataWarehouse' => [], # Class has no access
        'Api::V1::Speedy' => [], # Class has no access
        'OnBoarding' => [], # Class has no access
        'UserSession' => %w[delegated_logout destroy],
        'Help' => [], # Class has no access
        'TrackedObject' => %w[show],
        'Quickbook' => %w[start callback failure],
        'Facebook' => %w[start callback failure],
        'FlowResult' => %w[show],
        'Api::V1::Crypto' => []
      }
    }
  end

  test 'the authorization on all controllers, actions' do
    each_existing_action do |_, klass, action_name|
      controller = /\A(.+)Controller\z/.match(klass.to_s)[1].singularize

      segments = controller.split('::')
      resource = segments.pop
      namespace = segments.join('::')

      next if @skip_controllers.include?(resource)

      @user_classes.each do |user_class|
        assert user_class[:controller_authorizations].key?(controller), "User class '#{user_class[:label]}' is missing authz for #{controller}"

        ability = Ability.new(user_class[:user], user_class[:signed_in], user_class[:delegated_access], namespace)

        if user_class[:controller_authorizations][controller].include?(action_name)
          assert ability.can?(action_name.to_sym, resource.underscore.to_sym),
                 "User class '#{user_class[:label]}' does not have access to #{resource.underscore}:#{action_name} but should."
        else
          assert ability.cannot?(action_name.to_sym, resource.underscore.to_sym),
                 "User class '#{user_class[:label]}' has access to #{resource.underscore}:#{action_name} but should not."
        end
      end
    end
  end

  test 'the authorization on all skip controllers' do
    each_existing_action do |_, klass, action_name|
      controller = /\A(.+)Controller\z/.match(klass.to_s)[1].singularize

      segments = controller.split('::')
      resource = segments.pop
      namespace = segments.join('::')

      next unless @skip_controllers.include?(resource)

      # All classes should have access to all skip controllers
      @user_classes.each do |user_class|
        ability = Ability.new(user_class[:user], user_class[:signed_in], user_class[:delegated_access], namespace)

        assert ability.can?(action_name.to_sym, resource.underscore.to_sym),
               "User class '#{user_class[:label]}' does not have access to #{resource.underscore}:#{action_name} but should."
      end
    end
  end

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
