import * as Factory from 'factory.ts';
import { Supplier, SupplierInformation } from 'app/models/api-entities/supplier';

/********************************* FACTORIES **********************************/

const supplierFactory = Factory.makeFactory<Supplier>({
  name: 'LCBO',
  id: 'su_abc',
  is_business_partner: false
});

const supplierInformationFactory = Factory.makeFactory<SupplierInformation>({
  name: 'LCBO',
  id: 'su_abc',
  is_business_partner: false,
  account_number: '1111-2222-3333-4444',
  invoice_number: '1'
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const supplierLcbo = supplierFactory.build();
/** @deprecated Prefer factories instead. */
export const supplierBeerStore = supplierFactory.build({ name: 'Beer Store', id: 'su_def', is_business_partner: true });

/** @deprecated Prefer factories instead. */
export const supplierInfoLcbo = supplierInformationFactory.build();
/** @deprecated Prefer factories instead. */
export const supplierInfoBeerStore = supplierInformationFactory.build({ name: 'Beer Store', id: 'su_def', is_business_partner: true });
