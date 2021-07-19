import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UiAlertStatus } from 'app/models/ui-alerts';

import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';
import { PositioningService } from 'ngx-bootstrap/positioning';
import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { BusinessPartnerDashboardComponent } from './business-partner-dashboard.component';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerCustomerSummary } from 'app/models/api-entities/business-partner-customer-summary';
import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { InvoiceList } from 'app/models/api-entities/invoice-list';
import { UpdateProfileEventRequestType } from 'app/models/api-entities/update-profile-event';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { FileStorageService } from 'app/services/file-storage.service';
import { LoadingService } from 'app/services/loading.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { userSessionFactory } from 'app/test-stubs/factories/user-session';
import { applicationConfiguration } from 'app/test-stubs/factories/application-configuration';
import { businessPartnerApplication, businessPartnerCustomerSummary } from 'app/test-stubs/factories/business-partner';
import { businessPartnerProfileFactory, emptyBusinessPartnerProfile } from 'app/test-stubs/factories/business-partner-profile';
import { invoiceResponse, receivedBorrowerInvoices } from 'app/test-stubs/factories/invoice';
import { merchantWithQuickBooksRealmID, merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { QuickbooksService } from 'app/services/quickbooks.service';
import { uiAlertFactory } from 'app/test-stubs/factories/ui-alerts';
import { inviteParamsFactory } from 'app/test-stubs/factories/invite-params';
import { datatableParamsFactory, DEFAULT_DATATABLES_PARAMS } from 'app/test-stubs/factories/datatable-params';
import {
  omniauthFailedFlowResponse,
  omniauthFlowResponseFactory,
  quickbooksRealmIDChangedErrorResponse
} from 'app/test-stubs/factories/omniauth-flow-response';
import { Merchant } from 'app/models/api-entities/merchant';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { LocalizeDatePipe } from 'app/pipes/localize-date.pipe';
import Bugsnag from '@bugsnag/js';

describe('BusinessPartnerDashboardComponent', () => {
  let component: BusinessPartnerDashboardComponent;
  let fixture: ComponentFixture<BusinessPartnerDashboardComponent>;
  let bsModalService: BsModalService;
  let businessPartnerService: BusinessPartnerService;
  let configurationService: ConfigurationService;
  let loadingService: LoadingService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let quickbooksService: QuickbooksService;
  let userService: UserSessionService;

  let modalRefSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerDashboardComponent,
        LocalizeDatePipe
      ],
      imports: [
        HttpClientTestingModule,
        ModalModule.forRoot(),
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BsModalService,
        BusinessPartnerService,
        BusinessPartnerMerchantService,
        ComponentLoaderFactory,
        ConfigurationService,
        CookieService,
        ErrorService,
        FileStorageService,
        LoadingService,
        LoggingService,
        MerchantService,
        PositioningService,
        UserSessionService,
        UtilityService,
        QuickbooksService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerDashboardComponent);
    component = fixture.componentInstance;
    bsModalService = TestBed.inject(BsModalService);
    businessPartnerService = TestBed.inject(BusinessPartnerService);
    configurationService = TestBed.inject(ConfigurationService);
    loadingService = TestBed.inject(LoadingService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    quickbooksService = TestBed.inject(QuickbooksService);
    userService = TestBed.inject(UserSessionService);

    spyOn(Bugsnag, 'notify');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('main loader is set to default value from the LoadingService on create', () => {
    expect(component.mainLoader).toEqual(loadingService.getMainLoader());
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
    });

    it('should set the merchant property to the current merchant', () => {
      component.ngOnInit();

      expect(component.merchant).toEqual(merchantDataFactory.build());
    });

    it('should set loaded to true when initializing datatables', () => {
      component.ngOnInit();

      expect(component.loaded).toBeTruthy();
    });

    it('should set the current date', () => {
      expect(component.currentDate).not.toBeNull();
      expect(component.translateService).not.toBeNull();
    });

    it('should get the merchant\'s business partner profile', () => {
      spyOn(businessPartnerService, 'getProfile').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerProfile').and.returnValue(new BehaviorSubject<BusinessPartnerProfile>(emptyBusinessPartnerProfile));

      component.ngOnInit();

      expect(businessPartnerService.getProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id);
      expect(component.businessPartnerProfile).toEqual(emptyBusinessPartnerProfile);
    });

    it('should set the business partner application on init', () => {
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
        new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplication));

      component.ngOnInit();

      expect(component.businessPartnerApplication).toEqual(businessPartnerApplication);
    });

    it('should trigger a bugsnag if attempt to fetch business partner application fails on init', () => {
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(throwError(null));

      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should trigger bugsnag if an error occurs while fetching the merchant\'s business partner profile', () => {
      spyOn(businessPartnerService, 'getProfile').and.returnValue(throwError(null));

      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();
      spyOn(quickbooksService, 'finishOmniauthFlow');
    });

    it('should trigger the completion of observables, and call QuickbookService finishAuthFlow', () => {
      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
      expect(quickbooksService.finishOmniauthFlow).toHaveBeenCalledOnceWith(OmniauthProviderConnectEvent.cancel);
    });
  });

  describe('receiveSendInviteEvent', () => {
    beforeEach(() => {
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());
      component.alerts = [];
      spyOn(component.alerts, 'push');
    });

    it('should call inviteBorrower in BusinessPartnerService if form is valid', () => {
      const alert = uiAlertFactory.build({ msg: 'INVITE.SUCCESS', timeout: 5000 });
      spyOn(businessPartnerService, 'inviteBorrower').and.returnValue(of(null));
      spyOn(component, 'getCustomerSummary');

      component.receiveSendInviteEvent(inviteParamsFactory.build());

      expect(businessPartnerService.inviteBorrower).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, 'test@user.com', 'test');
      expect(component.alerts.push).toHaveBeenCalledWith(alert);
      expect(component.getCustomerSummary).toHaveBeenCalledTimes(1);
      expect(component.inviting).toBeFalsy();
    });

    it('should trigger a bugsnag if send invite fails', () => {
      spyOn(businessPartnerService, 'inviteBorrower').and.returnValue(throwError(null));

      const inviteParams = inviteParamsFactory.build();
      component.receiveSendInviteEvent(inviteParams);

      expect(component.alerts.push).toHaveBeenCalledWith(uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'INVITE.ERROR', timeout: 5000 }));
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should refresh the business partner profile', () => {
      spyOn(businessPartnerService, 'getProfile').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerProfile').and.returnValue(
        new BehaviorSubject<BusinessPartnerProfile>(businessPartnerProfileFactory.build()));

      component.receiveSendInviteEvent(inviteParamsFactory.build());

      expect(businessPartnerService.getProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id);
    });

    it('should trigger bugsnag if profile refresh fails', () => {
      spyOn(businessPartnerService, 'getProfile').and.returnValue(throwError(internalServerErrorFactory.build()));

      component.receiveSendInviteEvent(inviteParamsFactory.build());

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('receiveSendInvoiceCompleteEvent', () => {
    beforeEach(() => {
      modalRefSpy = spyOnProperty(component, 'modalRef');
      modalRefSpy.and.returnValue(new BsModalRef());
      spyOn(component.modalRef, 'hide');
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());
      component.alerts = [];
      spyOn(component.alerts, 'push');
    });

    it('should close modal dialog', () => {
      const invoiceSuccessUIAlert = uiAlertFactory.build({ msg: 'INVOICE.SUCCESS', timeout: 5000 });
      modalRefSpy.and.returnValue(null);
      component.receiveSendInvoiceCompleteEvent();

      expect(component.alerts.push).toHaveBeenCalledOnceWith(invoiceSuccessUIAlert);
    });

    it('should get the updated list of invoices', () => {
      spyOn(businessPartnerService, 'getSentInvoices').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerSentInvoices').and.returnValue(
        new BehaviorSubject<InvoiceList>(receivedBorrowerInvoices));
      spyOnProperty(component, 'datatablesSentInvoicesRequestParams').and.returnValue({});

      component.receiveSendInvoiceCompleteEvent();

      expect(businessPartnerService.getSentInvoices).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, Object({}));
    });

    it('should get the updated customer summary list', () => {
      spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerCustomerSummary').and.returnValue(
        new BehaviorSubject<BusinessPartnerCustomerSummary>(businessPartnerCustomerSummary));
      spyOnProperty(component, 'datatablesCustomerSummaryRequestParams').and.returnValue({});

      component.receiveSendInvoiceCompleteEvent();

      expect(businessPartnerService.getCustomerSummary).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, Object({}));
    });

    it('should refresh the business partner profile', () => {
      spyOn(businessPartnerService, 'getProfile').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerProfile').and.returnValue(
        new BehaviorSubject<BusinessPartnerProfile>(businessPartnerProfileFactory.build()));

      component.receiveSendInvoiceCompleteEvent();

      expect(businessPartnerService.getProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id);
    });

    it('should trigger bugsnag if profile refresh fails', () => {
      spyOn(businessPartnerService, 'getProfile').and.returnValue(throwError(null));

      component.receiveSendInvoiceCompleteEvent();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('receiveCustomerSummaryEvent', () => {
    it('should not get customer summary if datatables params are not provided', () => {
      const emptyDatatableParams = datatableParamsFactory.build();
      spyOn(businessPartnerService, 'getCustomerSummary');
      spyOnProperty(component, 'datatablesCustomerSummaryRequestParams').and.returnValue(null);

      component.receiveCustomerSummaryEvent(emptyDatatableParams);

      expect(businessPartnerService.getCustomerSummary).toHaveBeenCalledTimes(0);
    });

    it('should get customer summary using previous datatables params', () => {
      const emptyDatatableParams = datatableParamsFactory.build();
      spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(of(null));
      spyOnProperty(component, 'datatablesCustomerSummaryRequestParams').and.returnValue({});
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveCustomerSummaryEvent(emptyDatatableParams);

      expect(businessPartnerService.getCustomerSummary).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, Object({}));
    });

    it('should get the customer summary', () => {
      const defaultDatatableParams = datatableParamsFactory.build({ dataTablesParameters: DEFAULT_DATATABLES_PARAMS });
      spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerCustomerSummary').and.returnValue(
        new BehaviorSubject<BusinessPartnerCustomerSummary>(businessPartnerCustomerSummary));
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveCustomerSummaryEvent(defaultDatatableParams);

      expect(component.businessPartnerMerchants).toEqual(businessPartnerCustomerSummary.business_partner_merchants);
    });

    it('should not get the customer summary if null', () => {
      const defaultDatatableParams = datatableParamsFactory.build({ dataTablesParameters: DEFAULT_DATATABLES_PARAMS });
      spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerCustomerSummary').and.returnValue(
        new BehaviorSubject<BusinessPartnerCustomerSummary>(null));
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveCustomerSummaryEvent(defaultDatatableParams);

      expect(component.businessPartnerMerchants).toBeUndefined();
    });

    it('should trigger a bugsnag if get customer summary fails', () => {
      const defaultDatatableParams = datatableParamsFactory.build({ dataTablesParameters: DEFAULT_DATATABLES_PARAMS });
      spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(throwError(null));
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveCustomerSummaryEvent(defaultDatatableParams);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('receiveCreateInvoiceEvent', () => {
    it('should open the create invoice modal dialog', () => {
      spyOn(bsModalService, 'show').and.returnValue(new BsModalRef());
      component.receiveCreateInvoiceEvent(businessPartnerCustomerSummary.business_partner_merchants[0]);

      expect(bsModalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).toBeDefined();
      expect(component.payor).toEqual(businessPartnerCustomerSummary.business_partner_merchants[0]);
    });
  });

  describe('receiveLoadTrackedCustomerHistoryEvent', () => {
    it('should open the tracked customer history modal', () => {
      spyOn(bsModalService, 'show').and.returnValue(new BsModalRef());
      component.receiveLoadTrackedCustomerHistoryEvent(businessPartnerCustomerSummary.business_partner_merchants[0]);

      expect(component.trackedBusinessPartnerMerchant).toEqual(businessPartnerCustomerSummary.business_partner_merchants[0]);
      expect(bsModalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).toBeDefined();
    });
  });

  describe('displayConnectToQuickBooks', () => {
    it('should return true when the quickbooks connect feature is enabled and customer is not connected', () => {
      spyOnProperty(configurationService, 'quickBooksConnectEnabled').and.returnValue(true);
      spyOn(merchantService, 'isQuickBooksConnected').and.returnValue(false);
      expect(component.displayConnectToQuickBooks).toBeTruthy();
    });

    it('should return false when the quickbooks connect feature is disabled', () => {
      spyOnProperty(configurationService, 'quickBooksConnectEnabled').and.returnValue(false);
      expect(component.displayConnectToQuickBooks).toBeFalsy();
    });

    it('should return false when merchant is connected to quickbooks', () => {
      spyOn(merchantService, 'isQuickBooksConnected').and.returnValue(true);
      expect(component.displayConnectToQuickBooks).toBeFalsy();
    });
  });

  describe('receiveHideModal', () => {
    beforeEach(() => {
      spyOn(bsModalService, 'show').and.returnValue(new BsModalRef());
      modalRefSpy = spyOnProperty(component, 'modalRef');
      modalRefSpy.and.returnValue(new BsModalRef());
    });

    it('should not hide dialog if it is not truthy', () => {
      spyOn(component.modalRef, 'hide');
      modalRefSpy.and.returnValue(null);
      component.receiveHideModal();

      expect(component.modalRef).toBeFalsy();
    });

    it('should hide the currently opened invoice dialog', () => {
      component.receiveCreateInvoiceEvent(businessPartnerCustomerSummary.business_partner_merchants[0]);
      spyOn(component.modalRef, 'hide');

      component.receiveHideModal();
      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe('receiveFetchInvoiceListEvent', () => {
    it('should not get invoice list if datatables params are not provided', () => {
      const emptyDatatableParams = datatableParamsFactory.build();
      spyOn(businessPartnerService, 'getSentInvoices');
      spyOnProperty(component, 'datatablesSentInvoicesRequestParams').and.returnValue(null);

      component.receiveFetchInvoiceListEvent(emptyDatatableParams);

      expect(businessPartnerService.getSentInvoices).toHaveBeenCalledTimes(0);
    });

    it('should get invoice list using previous datatables params', () => {
      const emptyDatatableParams = datatableParamsFactory.build();
      spyOn(businessPartnerService, 'getSentInvoices').and.returnValue(of(null));
      spyOnProperty(component, 'datatablesSentInvoicesRequestParams').and.returnValue({});
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveFetchInvoiceListEvent(emptyDatatableParams);

      expect(businessPartnerService.getSentInvoices).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, Object({}));
    });

    it('should get the invoice list', () => {
      const defaultDatatableParams = datatableParamsFactory.build({ dataTablesParameters: DEFAULT_DATATABLES_PARAMS });
      spyOn(businessPartnerService, 'getSentInvoices').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerSentInvoices').and.returnValue(
        new BehaviorSubject<InvoiceList>(receivedBorrowerInvoices));
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveFetchInvoiceListEvent(defaultDatatableParams);

      expect(component.invoiceList).toEqual(receivedBorrowerInvoices.business_partner_invoices);
    });

    it('should not get the invoice list if null', () => {
      const defaultDatatableParams = datatableParamsFactory.build({ dataTablesParameters: DEFAULT_DATATABLES_PARAMS });
      spyOn(businessPartnerService, 'getSentInvoices').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerSentInvoices').and.returnValue(
        new BehaviorSubject<InvoiceList>(null));
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveFetchInvoiceListEvent(defaultDatatableParams);

      expect(component.invoiceList).toBeUndefined();
    });

    it('should trigger a bugsnag if get sent invoices fails', () => {
      const defaultDatatableParams = datatableParamsFactory.build({ dataTablesParameters: DEFAULT_DATATABLES_PARAMS });
      spyOn(businessPartnerService, 'getSentInvoices').and.returnValue(throwError(internalServerErrorFactory.build()));
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.receiveFetchInvoiceListEvent(defaultDatatableParams);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('receiveLoadTrackedInvoiceHistoryEvent', () => {
    it('should open the tracked invoice history modal', () => {
      spyOn(bsModalService, 'show').and.returnValue(new BsModalRef());
      component.receiveLoadTrackedInvoiceHistoryEvent(invoiceResponse);

      expect(component.trackedInvoice).toEqual(invoiceResponse);
      expect(bsModalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).toBeDefined();
    });
  });

  describe('merchantDisplayName', () => {
    it('should return merchant name if doing business as is not set', () => {
      const merchant: Merchant = merchantDataFactory.build({ doing_business_as: '' });
      spyOnProperty(component, 'merchant').and.returnValue(merchant);
      expect(component.merchantDisplayName()).toEqual(merchant.name);
    });

    it('should return merchant doing business as if doing business as is set', () => {
      const merchant: Merchant = merchantDataFactory.build();
      spyOnProperty(component, 'merchant').and.returnValue(merchant);
      expect(merchant.doing_business_as).toBeDefined();
      expect(component.merchantDisplayName()).toEqual(merchant.doing_business_as);
    });
  });

  describe('onClosed', () => {
    const alert1 = uiAlertFactory.build();
    const alert2 = uiAlertFactory.build({ msg: 'Test' });
    it('should remove the alert that was closed', () => {
      component.alerts = [alert1, alert2];
      component.onClosed(alert1);

      expect(component.alerts).toEqual([alert2]);
    });

    it('should have no effect if alerts is null', () => {
      component.alerts = null;
      component.onClosed(alert1);

      expect(component.alerts).toEqual([]);
    });

    it('should have no effect if alerts is undefined', () => {
      component.onClosed(alert1);

      expect(component.alerts).toEqual([]);
    });

    it('should have no effect if alerts is empty array', () => {
      component.alerts = [];
      component.onClosed(alert1);

      expect(component.alerts).toEqual([]);
    });
  });

  describe('schedulePartnerTrainingWithCalendly', () => {
    beforeEach(() => {
      window['Calendly'] = {
        initPopupWidget: (): void => undefined
      };
      spyOn(window['Calendly'], 'initPopupWidget');
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());
      spyOnProperty(configurationService, 'calendlyUrl').and.returnValue(applicationConfiguration.calendly_url);
      spyOnProperty(userService, 'userSession', 'get').and.returnValue(userSessionFactory.build());
    });

    it('should call initPopupWidget and add an event listener', () => {
      spyOn(window, 'addEventListener');

      component.schedulePartnerTrainingWithCalendly();

      expect(window['Calendly'].initPopupWidget).toHaveBeenCalledOnceWith({
        url: applicationConfiguration.calendly_url,
        prefill: {
          name: userSessionFactory.build().name,
          email: userSessionFactory.build().email
        }
      });
      expect(window.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should not call updateProfile unless calendly.event_scheduled event received', () => {
        spyOn(businessPartnerService, 'updateProfile');

        component.schedulePartnerTrainingWithCalendly();

        const event: MessageEvent = new MessageEvent('message', {
          data: {
            event: 'calendly.test_event'
          }
        });
        window.dispatchEvent(event);

        expect(businessPartnerService.updateProfile).not.toHaveBeenCalled();
      });

    it('should call updateProfile if calendly.event_scheduled event received', () => {
        spyOn(businessPartnerService, 'updateProfile').and.returnValue(of(null));

        component.schedulePartnerTrainingWithCalendly();

        const event: MessageEvent = new MessageEvent('message', {
          data: {
            event: 'calendly.event_scheduled'
          }
        });
        window.dispatchEvent(event);

        expect(businessPartnerService.updateProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, { partner_training_completed: true });
      });

    it('should trigger a bugsnag if updateProfile fails', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(throwError(null));

      component.schedulePartnerTrainingWithCalendly();

      const event: MessageEvent = new MessageEvent('message', {
        data: {
          event: 'calendly.event_scheduled'
        }
      });
      window.dispatchEvent(event);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('receiveUpdateProfileEvent', () => {
    beforeEach(() => {
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());
    });

    it('should call update profile if update profile event is received', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(of(null));

      component.receiveUpdateProfileEvent({
        params: {
          facebook_sharing_requested: true
        },
        requestType: UpdateProfileEventRequestType.setFacebookSharingRequest
      });

      expect(businessPartnerService.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('should trigger a bugsnag if updateProfile fails on facebook', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(throwError(null));

      component.receiveUpdateProfileEvent({
        params: {
          facebook_sharing_requested: true
        },
        requestType: UpdateProfileEventRequestType.setFacebookSharingRequest
      });

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should trigger a bugsnag if updateProfile fails on linkedin', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(throwError(null));

      component.receiveUpdateProfileEvent({
        params: {
          linkedin_sharing_requested: true
        },
        requestType: UpdateProfileEventRequestType.setLinkedInSharingRequest
      });

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should trigger a bugsnag if updateProfile fails on twitter', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(throwError(null));

      component.receiveUpdateProfileEvent({
        params: {
          facebook_sharing_requested: true
        },
        requestType: UpdateProfileEventRequestType.setTwitterSharingRequest
      });

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSelectTab()', () => {
    it('should call loggingService.GTMUpdate with correct tab label', () => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'getProfile').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerProfile').and.returnValue(new BehaviorSubject<BusinessPartnerProfile>(emptyBusinessPartnerProfile));
      spyOn(loggingService, 'GTMUpdate');
      fixture.detectChanges();

      component.onSelectTab(component.tab1);

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.TAB_CLICKED, component.tab1.heading);
    });
  });

  describe('Fab(Floating Action Button) Menu', () => {
    beforeEach(() => {
      spyOn(bsModalService, 'show');
      modalRefSpy = spyOnProperty(component, 'modalRef');
      modalRefSpy.and.returnValue(new BsModalRef());
    });

    it('should open fab menu modal when event occurs', () => {
      component.openFabMenu();
      expect(bsModalService.show).toHaveBeenCalledTimes(1);
    });

    it('should open invite partner modal when event occurs', () => {
      component.receiveOpenInviteEvent();
      expect(bsModalService.show).toHaveBeenCalledTimes(1);
    });

    it('should open share modal when event occurs', () => {
      component.receiveShareEvent();
      expect(bsModalService.show).toHaveBeenCalledTimes(1);
    });

    it('should open share modal when event occurs', () => {
      component.receiveShareEvent();
      expect(bsModalService.show).toHaveBeenCalledTimes(1);
    });

    describe('Connect Quickbooks', () => {
      let initiateFlowSpy;

      beforeEach(() => {
        spyOn(loggingService, 'GTMUpdate');
        spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
        spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
        spyOn(component.alerts, 'push');
        initiateFlowSpy = spyOn(quickbooksService, 'initiateAuthFlow');
      });

      it('should add success alert when QB connect status is true', () => {
        const qbSuccessfulDashboardAlert = uiAlertFactory.build({ msg: 'QUICKBOOKS.CONNECT_SUCCESS', timeout: 5000 });

        component.ngOnInit();
        quickbooksService.receiveConnectedEvent.next({ status: true });

        expect(component.alerts.push).toHaveBeenCalledWith(qbSuccessfulDashboardAlert);
      });

      it('should add error alert when QB connect status is false', () => {
        const qbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'QUICKBOOKS.CONNECT_FAIL', timeout: 5000 });

        component.ngOnInit();
        quickbooksService.receiveConnectedEvent.next({ status: false });

        expect(component.alerts.push).toHaveBeenCalledWith(qbErrorDashboardAlert);
      });

      it('should add error alert when QB connect status throws an error', () => {
        const qbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'QUICKBOOKS.CONNECT_FAIL', timeout: 5000 });

        component.ngOnInit();
        quickbooksService.receiveConnectedEvent.error(null);
        quickbooksService.receiveConnectedEvent = new Subject(); // Reset the subject so the error doesn't affect other tests

        expect(component.alerts.push).toHaveBeenCalledWith(qbErrorDashboardAlert);
      });

      it('should add error alert when QB returns the realm ID changed error', () => {
        const qbRealmIDErrorDashboardAlert = uiAlertFactory.build({
          type: UiAlertStatus.danger,
          msg: 'QUICKBOOKS.CONNECT_FAIL_REALMID',
          params: Object({ realm_id: 'TEST_REALM_ID' }),
          timeout: 20000
        });

        spyOnProperty(component, 'merchant').and.returnValue(merchantWithQuickBooksRealmID);
        component.ngOnInit();
        quickbooksService.receiveConnectedEvent.next(quickbooksRealmIDChangedErrorResponse);

        expect(component.alerts.push).toHaveBeenCalledWith(qbRealmIDErrorDashboardAlert);
      });

      it('should add generic error alert when QB returns the realm ID changed error and merchant is not available', () => {
        const qbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'QUICKBOOKS.CONNECT_FAIL', timeout: 5000 });

        component.ngOnInit();
        spyOnProperty(component, 'merchant').and.returnValue(null);
        quickbooksService.receiveConnectedEvent.next(quickbooksRealmIDChangedErrorResponse);

        expect(component.alerts.push).toHaveBeenCalledWith(qbErrorDashboardAlert);
      });

      it('should reload merchant when QB connect returns a success message', () => {
        spyOn(quickbooksService, 'importCheckObservable').and.returnValue(of(null));

        component.ngOnInit();
        quickbooksService.receiveConnectedEvent.next({ status: true });

        expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      });

      it('should not reload merchant when QB connect does not return success', () => {
        initiateFlowSpy.and.returnValue(of(omniauthFailedFlowResponse));

        component.ngOnInit();
        quickbooksService.receiveConnectedEvent.next({ status: false });

        expect(merchantService.loadMerchant).not.toHaveBeenCalled();
      });

      describe('openQuickBooksOpenEvent', () => {
        it('calls QuickBooks service to initiate auth flow', () => {
          component.receiveQuickBooksOpenEvent();
          expect(quickbooksService.initiateAuthFlow).toHaveBeenCalledTimes(1);
        });
      });

      describe('should initiate QB import check', () => {
        beforeEach(() => {
          spyOn(quickbooksService, 'importCheckObservable').and.returnValue(of(null));
        });

        it('when QB connect returns a success message', () => {
          component.ngOnInit();
          quickbooksService.receiveConnectedEvent.next(omniauthFlowResponseFactory.build());

          expect(quickbooksService.importCheckObservable).toHaveBeenCalledTimes(1);
        });

        it('should not initiate check QB import check when QB connect does not return success', () => {
          component.ngOnInit();
          quickbooksService.receiveConnectedEvent.next(omniauthFlowResponseFactory.build({status: false}));

          expect(quickbooksService.importCheckObservable).not.toHaveBeenCalled();
        });

        it('and send QuickBooks imported event when done', () => {
          spyOn(component, 'receiveQuickbooksImportedEvent');
          component.ngOnInit();
          quickbooksService.receiveConnectedEvent.next(omniauthFlowResponseFactory.build());

          expect(component.receiveQuickbooksImportedEvent).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('should hide Fab menu when another modal(one of the ones in the fab) is opened', () => {
      spyOn(component.modalRef, 'hide');

      component.openFabMenu();
      component.receiveShareEvent();

      expect(bsModalService.show).toHaveBeenCalledTimes(2);
      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe('reloadBusinessPartnerMerchantsEvent', () => {
    it('should get custommer summary', () => {
      spyOn(component, 'getCustomerSummary');
      component.reloadBusinessPartnerMerchantsEvent();

      expect(component.getCustomerSummary).toHaveBeenCalledOnceWith(null, null);
    });
  });
});
