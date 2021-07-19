import * as Factory from 'factory.ts';
import { Partner } from 'app/models/user-entities/partner';
import { IdentityProvider } from 'app/models/user-entities/identity-provider';

/** @deprecated Prefer factories instead. */
const billmarketIdentityProvider: IdentityProvider = {
  id: 'ip_KP3JziJ6NhmbE2i',
  name: 'BillMarket IdP',
  subdomain: 'billmarket',
  vanity_url: 'id.billmarket.zetatango.local',
  created_at: Date.now().toString()
};

/** @deprecated Prefer factories instead. */
const arioIdentityProvider: IdentityProvider = {
  id: 'ip_atAJheEg8xpxbq9X',
  name: 'Ario IdP',
  subdomain: 'ztt-auth',
  vanity_url: 'id.ztt-auth.zetatango.local',
  created_at: Date.now().toString()
};

/********************************* FACTORIES **********************************/

export const partnerFactory = Factory.Sync.makeFactory<Partner>({
  id: 'p_123',
  subdomain: 'test',
  identity_provider: null,
  conf_allow_multiple_businesses: true,
  conf_onboard_supported: true,
  conf_merchant_welcome: true
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const defaultPartner = partnerFactory.build();
/** @deprecated Prefer factories instead. */
export const billmarketPartner = partnerFactory.build({
  id: 'p_p9m2FNZCUn8eR4j5',
  subdomain: 'billmarket',
  identity_provider: billmarketIdentityProvider,
  conf_allow_multiple_businesses: false,
  conf_merchant_welcome: false
});
/** @deprecated Prefer factories instead. */
export const dreampaymentsPartner = partnerFactory.build({
  id: 'p_7J9FJv6qpnG8Q8E2',
  subdomain: 'dreampayments',
  identity_provider: arioIdentityProvider,
  conf_allow_multiple_businesses: false,
  conf_onboard_supported: false,
});
