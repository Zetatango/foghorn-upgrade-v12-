import * as Factory from 'factory.ts';
import { BusinessPartnerMerchant, LinkedMerchant } from 'app/models/api-entities/business-partner-customer-summary';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { KycCheckStatus } from 'app/models/api-entities/merchant';
import { SmallBusinessGrade } from 'app/models/api-entities/offer';

// LINKED MERCHANTS
export const linkedMerchantFactory = Factory.Sync.makeFactory<LinkedMerchant>({
  id: 'lm_123',
  kyc_verified_state: KycCheckStatus.verified,
  small_business_grade: SmallBusinessGrade.A,
  available_amount: 1000,
  paf_opt_in: false
});

// BUSINESS PARTNER
export const businessPartnerMerchantFactory = Factory.Sync.makeFactory<BusinessPartnerMerchant>({
  id: 'bpm_123',
  name: 'Merchant1',
  email: 'test@user.com',
  tracked_object_id: 'obj_123',
  last_event_at: '2019-01-01',
  last_event: TrackedObjectState.invited,
  linked_merchants: [],
  auto_send: false,
  sign_up_email: 'test@user.com',
  sign_up_name: 'Merchant1',
  quickbooks_customer_id: ''
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const linkedMerchant = linkedMerchantFactory.build();
/** @deprecated Prefer factories instead. */
export const noGradelinkedMerchant = linkedMerchantFactory.build({ small_business_grade: null });
/** @deprecated Prefer factories instead. */
export const pafLinkedMerchant = linkedMerchantFactory.build({ paf_opt_in: true });
