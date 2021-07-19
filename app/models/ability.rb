# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user, signed_in, delegated_access, namespace)
    @user = user
    @namespace = namespace

    if delegated_access
      set_delegated_access_authorization
    elsif signed_in && user.present?
      set_signed_in_authorization
    else
      set_default_authorization
    end

    set_open_controller_authorization
  end

  private

  def set_open_controller_authorization
    can %i[show], :tracked_object
    can :create, :csp_report
    can :root, :util
    can :merchant_auth, :jwt
    can %i[start callback failure], :quickbook
    can %i[start callback failure], :facebook
    can %i[show], :flow_result
  end

  def set_signed_in_authorization
    if @user.merchant_new?
      set_merchant_new_authorization
    elsif @user.merchant_admin?
      set_merchant_admin_authorization
    elsif @user.partner_admin?
      set_partner_admin_authorization
    else
      set_default_signed_in_authorization
    end
  end

  def set_delegated_access_authorization
    if @namespace == 'Api::V1'
      can %i[index show show_pad show_terms], :lending_application
      can %i[index bundle load_invoices pad_agreement bank_accounts load_campaigns], :merchant
      can %i[offers show_offer fee], :lending_offer
      can %i[index show], :lending_repayment
      can :index, :supplier
      can %i[index show], :lending_ubl
      can %i[show], :direct_payment
      can %i[index version], :configuration
      can %i[create], :log
    else
      can %i[show calculate_fee], :merchant
      can %i[delegated_logout destroy], :user_session
    end
  end

  def set_merchant_new_authorization
    can :show, :help
    can %i[new query_merchant select_merchant submit_applicant auto_login], :on_boarding
    # TODO: the next line be removed when the core KYC-verified changes are pushed and properly handled by foghorn

    if @namespace == 'Api::V1'
      can %i[flinks flinks_request_state], :bank_account
      # TODO: the next line be removed when the core KYC-verified changes are pushed and properly handled by foghorn
      can %i[index show new show_pad show_terms accept amend fee cancel], :lending_application # TODO: Should not be able to accept.
      can %i[add], :guarantor
      can %i[index show], :lending_repayment
      can %i[current_user_data update_insights_preference], :user_session
      can %i[index bundle new load_campaigns bank_account bank_accounts select_bank_account select_sales_volume_accounts select_insights_bank_accounts
             post_bank_account request_assistance increase_limit refresh_offers agreement create_branding branding edit_branding
             update documents], :merchant
      can %i[update_selected_insights_bank_accounts update_desired_bank_account_balance], :lead
      can %i[offers show_offer fee], :lending_offer
      can :index, :supplier
      can %i[index show], :borrower_invoice
      can %i[show create], :direct_payment
      can %i[index show], :lending_ubl
      can %i[init_authenticate authenticate], :applicant
      can %i[upload_file cache_file remove_file submit_documents clean_documents_cache], :file_storage
      can %i[index version], :configuration
      can %i[create], :log
      can %i[create show invite business_partner_merchants received_business_partner_invoices sent_business_partner_invoices business_partner_profile
             update_business_partner_profile], :business_partner
      can %i[invoice subscribe], :business_partner_merchant
      can %i[tracked_object_events], :tracked_object
      can %i[index], :transaction
      can %i[encryption_bundle], :crypto
      can %i[show accept decline opt_out], :agreement
      can %i[index disconnect_facebook], :social_connection
      can %i[create show index destroy], :marketing_campaign
      can :to_pdf, :pdf
      can %i[aggregated_bank_accounts], :data_warehouse
      can %i[index create show], :speedy
    else
      can %i[new show partner partner_onboarding documents marketing quickbooks insights], :merchant
      # TODO: Should not be able to confirm_login & reauthenticated
      can %i[create destroy show_accounts switch_account confirm_login reauthenticated], :user_session
    end
  end

  def set_merchant_admin_authorization
    can :show, :help

    if @namespace == 'Api::V1'
      can %i[flinks flinks_request_state], :bank_account
      can %i[index show new show_pad show_terms accept amend fee cancel], :lending_application
      can %i[index show], :lending_repayment
      can %i[current_user_data update_insights_preference], :user_session
      can %i[index bundle load_invoices pad_agreement bank_accounts select_bank_account
             select_sales_volume_accounts select_insights_bank_accounts load_campaigns request_assistance], :merchant
      can %i[offers show_offer fee], :lending_offer
      can :index, :supplier
      can %i[index show], :lending_ubl
      can %i[upload_file cache_file remove_file submit_documents clean_documents_cache], :file_storage
      can %i[index version], :configuration
      can %i[create], :log
      can %i[encryption_bundle], :crypto
    else
      can %i[show], :merchant
      can %i[destroy confirm_login reauthenticated create show_accounts switch_account], :user_session
    end
  end

  def set_partner_admin_authorization
    can :destroy, :user_session unless @namespace == 'Api::V1'
  end

  def set_default_signed_in_authorization
    can %i[destroy auto_choose_account], :user_session unless @namespace == 'Api::V1'
  end

  def set_default_authorization
    can %i[new create], :merchant
    can %i[create show_accounts choose_account backchannel_logout auto_choose_account], :user_session unless @namespace == 'Api::V1'
  end
end
