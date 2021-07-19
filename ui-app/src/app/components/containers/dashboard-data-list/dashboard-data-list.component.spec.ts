import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { VALID_DATALIST_CONFIGS, ZttDataListType, INVALID_DATALIST_CONFIGS, DEFAULT_LIST_LIMIT } from 'app/models/data-list-config';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DashboardDataListComponent } from './dashboard-data-list.component';
import { ErrorService } from 'app/services/error.service';
import { ExpandableListStatus } from 'app/models/expandable-list';
import { businessPartnerCustomerSummary, businessPartnerCustomerSummaryFactory, businessPartnerCustomerSummaryResponseFactory } from 'app/test-stubs/factories/business-partner';
import { OrderDirection } from 'app/models/datatables';
import { defaultCustomerSummaryRequestParams } from 'app/test-stubs/factories/datatables';
import { take } from 'rxjs/operators';
import { receivedBorrowerInvoices, invoiceResponseFactory, invoiceListFactory, invoiceListResponseFactory } from 'app/test-stubs/factories/invoice';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { TransactionsService } from 'app/services/transactions.service';
import { receivedTransactionListFactory, receivedTransactionListResponseFactory } from 'app/test-stubs/factories/transaction';
import { TransactionList } from 'app/models/api-entities/transaction-list';
import { MerchantService } from 'app/services/merchant.service';
import { badRequestFactory, internalServerErrorFactory, voidResponseFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';

describe('DashboardDataListComponent', () => {
  let component: DashboardDataListComponent;
  let fixture: ComponentFixture<DashboardDataListComponent>;

  let borrowerInvoiceService: BorrowerInvoiceService;
  let businessPartnerMerchantService: BusinessPartnerMerchantService;
  let businessPartnerService: BusinessPartnerService;
  let transactionsService: TransactionsService;

  let spyOnBehaviorSubject: jasmine.Spy;
  let spyOnObserver: jasmine.Spy;
  let spyOnUpdateObserver: jasmine.Spy;

  const EMPTY_STRING = '';
  const NEW_SEARCH_VALUE = 'something';
  const merchantId = '1';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardDataListComponent ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        BorrowerInvoiceService,
        BusinessPartnerService,
        BusinessPartnerMerchantService,
        ChangeDetectorRef,
        CookieService,
        ErrorService,
        LoggingService,
        MerchantService,
        TransactionsService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardDataListComponent);
    component = fixture.componentInstance;

    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);
    businessPartnerMerchantService = TestBed.inject(BusinessPartnerMerchantService);
    businessPartnerService = TestBed.inject(BusinessPartnerService);
    transactionsService = TestBed.inject(TransactionsService);

    component.config = ZttDataListType.BP_CUSTOMERS;
    component.ngOnInit();

    spyOn(businessPartnerMerchantService, 'subscribeToAutoSend').and.returnValue(of(voidResponseFactory.build()));
    spyOnObserver = spyOn(component.dataConfig, 'fetch').and.returnValue(of(businessPartnerCustomerSummaryResponseFactory.build()));
    spyOnBehaviorSubject = spyOn(component.dataConfig, 'get').and.returnValue(new BehaviorSubject(businessPartnerCustomerSummary));
    spyOnUpdateObserver = spyOn(component.dataConfig, 'update').and.returnValue(of(businessPartnerCustomerSummaryResponseFactory.build()));

    spyOn(Bugsnag, 'notify');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should set values to expected values', () => {
      expect(component.data.length).toBe(0);
      expect(component.dataConfig).toBeDefined();
      expect(component.defaultLimit).toBe(DEFAULT_LIST_LIMIT);
      expect(component.listStatus).toBe(ExpandableListStatus.VIEW);
    });
  });

  describe('Configuration', () => {
    it('should check that valid settings are set based on current valid configs', () => {
      VALID_DATALIST_CONFIGS.forEach((config: ZttDataListType) => {
        component.config = config;
        component.ngOnInit();

        expect(component.dataConfig.fetch).toBeDefined();
        expect(component.dataConfig.get).toBeDefined();
        expect(component.dataConfig.dataProperty).toBeDefined();
      });
    });

    it('should set config to null if invalid config is used', () => {
      INVALID_DATALIST_CONFIGS.forEach((config: ZttDataListType) => {
        component.config = config;
        component.ngOnInit();

        expect(component.dataConfig).toBeNull();
      });
      expect(Bugsnag.notify).toHaveBeenCalledTimes(INVALID_DATALIST_CONFIGS.length);
    });

    it('should not attempt to make API call if config is not set', () => {
      component.config = null;
      component.ngOnInit();

      expect(spyOnObserver).toHaveBeenCalledTimes(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from and complete observable', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('onReceiveSearchChangeEvent', () => {
    it('should attempt to get and set data using search term', () => {
      component.onReceiveSearchChangeEvent(NEW_SEARCH_VALUE);

      expect(component.currentSearchValue).toBe(NEW_SEARCH_VALUE);
      expect(component.searchOffset).toBe(0);
      expect(component.searchData.length).toBe(businessPartnerCustomerSummary.business_partner_merchants.length);
      expect(spyOnBehaviorSubject).toHaveBeenCalledTimes(1);
    });

    it('should NOT attempt to retrieve data if no search value was provided(user likely erased search field)', () => {
      component.onReceiveSearchChangeEvent(EMPTY_STRING);

      expect(component.currentSearchValue).toBe(EMPTY_STRING);
      expect(spyOnBehaviorSubject).toHaveBeenCalledTimes(0);
    });

    it('should NOT set search data when invalid response is returned(data is null)', () => {
      spyOnBehaviorSubject.and.returnValue(new BehaviorSubject(null));
      component.onReceiveSearchChangeEvent(NEW_SEARCH_VALUE);

      expect(component.currentSearchValue).toBe(NEW_SEARCH_VALUE);
      expect(component.searchOffset).toBe(0);
      expect(component.searchData.length).toBe(0);
      expect(spyOnBehaviorSubject).toHaveBeenCalledTimes(1);
    });

    it('should NOT set search data when invalid response is returned(data are null)', () => {
      const nullData = businessPartnerCustomerSummaryFactory.build({ business_partner_merchants: null });
      spyOnBehaviorSubject.and.returnValue(new BehaviorSubject(nullData));
      component.onReceiveSearchChangeEvent(NEW_SEARCH_VALUE);

      expect(component.currentSearchValue).toBe(NEW_SEARCH_VALUE);
      expect(component.searchOffset).toBe(0);
      expect(component.searchData.length).toBe(0);
      expect(spyOnBehaviorSubject).toHaveBeenCalledTimes(1);
    });
  });

  describe('onReceiveNextEvent', () => {
    beforeEach(() => {
      spyOn(component, 'fetchData').and.callThrough();
    });

    it('should update search results when it receives a search "next" event', () => {
      spyOnProperty(component, 'currentSearchValue').and.returnValue(NEW_SEARCH_VALUE);
      const startingSearchOffset = component.searchOffset;
      component.searchData = invoiceResponseFactory.buildList(component.defaultLimit);
      component.onReceiveNextEvent(true);

      expect(component.fetchData).toHaveBeenCalledTimes(1);
      expect(component.searchOffset).toBe(startingSearchOffset + component.defaultLimit);
      expect(component.searchData.length).toBe(component.defaultLimit + businessPartnerCustomerSummary.business_partner_merchants.length);
    });

    it('should update results when it receives a non-search "next" event', () => {
      const startingOffset = component.offset;
      component.data = invoiceResponseFactory.buildList(component.defaultLimit);
      component.onReceiveNextEvent();

      expect(component.fetchData).toHaveBeenCalledTimes(1);
      expect(component.offset).toBe(startingOffset + component.defaultLimit);
      expect(component.data.length).toBe(component.defaultLimit + businessPartnerCustomerSummary.business_partner_merchants.length);
    });

    it('should not attempt to update search results when current search data is not at max of limit', () => {
      spyOnProperty(component, 'currentSearchValue').and.returnValue(NEW_SEARCH_VALUE);
      const startingSearchOffset = component.searchOffset;
      component.searchData = [];
      component.onReceiveNextEvent(true);

      expect(component.fetchData).not.toHaveBeenCalled();
      expect(component.searchOffset).toBe(startingSearchOffset);
      expect(component.searchData.length).toBe(0);
    });

    it('should not attempt to update results when current data is not at max of limit', () => {
      const startingOffset = component.offset;
      component.data = [];
      component.onReceiveNextEvent();

      expect(component.fetchData).not.toHaveBeenCalled();
      expect(component.offset).toBe(startingOffset);
      expect(component.data.length).toBe(0);
    });
  });

  describe('Error states', () => {
    const error = badRequestFactory.build();
    beforeEach(() => {
      spyOnObserver.and.returnValue(throwError(error));
    });

    it('should trigger a bugsnag if API call returns an error', () => {
      component.onReceiveSearchChangeEvent(NEW_SEARCH_VALUE);

      expect(component.currentSearchValue).toBe(NEW_SEARCH_VALUE);
      expect(component.searchOffset).toBe(0);
      expect(component.searchData.length).toBe(0);
      expect(spyOnObserver).toHaveBeenCalledTimes(1);
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('onToggleEditEvent()', () => {
    it('should toggle between VIEW and EDIT mode when event is received', () => {
      component.listStatus = null;
      component.onToggleEditEvent();
      expect(component.listStatus).toBe(ExpandableListStatus.VIEW);

      component.onToggleEditEvent();
      expect(component.listStatus).toBe(ExpandableListStatus.EDIT);

      component.onToggleEditEvent();
      expect(component.listStatus).toBe(ExpandableListStatus.VIEW);
    });
  });

  describe('onFinishEditEvent()', () => {
    it('should call dataConfig.update and then get first page of data from API', () => {
      component.onFinishEditEvent({ business_partner_merchants_ids: [], auto_send: true });

      expect(component.dataConfig.update).toHaveBeenCalled();
      expect(component.dataConfig.fetch).toHaveBeenCalled();
      expect(component.dataConfig.get).toHaveBeenCalled();
      expect(component.offset).toBe(0);
      expect(component.data.length).toBe(businessPartnerCustomerSummary.business_partner_merchants.length);
    });

    it('should call dataConfig.update and trigger bugsnag when an error occurs', () => {
      const error = internalServerErrorFactory.build();
      spyOnUpdateObserver.and.returnValue(throwError(error));
      component.onFinishEditEvent({business_partner_merchants_ids: [], auto_send: true});

      expect(component.dataConfig.update).toHaveBeenCalled();
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(component.dataConfig.fetch).not.toHaveBeenCalled();
      expect(component.dataConfig.get).not.toHaveBeenCalled();
    });

    it('should not attempt to call dataConfig.update if it is falsy', () => {
      component.dataConfig.update = undefined;
      component.onFinishEditEvent({ business_partner_merchants_ids: [], auto_send: true });

      expect(component.dataConfig.fetch).not.toHaveBeenCalled();
      expect(component.dataConfig.get).not.toHaveBeenCalled();
    });
  });

  describe('getCustomerDashboardDataListConfig', () => {
    const customerResponse = businessPartnerCustomerSummaryResponseFactory.build();
    const customerData = new BehaviorSubject(businessPartnerCustomerSummary);

    beforeEach(() => {
      spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(of(customerResponse));
      spyOn(businessPartnerService, 'getBusinessPartnerCustomerSummary').and.returnValue(customerData);
      component.dataConfig = component.getCustomerDashboardDataListConfig();
    });

    it('should return config for customers tab', () => {
      expect(component.dataConfig.fetch).toBeDefined();
      expect(component.dataConfig.get).toBeDefined();
      expect(component.dataConfig.dataProperty).toBe('business_partner_merchants');
      expect(component.dataConfig.orderBy).toBe('name');
      expect(component.dataConfig.orderDirection).toBe(OrderDirection.ascending);
    });

    it('should use correct business partner services for service', () => {
      component.dataConfig.fetch(merchantId, defaultCustomerSummaryRequestParams)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(customerResponse),
          (err) => fail(`Unexpected error: ${err}`)
        );
    });

    it('should use correct business partner services for subscriptionService', () => {
      component.dataConfig.get()
        .pipe(take(1))
        .subscribe((res) => expect(res).toEqual(businessPartnerCustomerSummary));
    });

    it('should use correct business partner merchant services for update', () => {
      component.dataConfig.update(['1'], true)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toBeTruthy(),
          (err) => fail(`Unexpected error: ${err}`)
        );
    });
  });

  describe('getInvoiceDashboardDataListConfig', () => {
    const invResponse = invoiceListResponseFactory.build();
    const invoiceData = new BehaviorSubject(invoiceListFactory.build());

    beforeEach(() => {
      spyOn(businessPartnerService, 'getSentInvoices').and.returnValue(of(invResponse));
      spyOn(businessPartnerService, 'getBusinessPartnerSentInvoices').and.returnValue(invoiceData);
      component.dataConfig = component.getInvoiceDashboardDataListConfig();
    });

    it('should return config for invoices tab', () => {
      expect(component.dataConfig.fetch).toBeDefined();
      expect(component.dataConfig.get).toBeDefined();
      expect(component.dataConfig.dataProperty).toBe('business_partner_invoices');
      expect(component.dataConfig.orderBy).toBe('account_number');
      expect(component.dataConfig.orderDirection).toBe(OrderDirection.ascending);
    });

    it('should use correct business partner services for service', () => {
      component.dataConfig.fetch(merchantId, defaultCustomerSummaryRequestParams)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(invResponse),
          (err) => fail(`Unexpected error: ${err}`)
        );
    });

    it('should use correct business partner services for subscriptionService', () => {
      component.dataConfig.get()
        .pipe(take(1))
        .subscribe((res) => expect(res).toEqual(receivedBorrowerInvoices));
    });
  });

  describe('getBorrowerInvoiceDataListConfig', () => {
    const borrowerInvoiceResponse = invoiceListResponseFactory.build();
    const borrowerInvoiceData = invoiceListFactory.build();

    beforeEach(() => {
      spyOn(borrowerInvoiceService, 'loadInvoices').and.returnValue(of(borrowerInvoiceResponse));
      spyOn(borrowerInvoiceService, 'getBorrowerInvoices').and.returnValue(new BehaviorSubject(borrowerInvoiceData));
      component.dataConfig = component.getBorrowerInvoiceDataListConfig();
    });

    it('should return config for invoices tab', () => {
      expect(component.dataConfig.fetch).toBeDefined();
      expect(component.dataConfig.get).toBeDefined();
      expect(component.dataConfig.dataProperty).toBe('business_partner_invoices');
      expect(component.dataConfig.orderBy).toBe('invoice_number');
      expect(component.dataConfig.orderDirection).toBe(OrderDirection.ascending);
    });

    it('should use correct business partner services for service', () => {
      component.dataConfig.fetch(merchantId, defaultCustomerSummaryRequestParams)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(borrowerInvoiceResponse),
          (err) => fail(`Unexpected error: ${err}`)
        );
    });

    it('should use correct business partner services for subscriptionService', () => {
      component.dataConfig.get()
        .pipe(take(1))
        .subscribe((res) => expect(res).toEqual(borrowerInvoiceData));
    });
  });

  describe('getBorrowerTransactionHistoryDataListConfig', () => {
    const transactionResponse = receivedTransactionListResponseFactory.build();

    beforeEach(() => {
      spyOn(transactionsService, 'loadTransactionList').and.returnValue(of(transactionResponse));
      spyOn(transactionsService, 'getTransactionList').and.returnValue(new BehaviorSubject<TransactionList>(receivedTransactionListFactory.build()));
      component.dataConfig = component.getBorrowerTransactionHistoryDataListConfig();
    });

    it('should return config for invoices tab', () => {
      expect(component.dataConfig.fetch).toBeDefined();
      expect(component.dataConfig.get).toBeDefined();
      expect(component.dataConfig.dataProperty).toBe('transactions');
      expect(component.dataConfig.orderBy).toBe('created_at');
      expect(component.dataConfig.orderDirection).toBe(OrderDirection.descending);
    });

    it('should use correct business partner services for service', () => {
      component.dataConfig.fetch(merchantId, defaultCustomerSummaryRequestParams)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(transactionResponse),
          (err) => fail(`Unexpected error: ${err}`)
        );
    });

    it('should use correct business partner services for subscriptionService', () => {
      component.dataConfig.get()
        .pipe(take(1))
        .subscribe((res) => expect(res).toEqual(receivedTransactionListFactory.build()));
    });
  });
});
