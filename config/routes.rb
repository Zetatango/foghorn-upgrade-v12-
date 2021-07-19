# frozen_string_literal: true

Rails.application.routes.draw do
  scope '(:locale)', locale: /#{I18n.available_locales.join("|")}/ do
    resources :merchants, only: [:new]
  end

  mount ActionCable.server, at: '/cable'

  resources :merchants, only: %i[new create]

  resources :tracked_object, only: %i[show]

  resources :on_boarding, only: %(new)
  namespace 'on_boarding' do
    post 'query_merchant', to: 'query_merchant'
    post 'select_merchant', to: 'select_merchant'
    post 'submit_applicant', to: 'submit_applicant'
    get 'auto_login', to: 'auto_login'
  end

  get 'merchant', to: 'merchants#show', as: :merchant
  get 'application', to: 'merchants#show'
  get 'dashboard', to: 'merchants#show'
  get 'onboarding', to: 'merchants#show'
  get 'certification', to: 'merchants#show'
  get 'cash_flow', to: 'merchants#show'
  get 'partner', to: 'merchants#partner'
  get 'partner_onboarding', to: 'merchants#partner_onboarding'
  get 'documents', to: 'merchants#documents'
  get 'marketing', to: 'merchants#marketing'
  get 'quickbooks', to: 'merchants#quickbooks'
  get 'insights', to: 'merchants#insights'

  namespace 'api' do
    namespace 'v1' do
      resources :merchants, only: %i[index update] do
        collection do
          get 'bundle'
        end
        member do
          get 'agreement'
        end
      end
      post 'merchants' => 'merchants#new'
      get 'invoices' => 'merchants#load_invoices'
      get 'pad_agreement/:app_id' => 'merchants#pad_agreement'
      get 'bank_accounts/:id' => 'merchants#bank_account'
      get 'bank_accounts' => 'merchants#bank_accounts'
      get 'bank_account/flinks'
      get 'bank_account/flinks_request_state/:request_id', to: 'bank_account#flinks_request_state', as: 'bank_account_flinks_request_state'
      post 'bank_account' => 'merchants#post_bank_account'
      post 'select_bank_account' => 'merchants#select_bank_account'
      post 'select_sales_volume_accounts' => 'merchants#select_sales_volume_accounts'
      post 'select_insights_bank_accounts' => 'merchants#select_insights_bank_accounts'
      post 'request_assistance' => 'merchants#request_assistance'
      post 'increase_limit' => 'merchants#increase_limit'
      post 'refresh_offers' => 'merchants#refresh_offers'
      get 'campaigns' => 'merchants#load_campaigns'
      get 'merchants/:id/business_partner_branding', to: 'merchants#branding'
      get 'merchants/documents', to: 'merchants#documents'
      post 'merchants/:id/business_partner_branding', to: 'merchants#create_branding'
      put 'merchants/:id/business_partner_branding', to: 'merchants#edit_branding'
      # lending_offers routes
      get 'lending_offers/get_offers(/:merchant_guid)', to: 'lending_offers#offers', as: 'get_merchant_offers'
      get 'lending_offers/get_offer/:id', to: 'lending_offers#show_offer'
      get 'lending_offers/fee', to: 'lending_offers#fee'
      # lending_applications routes
      get 'lending_applications', to: 'lending_applications#index'
      get 'lending_applications/:id', to: 'lending_applications#show'
      get 'lending_applications/:id/pad_agreement', to: 'lending_applications#show_pad'
      get 'lending_applications/:id/terms', to: 'lending_applications#show_terms'
      get 'lending_applications/:id/fee', to: 'lending_applications#fee'
      post 'lending_applications', to: 'lending_applications#new'
      put 'lending_applications/:id/accept', to: 'lending_applications#accept'
      put 'lending_applications/:id/amend', to: 'lending_applications#amend'
      put 'lending_applications/:id/cancel', to: 'lending_applications#cancel'
      # guarantor routes
      post 'guarantor', to: 'guarantor#add'
      # lending_repayments routes
      resources :lending_repayments, only: %i[index show]
      # user data routes
      get 'user_sessions/current_user_data', to: 'user_sessions#current_user_data'
      put 'user_sessions/update_insights_preference', to: 'user_sessions#update_insights_preference'
      # suppliers routes
      get 'suppliers', to: 'suppliers#index'
      # borrower_invoices routes
      resources :borrower_invoices, only: %i[index show]
      # lending UBLs routes
      get 'lending_ubls/get_ubls', to: 'lending_ubls#index', as: 'lending_ubls'
      get 'lending_ubls/get_ubl/:id', to: 'lending_ubls#show'
      # transaction listing
      get 'transactions', to: 'transactions#index'

      post 'leads/:id/selected_insights_bank_accounts', to: 'leads#update_selected_insights_bank_accounts'
      put 'leads/:id/desired_bank_account_balance', to: 'leads#update_desired_bank_account_balance'

      # Applicants
      post 'applicants/:id/authenticate', to: 'applicants#init_authenticate'
      put 'applicants/:id/authenticate', to: 'applicants#authenticate'

      # File Storage
      post 'upload_file', to: 'file_storage#upload_file'
      post 'cache_file', to: 'file_storage#cache_file'
      post 'remove_file', to: 'file_storage#remove_file'
      post 'submit_documents', to: 'file_storage#submit_documents'
      post 'clean_documents_cache', to: 'file_storage#clean_documents_cache'

      # Crypto
      post 'encryption_bundle', to: 'crypto#encryption_bundle'

      # Configuration
      get 'configuration', to: 'configuration#index'
      get 'app_version', to: 'configuration#version'

      # Logging
      post 'log', to: 'log#create'

      # Direct Payments
      get 'direct_payments/:id', to: 'direct_payments#show'
      post 'direct_payments', to: 'direct_payments#create'

      # Business Partners
      resources :business_partners, only: %i[show create]
      post 'business_partners/:id/invite', to: 'business_partners#invite'

      get 'business_partners/:id/business_partner_merchant', to: 'business_partners#business_partner_merchants'
      get 'business_partners/:id/received_business_partner_invoices', to: 'business_partners#received_business_partner_invoices'
      get 'business_partners/:id/sent_business_partner_invoices', to: 'business_partners#sent_business_partner_invoices'
      get 'business_partners/:id/business_partner_profile', to: 'business_partners#business_partner_profile'
      put 'business_partners/:id/business_partner_profile', to: 'business_partners#update_business_partner_profile'

      post 'business_partner_merchants/:id/invoice', to: 'business_partner_merchants#invoice'

      # Data Service
      get 'data_warehouse/aggregated_bank_accounts', to: 'data_warehouse#aggregated_bank_accounts'

      # Speedy
      scope :speedy, as: 'speedy' do
        resources :jobs, controller: :speedy, only: %i[index show create]
      end

      # Payment Plans
      put 'business_partner_merchants/subscribe', to: 'business_partner_merchants#subscribe'

      # PDFs
      post 'pdfs/to_pdf', to: 'pdfs#to_pdf'

      # Agreements
      resources :agreements, only: %i[show] do
        member do
          put 'accept'
          put 'decline'
          put 'opt_out'
        end
      end

      # Social connections
      resources :social_connections, only: %i[index]
      delete 'social_connections/facebook', to: 'social_connections#disconnect_facebook'

      # marketing campaigns
      resources :marketing_campaigns, only: %i[show create index destroy]

      get 'tracked_objects/:id/tracked_object_events', to: 'tracked_objects#tracked_object_events'
    end
  end

  get '/auth/user/callback', to: 'user_sessions#create'
  get 'reauth/user/callback', to: 'user_sessions#reauthenticated'

  get 'auth/quickbooks/callback', to: 'quickbooks#callback'
  get 'auth/quickbooks/failure', to: 'quickbooks#failure'
  get '/quickbooks_start', to: 'quickbooks#start'

  get 'auth/facebook/callback', to: 'facebook#callback'
  get 'auth/facebook/failure', to: 'facebook#failure'
  get '/facebook_start', to: 'facebook#start'

  get '/auth/user/failure', to: redirect('500.html', status: 302)

  get '/confirm_login', to: 'user_sessions#confirm_login'
  get '/logout', to: 'user_sessions#destroy', as: :logout
  get '/accounts', to: 'user_sessions#show_accounts'
  post '/accounts', to: 'user_sessions#choose_account'
  get '/switch_account', to: 'user_sessions#switch_account'
  get '/auto_choose_account', to: 'user_sessions#auto_choose_account'
  post '/backchannel_logout', to: 'user_sessions#backchannel_logout'
  post '/delegated_logout', to: 'user_sessions#delegated_logout'

  get '/flow_result', to: 'flow_results#show'

  get '/jwt', to: 'jwt#merchant_auth', as: :merchant_auth

  resources :csp_reports, only: %i[create]

  root to: 'utils#root'
  match '*path' => 'merchants#show', via: :get, constraints: lambda { |req|
    !(req.path.include? '/api/') && !(req.path.include? '.')
  }
end
