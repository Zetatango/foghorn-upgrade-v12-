import { BusinessPartnerMerchant } from './api-entities/business-partner-customer-summary';
import { Invoice } from './api-entities/invoice';
import { Transaction } from './api-entities/transaction';

export enum ExpandableListStatus {
  VIEW,
  EDIT
}

export interface ExpandableListItem {
  data: ExpandableListItemDataType;
  isOpen: boolean;
  isSelected: boolean;
}

export enum ExpandableListItemStatus {
  OPEN,
  CLOSED
}

export type ExpandableListItemDataType = BusinessPartnerMerchant | Invoice | Transaction;
