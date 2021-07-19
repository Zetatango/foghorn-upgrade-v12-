import { Address } from 'app/models/address';
import { Business } from 'app/models/business';
import { Industry } from 'app/models/industry';
import { Jurisdiction } from 'app/models/jurisdiction';
import { Applicant } from 'app/models/api-entities/applicant';
import { EditBusinessFormData } from 'app/models/api-entities/merchant';
import { Province } from 'app/models/province';
import * as Factory from 'factory.ts';

/********************************* FACTORIES **********************************/

export const businessFormFactory = Factory.Sync.makeFactory<Business>({
  name: 'BUSINESS NAME',
  phone_number: '(613) 555-1234',
  industry: Industry.MANUFACTURING,
  business_num: '123456',
  incorporated_in: Jurisdiction.ON,
  doing_business_as: 'BUSINESS NAME INC',
  self_attested_date_established: new Date(),
  self_attested_average_monthly_sales: 10000
});

export const editBusinessFormFactory = Factory.Sync.makeFactory<EditBusinessFormData>({
  name: 'BUSINESS NAME',
  business_num: '123456',
  incorporated_in: Province.ON, // Jurisdiction.ON // TODO [Val] Use proper type
  doing_business_as: 'BUSINESS NAME INC'
});

export const applicantFormFactory = Factory.makeFactory<Applicant>({
  first_name: 'Jean',
  last_name: 'Seberg',
  date_of_birth: new Date(1938, 11, 13),
  owner_since: new Date(2019, 1, 1),
  phone_number: '(613) 555-1234'
});

export const addressFormFactory = Factory.Sync.makeFactory<Address>({
  address_line_1: '10 ave Street',
  city: 'TORONTO',
  state_province: Province.ON,
  postal_code: 'H0H0H0'
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const businessFormValid = businessFormFactory.build();

/** @deprecated Prefer factories instead. */
export const addressFormValid = addressFormFactory.build();
