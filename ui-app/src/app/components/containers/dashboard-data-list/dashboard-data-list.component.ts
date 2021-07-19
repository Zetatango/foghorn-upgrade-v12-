import {Component, OnInit, Input, TemplateRef, ChangeDetectorRef, OnDestroy, HostBinding} from '@angular/core';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { takeUntil, take } from 'rxjs/operators';
import { BusinessPartnerCustomerSummary, AutoSendParams } from 'app/models/api-entities/business-partner-customer-summary';
import { ZttDataListConfig, ZttDataListReturnType, ZttDataListType, DEFAULT_LIST_LIMIT } from 'app/models/data-list-config';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { DatatablesRequestParameters } from 'app/models/api-entities/datatables-request-parameters';
import { ExpandableListStatus, ExpandableListItemDataType } from 'app/models/expandable-list';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { OrderDirection } from 'app/models/datatables';
import { InvoiceList } from 'app/models/api-entities/invoice-list';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { TransactionsService } from 'app/services/transactions.service';
import { TransactionList } from 'app/models/api-entities/transaction-list';
import { MerchantService } from 'app/services/merchant.service';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-dashboard-data-list',
  templateUrl: './dashboard-data-list.component.html'
})
export class DashboardDataListComponent implements OnInit, OnDestroy {
  @HostBinding('class') componentClass = 'ztt-dashboard-data-list';

  // INPUT/OUTPUT
  @Input() config: ZttDataListType;
  @Input() isSearchEnabled: boolean;
  @Input() editTemplate: TemplateRef<Element>;
  @Input() missingDataMessage: string;
  @Input() primaryTemplate: TemplateRef<Element>;
  @Input() secondaryTemplate: TemplateRef<Element>;

  merchantId: string;

  // STATE VARIABLES
  private _dataConfig: ZttDataListConfig;
  private _defaultLimit: number;
  private _disableScroll = false;
  private _listStatus = ExpandableListStatus.VIEW;

  // MAIN DATA VARIABLES
  private _data: ExpandableListItemDataType[] = [];
  private _offset = 0;

  // SEARCH DATA VARIABLES
  private _currentSearchValue: string = null;
  private _searchData: ExpandableListItemDataType[] = [];
  private _searchOffset = 0;

  unsubscribe$ = new Subject<void>();

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private borrowerInvoiceService: BorrowerInvoiceService,
    private merchantService: MerchantService,
    private ref: ChangeDetectorRef,
    private errorService: ErrorService,
    private transactionsService: TransactionsService,
    private bpms: BusinessPartnerMerchantService
  ) {}

  ngOnInit(): void {
    this._defaultLimit = DEFAULT_LIST_LIMIT;
    this.merchantId = this.merchantService.merchantId;
    this.setConfig(this.config);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  fetchData(searchTerm: string = null): void {
    if (!this.dataConfig || !this.dataConfig.get) {
      return;
    }

    const params: DatatablesRequestParameters = {
      filter: searchTerm ? searchTerm : '',
      limit: this.defaultLimit,
      offset: searchTerm ? this._searchOffset : this._offset,
      order_by: this.dataConfig.orderBy,
      order_direction: this.dataConfig.orderDirection
    };

    this.dataConfig.fetch(this.merchantId, params)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.loadData(searchTerm);
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);
        }
      );
  }

  getBorrowerInvoiceDataListConfig(): ZttDataListConfig {
    return {
      dataProperty: 'business_partner_invoices',
      orderBy: 'invoice_number',
      orderDirection: OrderDirection.ascending,
      fetch: (merchantId: string, params: DatatablesRequestParameters): Observable<ZttResponse<InvoiceList>> => {
        return this.borrowerInvoiceService.loadInvoices(merchantId, params);
      },
      get: (): BehaviorSubject<InvoiceList> => {
        return this.borrowerInvoiceService.getBorrowerInvoices();
      }
    };
  }

  getBorrowerTransactionHistoryDataListConfig(): ZttDataListConfig {
    return {
      dataProperty: 'transactions',
      orderBy: 'created_at',
      orderDirection: OrderDirection.descending,
      fetch: (merchantId: string, params: DatatablesRequestParameters): Observable<ZttResponse<TransactionList>> => {
        return this.transactionsService.loadTransactionList(params);
      },
      get: (): BehaviorSubject<TransactionList> => {
        return this.transactionsService.getTransactionList();
      }
    };
  }

  getCustomerDashboardDataListConfig(): ZttDataListConfig {
    return {
      dataProperty: 'business_partner_merchants',
      orderBy: 'name',
      orderDirection: OrderDirection.ascending,
      fetch: (merchantId: string, params: DatatablesRequestParameters): Observable<ZttResponse<BusinessPartnerCustomerSummary>> => {
        return this.businessPartnerService.getCustomerSummary(merchantId, params);
      },
      get: (): BehaviorSubject<BusinessPartnerCustomerSummary> => {
        return this.businessPartnerService.getBusinessPartnerCustomerSummary();
      },
      update: (merchantIds: string[], autoSend: boolean): Observable<ZttResponse<void>> => {
        return this.bpms.subscribeToAutoSend(merchantIds, autoSend);
      }
    };
  }

  getInvoiceDashboardDataListConfig(): ZttDataListConfig {
    return {
      dataProperty: 'business_partner_invoices',
      orderBy: 'account_number',
      orderDirection: OrderDirection.ascending,
      fetch: (merchantId: string, params: DatatablesRequestParameters): Observable<ZttResponse<InvoiceList>> => {
        return this.businessPartnerService.getSentInvoices(merchantId, params);
      },
      get: (): BehaviorSubject<InvoiceList> => {
        return this.businessPartnerService.getBusinessPartnerSentInvoices();
      }
    };
  }

  onReceiveNextEvent(isSearch?: boolean): void {
    const isMoreDataToLoad = isSearch ? this.isMoreSearchDataToLoad : this.isMoreDataToLoad;
    if (!isMoreDataToLoad) {
      return;
    }

    if (isSearch) {
      this._searchOffset += this.defaultLimit;
    } else {
      this._offset += this.defaultLimit;
    }

    this.fetchData(this.currentSearchValue);
  }

  onReceiveSearchChangeEvent(searchValue: string): void {
    this._currentSearchValue = searchValue;
    if (searchValue) {
      this.setSearchList(true);
      this.fetchData(searchValue);
    }
  }

  onToggleEditEvent(): void {
    this.listStatus = this.listStatus === ExpandableListStatus.VIEW ? ExpandableListStatus.EDIT : ExpandableListStatus.VIEW;
  }

  onFinishEditEvent(autoSendParams: AutoSendParams): void {
    // TODO: Make parameters more generic/union type to allow for variance
    if (!this.dataConfig.update) {
      return;
    }

    this.dataConfig.update(autoSendParams.business_partner_merchants_ids, autoSendParams.auto_send)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.refreshData();
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.subscribeToAutoSend);
        }
      );
  }


  private loadData(searchTerm?: string): void {
    this.dataConfig.get()
      .pipe(take(1))
      .subscribe((results: ZttDataListReturnType) => {
        if (results && results[this.dataConfig.dataProperty]) {
          const data = results[this.dataConfig.dataProperty];
          if (searchTerm) {
            this._searchData = this._searchData.concat(data);
          } else {
            this.data = this.data.concat(data);
          }
        }
      });
  }

  private refreshData(): void {
    this.setList();
    this.fetchData();
  }

  private setConfig(datalistType: ZttDataListType): void {
    let config: ZttDataListConfig = null;
    if (datalistType === ZttDataListType.BP_INVOICES) {
      config = this.getInvoiceDashboardDataListConfig();
    } else if (datalistType === ZttDataListType.BP_CUSTOMERS) {
      config = this.getCustomerDashboardDataListConfig();
    } else if (datalistType === ZttDataListType.BORROWER_INVOICES) {
      config = this.getBorrowerInvoiceDataListConfig();
    } else if (datalistType === ZttDataListType.BORROWER_TRANSACTION_HISTORY) {
      config = this.getBorrowerTransactionHistoryDataListConfig();
    } else {
      Bugsnag.notify(new ErrorMessage(`Invalid config used`));
    }

    this.dataConfig = config;
  }

  private setList(): void {
    this._offset = 0;
    this.data = [];
  }

  private setSearchList(resetSearchView?: boolean): void {
    if (resetSearchView) {
      this._disableScroll = true;
      this.ref.detectChanges();
      this._disableScroll = false;
      this.ref.detectChanges();
    } else {
      this._currentSearchValue = '';
    }
    this._searchOffset = 0;
    this._searchData = [];
  }

  get data(): ExpandableListItemDataType[] {
    return this._data;
  }

  set data(value: ExpandableListItemDataType[]) {
    this._data = value;
  }

  get dataConfig(): ZttDataListConfig {
    return this._dataConfig;
  }

  set dataConfig(value: ZttDataListConfig) {
    this._dataConfig = value;
    this.setList();
    this.setSearchList();
    this.fetchData();
  }

  get defaultLimit(): number {
    return this._defaultLimit;
  }

  get disableScroll(): boolean {
    return this._disableScroll;
  }

  private get isMoreDataToLoad(): boolean {
    return this.data.length === (this.offset + this.defaultLimit);
  }

  private get isMoreSearchDataToLoad(): boolean {
    return this.searchData.length === (this.searchOffset + this.defaultLimit);
  }

  get isEditing(): boolean {
    return this.listStatus === ExpandableListStatus.EDIT;
  }

  get listStatus(): ExpandableListStatus {
    return this._listStatus;
  }

  set listStatus(value: ExpandableListStatus) {
    this._listStatus = value;
  }

  get offset(): number {
    return this._offset;
  }

  // SEARCH DATA VARIABLES
  get currentSearchValue(): string {
    return this._currentSearchValue;
  }

  get searchData(): ExpandableListItemDataType[] {
    return this._searchData;
  }

  set searchData(value: ExpandableListItemDataType[]) {
    this._searchData = value;
  }

  get searchOffset(): number {
    return this._searchOffset;
  }
}
