import * as Factory from 'factory.ts';
import { MerchantQuerySelectPost } from 'app/models/api-entities/merchant-query';
import { Industry } from 'app/models/industry';
import { Jurisdiction } from 'app/models/jurisdiction';
import { merchantQueryResponse } from 'app/test-stubs/factories/merchant-query';

/********************************* FACTORIES **********************************/

const merchantQuerySelectPostFactory = Factory.Sync.makeFactory<MerchantQuerySelectPost>({
  query_id: merchantQueryResponse.query_id,
  business_id: merchantQueryResponse.results[ 0 ].id,
  industry: Industry.MANUFACTURING,
  business_num: '123456',
  incorporated_in: Jurisdiction.ON,
  doing_business_as: 'BUSINESS INC',
  self_attested_average_monthly_sales: 10000,
  self_attested_date_established: new Date().toISOString()
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// merchant query select
/** @deprecated Prefer factories instead. */
export const merchantQuerySelectPost = merchantQuerySelectPostFactory.build();
