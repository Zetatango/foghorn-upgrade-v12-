import { BehaviorSubject, Observable } from 'rxjs';
import { BusinessPartnerCustomerSummary } from './api-entities/business-partner-customer-summary';
import { DatatablesRequestParameters } from './api-entities/datatables-request-parameters';
import { InvoiceList } from './api-entities/invoice-list';
import { ZttResponse } from './api-entities/response';
import { TransactionList } from './api-entities/transaction-list';
import { OrderDirection } from './datatables';

export interface ZttDataListConfig {
  dataProperty: string;
  orderBy: string;
  orderDirection: OrderDirection;
  fetch: (merchantId: string, params: DatatablesRequestParameters) =>
    Observable<ZttResponse<InvoiceList | BusinessPartnerCustomerSummary | TransactionList>>;
  get: () => BehaviorSubject<InvoiceList | BusinessPartnerCustomerSummary | TransactionList>;
  update?: (merchantIds: string[], autoSend: boolean) => Observable<any>;  // eslint-disable-line
}

export enum ZttDataListType {
  BORROWER_INVOICES,
  BORROWER_TRANSACTION_HISTORY,
  BP_CUSTOMERS,
  BP_INVOICES
}

export type ZttDataListReturnType = InvoiceList | BusinessPartnerCustomerSummary | TransactionList;

export const VALID_DATALIST_CONFIGS = [
  ZttDataListType.BORROWER_INVOICES,
  ZttDataListType.BORROWER_TRANSACTION_HISTORY,
  ZttDataListType.BP_CUSTOMERS,
  ZttDataListType.BP_INVOICES
];

export const INVALID_DATALIST_CONFIGS = [null, undefined];

export const DEFAULT_LIST_LIMIT = 25;

export enum ZttButtons {
  edit = 'AUTO_SEND.BUTTON_EDIT',
  cancel = 'AUTO_SEND.BUTTON_CANCEL',
  selectAll = 'AUTO_SEND.BUTTON_SELECT_ALL',
  unselectAll = 'AUTO_SEND.BUTTON_UNSELECT_ALL',
  subscribe = 'AUTO_SEND.BUTTON_SUBSCRIBE',
  unsubscribe = 'AUTO_SEND.BUTTON_UNSUBSCRIBE'
}
