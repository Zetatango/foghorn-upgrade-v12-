import * as Factory from 'factory.ts';

import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { ZttResponse } from 'app/models/api-entities/response';

export const businessPartnerProfileFactory = Factory.Sync.makeFactory<BusinessPartnerProfile>({
  id: 'bpp_123',
  merchant_id: 'm_123',
  application_id: 'bpap_123',
  ario_marketing_requested_at: '',
  collateral_downloaded_at: '',
  created_at: Date.now().toString(),
  first_customer_invited_at: '',
  first_customer_invoiced_at: '',
  partner_training_completed_at: '',
  sales_training_completed_at: '',
  facebook_sharing_requested_at: '',
  twitter_sharing_requested_at: '',
  linkedin_sharing_requested_at: '',
  status: 'bronze',
  vanity_added_to_website_at: ''
});

export const businessPartnerProfileResponseFactory = Factory.Sync.makeFactory<ZttResponse<BusinessPartnerProfile>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: businessPartnerProfileFactory.build()
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const emptyBusinessPartnerProfile: BusinessPartnerProfile = businessPartnerProfileFactory.build();
/** @deprecated Prefer factories instead. */
export const partnerTrainingCompletedBusinessPartnerProfile: BusinessPartnerProfile = businessPartnerProfileFactory.build();
