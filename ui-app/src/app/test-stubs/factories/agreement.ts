import * as Factory from 'factory.ts';
import { Agreement, AgreementState, AgreementType } from 'app/models/agreement';

/********************************* FACTORIES **********************************/

export const agreementFactory = Factory.makeFactory<Agreement>({
  id: 'agr_123',
  content: 'This is your agreement',
  type: AgreementType.pre_authorized_debit,
  accepted_at: '2019-10-01',
  declined_at: '2019-10-01',
  opt_out_at: '2019-10-01',
  business_partner_id: 'm_123',
  merchant_id: 'm_456',
  partner_id: 'p_123',
  user_id: 'u_123',
  accepted_ip_address: '192.168.0.1',
  declined_ip_address: '192.168.0.1',
  opt_out_ip_address: '192.168.0.1',
  state: AgreementState.pending
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const agreement = agreementFactory.build();
