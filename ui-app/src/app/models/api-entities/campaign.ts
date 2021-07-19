// TODO: Check the entire project and expand the use of these interface to every component that should use it.

import { Currency } from './utility';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  partner_id: string;
  product_type: ProductType;
  total_capital: number;
  currency: Currency;
  start_date: string;        // TODO: Implement/Use unified date type across all existing & new models.
  end_date: string;          //       "                    "                    "                    "
  max_merchants: number;
  min_amount: number;
  max_amount: number;
  remittance_rates: Array<number>;
  state: CampaignState;
  terms_template: string;
}

export enum CampaignState {
  pending = 'pending',
  active = 'active'
}

export enum ProductType {
  WCA = 'WCA',
  UBL = 'UBL'
}
