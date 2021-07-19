import * as Factory from 'factory.ts';
import { Merchant, MerchantPost, MerchantPut, QuickBooksState } from 'app/models/api-entities/merchant';
import { Country } from 'app/models/api-entities/utility';
import { Industry } from 'app/models/industry';
import { Province } from 'app/models/province';
import { kycVerifiedPass } from 'app/test-stubs/factories/kyc-verified';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

/**
 * This factory is the root of the merchant information for other factories. It is when the merchant is created.
 */
export const merchantPostFactory = Factory.Sync.makeFactory<MerchantPost>({
  email: 'matt_the_cat@arioplatform.com',
  industry: Industry.MANUFACTURING,
  name: 'Zetatango Technologies Inc.',
  doing_business_as: 'Ario',
  phone_number: '6135551234',
  avg_monthly_sales: 0,
  business_num: '', // TODO [Val] Should I provided a BN in the base factory

  address_line_1: '35 Fitzgerald Road',
  address_line_2: '4th Floor',
  city: 'Nepean',
  country: Country.Canada,
  postal_code: 'K2H 5Z2',
  state_province: Province.ON,
  self_attested_average_monthly_sales: 10000,
  self_attested_date_established: new Date().toISOString()
});

/**
 * This factory is feeding from merchantPostFactory as a base and adds the attributes the backend would add:
 *  - after the merchant creation
 *  - during the merchant's life-cycle
 */
export const merchantDataFactory = Factory.Sync.makeFactory<Merchant>({ // TODO [Val] Rename merchantDataFactory -> merchantGetFactory
  address: `${merchantPostFactory.build().address_line_1} ${merchantPostFactory.build().address_line_2}`,
  address_line_1: merchantPostFactory.build().address_line_1,
  address_line_2: merchantPostFactory.build().address_line_2,
  bank_connection_required: false,
  business_num: '', // TODO [Val] Should I provided a BN in the base factory
  campaigns: [],
  city: merchantPostFactory.build().city,
  country: merchantPostFactory.build().country,
  desired_bank_account_balance: undefined,
  doing_business_as: merchantPostFactory.build().doing_business_as,
  email: merchantPostFactory.build().email,
  endorsing_partner_id: 'ep_123',
  id: 'm_abc',
  incorporated_in: Province.ON,
  kyc_verified: kycVerifiedPass,
  name: merchantPostFactory.build().name,
  operate_in: merchantPostFactory.build().state_province as Province, // Defaulting to state_province because not provided in MerchantPost. // TODO [Val] Could I get rid of the type casting ?
  partner_id: 'p_123',
  partner_merchant_id: 'pm_123abc',
  postal_code: merchantPostFactory.build().postal_code,
  quickbooks_imported_at: undefined,
  quickbooks_realm_id: undefined,
  quickbooks_state: QuickBooksState.notConnected,
  selected_bank_account: undefined,
  selected_insights_bank_accounts: [],
  selected_insights_bank_accounts_details: [],
  selected_sales_volume_account_details: undefined,
  selected_sales_volume_accounts: [],
  state_province: merchantPostFactory.build().state_province,
  total_remaining_payment_amount: 0,
  total_remaining_repayment_amount: 0,
  delinquent: false,
  marketing_qualified_lead: true
});


/**
 * This factory feeds from merchantDataFactory and update only 3 attributes:
 *  - It adds a business number (= `business_num`)
 *  - It adds a jurisdiction (= `incorporated_in`)
 *  - It edits the `name`
 */
export const merchantPutFactory = Factory.Sync.makeFactory<MerchantPut>({
  id: merchantDataFactory.build().id,
  business_num: '29923235477',  // Updated
  doing_business_as: 'Thario',  // Updated
  incorporated_in: Province.ON, // Updated // Jurisdiction.ON, // TODO [Val] Type Annotation
  name: merchantDataFactory.build().name,

  address_line_1: `${merchantDataFactory.build().address_line_1} ${merchantDataFactory.build().address_line_2}`,
  // address_line_2: undefined, // If there is an address_line_2, the AddressFormComponent appends it with address_line_1
  city: merchantDataFactory.build().city,
  country: merchantDataFactory.build().country,
  postal_code: merchantDataFactory.build().postal_code,
  state_province: merchantDataFactory.build().state_province as Province, // TODO [Val] Could I get rid of the type casting ?
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// merchant GET
/** @deprecated Prefer factories instead. */
export const passedIdentityAuthenticatedMerchant = merchantDataFactory.build({ kyc_verified: kycVerifiedPass });

// merchant POST
/** @deprecated Prefer factories instead. */
export const merchantPost = merchantPostFactory.build();

// merchant with QuickBooks data
/** @deprecated Prefer factories instead. */
export const merchantWithQuickBooksRealmID = merchantDataFactory.build({
  quickbooks_realm_id: 'TEST_REALM_ID'
});
/** @deprecated Prefer factories instead. */
export const merchantWithQuickBooksImportData = merchantDataFactory.build({
  quickbooks_imported_at: new Date().toUTCString()
});

export const merchantDataResponseFactory = Factory.Sync.makeFactory<ZttResponse<Merchant>>({
  data: merchantDataFactory.build(),
  status: 'SUCCESS',
  message: 'Loaded',
});

// merchant PUT
// merchant with bank account threshold set
export const merchantPutWithOptional = merchantPutFactory.build({
  desired_bank_account_balance: 9876.54
});
