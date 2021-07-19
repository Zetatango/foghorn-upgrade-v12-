import { OrderDirection } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { KycCheckStatus } from './merchant';
import { SmallBusinessGrade } from './offer';

export interface BusinessPartnerCustomerSummary {
  business_partner_merchants: BusinessPartnerMerchant[];
  filtered_count: number;
  limit: number;
  offset: number;
  order_by: string;
  order_direction: OrderDirection;
  total_count: number;
}

export interface BusinessPartnerMerchant {
  email: string;
  id: string;
  last_event: TrackedObjectState;
  last_event_at: string;
  linked_merchants: LinkedMerchant[];
  name: string;
  tracked_object_id: string;
  sign_up_name: string;
  sign_up_email: string;
  auto_send: boolean;
  quickbooks_customer_id: string;
}

export interface LinkedMerchant {
  id: string;
  kyc_verified_state: KycCheckStatus;
  small_business_grade: SmallBusinessGrade;
  available_amount: number;
  paf_opt_in: boolean;
}

export interface AutoSendParams {
  auto_send: boolean;
  business_partner_merchants_ids: string[];
}
