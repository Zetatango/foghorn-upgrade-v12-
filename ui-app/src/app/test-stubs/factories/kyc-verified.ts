import * as Factory from 'factory.ts';
import { KycVerified, KycCheckStatus } from 'app/models/api-entities/merchant';
import {
  kycCheckCOEFailed, kycCheckCOEUnverified, kycCheckCOEVerified,
  kycCheckIAFailed, kycCheckIAUnverified, kycCheckIAVerified,
  kycCheckIVVerified,
  kycCheckOVVerified,
  kycCheckWLVVerified,
} from 'app/test-stubs/factories/kyc-check';

/********************************* FACTORIES **********************************/

export const kycVerifiedFactory = Factory.Sync.makeFactory<KycVerified>({
  status: KycCheckStatus.verified,
  date_last_verified: null,
  details: [ kycCheckCOEVerified, kycCheckIAVerified, kycCheckIVVerified, kycCheckWLVVerified, kycCheckOVVerified ]
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const kycVerifiedPass = kycVerifiedFactory.build();
/** @deprecated Prefer factories instead. */
export const kycVerifiedFailed = kycVerifiedFactory.build({ status: KycCheckStatus.failed });
/** @deprecated Prefer factories instead. */
export const kycVerifiedUnverified = kycVerifiedFactory.build({ status: KycCheckStatus.unverified });
/** @deprecated Prefer factories instead. */
export const kycVerifiedInProgress = kycVerifiedFactory.build({ status: KycCheckStatus.in_progress });
/** @deprecated Prefer factories instead. */

/** @deprecated Prefer factories instead. */
export const kycVerifiedIAUnverified = kycVerifiedFactory.build({
  status: KycCheckStatus.unverified,
  details: [ kycCheckIAUnverified ]
});
/** @deprecated Prefer factories instead. */
export const kycVerifiedIAMissing = kycVerifiedFactory.build({
  status: KycCheckStatus.unverified,
  details: [ kycCheckCOEVerified, kycCheckIVVerified, kycCheckWLVVerified, kycCheckOVVerified ]
});
/** @deprecated Prefer factories instead. */
export const kycVerifiedIAFailed = kycVerifiedFactory.build({
  status: KycCheckStatus.failed,
  details: [ kycCheckIAFailed ]
});
/** @deprecated Prefer factories instead. */
export const kycVerifiedIAFailedOtherKycPassed = kycVerifiedFactory.build({
  status: KycCheckStatus.failed,
  details: [ kycCheckIAFailed, kycCheckCOEVerified, kycCheckIVVerified, kycCheckWLVVerified, kycCheckOVVerified  ]
});

/** @deprecated Prefer factories instead. */
export const kycVerifiedCOEUnverified = kycVerifiedFactory.build({
  status: KycCheckStatus.unverified,
  details: [ kycCheckCOEUnverified ]
});
/** @deprecated Prefer factories instead. */
export const kycVerifiedCOEFailed = kycVerifiedFactory.build({
  status: KycCheckStatus.failed,
  details: [ kycCheckCOEFailed ]
});
/** @deprecated Prefer factories instead. */
export const kycVerifiedCOEMissing = kycVerifiedFactory.build({
  status: KycCheckStatus.unverified,
  details: [ kycCheckIAVerified, kycCheckIVVerified, kycCheckWLVVerified, kycCheckOVVerified ]
});

/** @deprecated Prefer factories instead. */
export const malformedKycProfiles: KycVerified[] = [
  undefined,
  null,
  { status: undefined, date_last_verified: undefined, details: undefined },
  { status: null, date_last_verified: null, details: null },
];
