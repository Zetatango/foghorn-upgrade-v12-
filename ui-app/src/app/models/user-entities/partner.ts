import { IdentityProvider } from './identity-provider';

export interface Partner {
  id: string;
  subdomain: string;
  identity_provider: IdentityProvider;

  // PARTNER CONFIGURATIONS

  conf_allow_multiple_businesses: boolean;  // Current use: [Rails] 'Should we allow merchant to onboard multiple merchants.'
                                            //              [Angular] None.
  conf_onboard_supported: boolean;          // Current use: [Rails] 'Is merchant self onboarding allowed.'
                                            //              [Angular] 'Can the merchant access the on-boarding/certification flow'
  conf_merchant_welcome: boolean;           // Current use: [Rails] 'Should we show hands page.'
                                            //              [Angular] None.
}
