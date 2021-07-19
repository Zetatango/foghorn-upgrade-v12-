import * as Factory from 'factory.ts';
import { KycCheck, KycCheckType, KycCheckStatus } from 'app/models/api-entities/merchant';

/********************************* FACTORIES **********************************/

const kycCheckFactory = Factory.Sync.makeFactory<KycCheck>({
  check: KycCheckType.COE,
  status: KycCheckStatus.verified,
  date_last_verified: null,
  guid: 'app_123', // This is an applicant id for IV, IA, WL & OV checks
  reason_code: null
});

const kycCheckCOEFactory = Factory.Sync.makeFactory<KycCheck>({
  check: KycCheckType.COE,
  status: KycCheckStatus.verified,
  date_last_verified: null,
  guid: 'm_abc', // merchantDataFactory.build().id, // TODO [Val] This is the merchant's id for COE check
  reason_code: null
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const kycCheckCOEVerified = kycCheckFactory.build();
/** @deprecated Prefer factories instead. */
export const kycCheckIVVerified = kycCheckFactory.build({ check: KycCheckType.IV });
/** @deprecated Prefer factories instead. */
export const kycCheckIAVerified = kycCheckFactory.build({ check: KycCheckType.IA });
/** @deprecated Prefer factories instead. */
export const kycCheckWLVVerified = kycCheckFactory.build({ check: KycCheckType.WLV });
/** @deprecated Prefer factories instead. */
export const kycCheckOVVerified = kycCheckFactory.build({ check: KycCheckType.OV });
/** @deprecated Prefer factories instead. */

/** @deprecated Prefer factories instead. */
export const kycCheckCOEFailed = kycCheckCOEFactory.build({ status: KycCheckStatus.failed });
/** @deprecated Prefer factories instead. */
export const kycCheckIVFailed = kycCheckFactory.build({ check: KycCheckType.IV, status: KycCheckStatus.failed });
/** @deprecated Prefer factories instead. */
export const kycCheckIAFailed = kycCheckFactory.build({ check: KycCheckType.IA, status: KycCheckStatus.failed });
/** @deprecated Prefer factories instead. */
export const kycCheckWLVFailed = kycCheckFactory.build({ check: KycCheckType.WLV, status: KycCheckStatus.failed });
/** @deprecated Prefer factories instead. */
export const kycCheckOVFailed = kycCheckFactory.build({ check: KycCheckType.OV, status: KycCheckStatus.failed });

/** @deprecated Prefer factories instead. */
export const kycCheckCOEUnverified = kycCheckFactory.build({ status: KycCheckStatus.unverified});
/** @deprecated Prefer factories instead. */
export const kycCheckIVUnverified = kycCheckFactory.build({ check: KycCheckType.IV, status: KycCheckStatus.unverified });
/** @deprecated Prefer factories instead. */
export const kycCheckIAUnverified = kycCheckFactory.build({ check: KycCheckType.IA, status: KycCheckStatus.unverified });
/** @deprecated Prefer factories instead. */
export const kycCheckWLVUnverified = kycCheckFactory.build({ check: KycCheckType.WLV, status: KycCheckStatus.unverified });
/** @deprecated Prefer factories instead. */
export const kycCheckOVUnverified = kycCheckFactory.build({ check: KycCheckType.OV, status: KycCheckStatus.unverified });


