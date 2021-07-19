import * as Factory from 'factory.ts';

import { BusinessPartnerApplication, BusinessPartnerApplicationState } from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerBranding } from 'app/models/api-entities/business-partner-branding';
import { BusinessPartnerCustomerSummary } from 'app/models/api-entities/business-partner-customer-summary';
import { TrackedObject } from 'app/models/api-entities/tracked-object';
import { OrderDirection } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { merchantDataFactory } from './merchant';
import { ZttResponse } from 'app/models/api-entities/response';

export const businessPartnerApplicationFactory = Factory.Sync.makeFactory<BusinessPartnerApplication>({
  id: 'bpap_987zyx',
  merchant_id: merchantDataFactory.build().id,
  partner_theme_id: '',
  state: BusinessPartnerApplicationState.pending,
  terms: 'Terms and conditions',
  vanity: 'hellokitty'
});

export const businessPartnerCustomerSummaryFactory = Factory.Sync.makeFactory<BusinessPartnerCustomerSummary>({
  business_partner_merchants: [
    {
      email: 'test@merchant.com',
      id: 'bpm_123456',
      last_event: TrackedObjectState.invited,
      last_event_at: Date.now().toString(),
      linked_merchants: [],
      name: 'Test Merchant',
      tracked_object_id: 'obj_098765',
      sign_up_name: 'Test Merchant',
      sign_up_email: 'test@merchant.com',
      auto_send: false,
      quickbooks_customer_id: ''
    },
    {
      email: 'test2@merchant.com',
      id: 'bpm_654321',
      last_event: TrackedObjectState.invited,
      last_event_at: Date.now().toString(),
      linked_merchants: [],
      name: 'Test Merchant 2',
      tracked_object_id: 'obj_567890',
      sign_up_name: 'Test Merchant 2',
      sign_up_email: 'test2@merchant.com',
      auto_send: false,
      quickbooks_customer_id: ''
    }
  ],
  filtered_count: 1,
  limit: 10,
  offset: 0,
  order_by: 'col1',
  order_direction: OrderDirection.ascending,
  total_count: 1
});

export const trackedObjectHistoryFactory = Factory.Sync.makeFactory<TrackedObject>({
  limit: 10,
  offset: 0,
  tracked_object_events: [
    {
      created_at: Date.now().toString(),
      event: TrackedObjectState.invited
    }
  ],
  total_count: 1,
  filtered_count: 1,
  order_by: 'col1',
  order_direction: OrderDirection.ascending
});

export const businessPartnerBrandingFactory = Factory.Sync.makeFactory<BusinessPartnerBranding>({
  id: 'theme_abc123',
  vanity: 'piedpiper',
  primary_colour: '#000000',
  secondary_colour: '#FFFFFF',
  logo: 'data:image/png;base64,iVBORw0KGgoAAAA=',
});

export const businessPartnerBrandingResponseFactory = Factory.Sync.makeFactory<ZttResponse<BusinessPartnerBranding>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: businessPartnerBrandingFactory.build()
});

export const businessPartnerApplicationResponseFactory = Factory.Sync.makeFactory<ZttResponse<BusinessPartnerApplication>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: businessPartnerApplicationFactory.build()
});

export const businessPartnerCustomerSummaryResponseFactory = Factory.Sync.makeFactory<ZttResponse<BusinessPartnerCustomerSummary>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: businessPartnerCustomerSummaryFactory.build()
});

export const trackedObjectHistoryResponseFactory = Factory.Sync.makeFactory<ZttResponse<TrackedObject>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: trackedObjectHistoryFactory.build()
});
/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const businessPartnerApplication: BusinessPartnerApplication = businessPartnerApplicationFactory.build();
/** @deprecated Prefer factories instead. */
export const businessPartnerApplicationKycVerifying: BusinessPartnerApplication = businessPartnerApplicationFactory.build({
    state: BusinessPartnerApplicationState.kyc_verifying
});
/** @deprecated Prefer factories instead. */
export const businessPartnerApplicationComplete: BusinessPartnerApplication = businessPartnerApplicationFactory.build({
    state: BusinessPartnerApplicationState.complete
});

/** @deprecated Prefer factories instead. */
export const businessPartnerCustomerSummary: BusinessPartnerCustomerSummary = businessPartnerCustomerSummaryFactory.build();

/** @deprecated Prefer factories instead. */
export const trackedObjectHistory: TrackedObject = trackedObjectHistoryFactory.build();
