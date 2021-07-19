import { QuickbooksFlowMessage } from './../models/api-entities/omniauth-flow-response';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { QuickBooksState } from 'app/models/api-entities/merchant';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { UiAlertStatus } from 'app/models/ui-alerts';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { QuickbooksService } from 'app/services/quickbooks.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { merchantDataFactory, merchantWithQuickBooksRealmID } from 'app/test-stubs/factories/merchant';
import {
  omniauthFailedFlowResponse,
  quickbooksRealmIDChangedErrorResponse
} from 'app/test-stubs/factories/omniauth-flow-response';
import { uiAlertFactory } from 'app/test-stubs/factories/ui-alerts';
import { of, Subject } from 'rxjs';
import { InsightsComponent } from './insights.component';
import { BankAccountService } from 'app/services/bank-account.service';

describe('InsightsComponent', () => {
  let component: InsightsComponent;
  let fixture: ComponentFixture<InsightsComponent>;

  let bankAccountService: BankAccountService;
  let merchantService: MerchantService;
  let quickbooksService: QuickbooksService;
  let loggingService: LoggingService;
  let configurationService: ConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        InsightsComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BankAccountService,
        MerchantService,
        UtilityService,
        LoggingService,
        StateRoutingService,
        QuickbooksService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(InsightsComponent);
    component = fixture.componentInstance;

    bankAccountService = TestBed.inject(BankAccountService);
    merchantService = TestBed.inject(MerchantService);
    quickbooksService = TestBed.inject(QuickbooksService);
    loggingService = TestBed.inject(LoggingService);
    configurationService = TestBed.inject(ConfigurationService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();
      spyOn(quickbooksService, 'finishOmniauthFlow');

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
      expect(quickbooksService.finishOmniauthFlow).toHaveBeenCalledOnceWith(OmniauthProviderConnectEvent.cancel);
    });
  });

  describe('ngOnInit', () => {
    it('should set the merchant property to the current merchant', () => {
      const getMerchantObsSpy = spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));
      component.ngOnInit();

      expect(getMerchantObsSpy).toHaveBeenCalledTimes(1);
      expect(component.merchant).toEqual(merchantDataFactory.build());
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

  describe('showConnectQuickBooks', () => {
    describe('for a merchant', () => {
      beforeEach(() => {
        spyOn(bankAccountService.owner, 'isMerchant').and.returnValue(true);
      });

      it('should return true when the quickbooks connect feature is enabled and customer is not connected', () => {
        const merchant = merchantDataFactory.build({ quickbooks_state: QuickBooksState.notConnected });
        spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchant));
        spyOnProperty(configurationService, 'quickBooksConnectEnabled').and.returnValue(true);

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.showConnectQuickBooks).toBeTrue();
      });

      it('should return true when the quickbooks connect feature is enabled and quickbooks connection is about to expire', () => {
        const merchant = merchantDataFactory.build({ quickbooks_state: QuickBooksState.aboutToExpire });
        spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchant));
        spyOnProperty(configurationService, 'quickBooksConnectEnabled').and.returnValue(true);

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.showConnectQuickBooks).toBeTrue();
      });

      it('should return false when the quickbooks connect feature is disabled', () => {
        spyOnProperty(configurationService, 'quickBooksConnectEnabled').and.returnValue(false);
        spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));
        component.ngOnInit();
        fixture.detectChanges();

        expect(component.showConnectQuickBooks).toBeFalse();
      });

      it('should return false when merchant is connected to quickbooks', () => {
        const merchant = merchantDataFactory.build({ quickbooks_state: QuickBooksState.connected });
        spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchant));
        component.ngOnInit();
        fixture.detectChanges();

        expect(component.showConnectQuickBooks).toBeFalse();
      });
    });

    it('should return false when bank account owner is a lead', () => {
      spyOn(bankAccountService.owner, 'isMerchant').and.returnValue(false);
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.showConnectQuickBooks).toBeFalse();
    });
  });


  describe('Connect Quickbooks', () => {
    let initiateFlowSpy: jasmine.Spy;

    beforeEach(() => {
      spyOn(component.alerts, 'push');
      spyOn(loggingService, 'GTMUpdate');
      initiateFlowSpy = spyOn(quickbooksService, 'initiateAuthFlow');
      spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
    });

    it('should add success alert when QB connect status is true', () => {
      const qbSuccessfulDashboardAlert = uiAlertFactory.build({ msg: 'QUICKBOOKS.CONNECT_SUCCESS', timeout: 5000 });
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));

      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next({ status: true });

      expect(component.alerts.push).toHaveBeenCalledWith(qbSuccessfulDashboardAlert);
    });

    it('should add error alert when QB connect status is false', () => {
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));
      const qbErrorDashboardAlert = uiAlertFactory.build({
        type: UiAlertStatus.danger,
        msg: 'QUICKBOOKS.CONNECT_FAIL',
        timeout: 5000
      });

      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next({ status: false });

      expect(component.alerts.push).toHaveBeenCalledWith(qbErrorDashboardAlert);
    });

    it('should add error alert when QB connect status throws an error', () => {
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));
      const qbErrorDashboardAlert = uiAlertFactory.build({
        type: UiAlertStatus.danger,
        msg: 'QUICKBOOKS.CONNECT_FAIL',
        timeout: 5000
      });

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

      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantWithQuickBooksRealmID));
      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next(quickbooksRealmIDChangedErrorResponse);

      expect(component.alerts.push).toHaveBeenCalledWith(qbRealmIDErrorDashboardAlert);
    });

    it('should add generic error alert when QB returns the realm ID changed error and merchant is not available', () => {
      const qbErrorDashboardAlert = uiAlertFactory.build({
        type: UiAlertStatus.danger,
        msg: 'QUICKBOOKS.CONNECT_FAIL',
        timeout: 5000
      });
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));

      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next(quickbooksRealmIDChangedErrorResponse);

      expect(component.alerts.push).toHaveBeenCalledWith(qbErrorDashboardAlert);
    });

    it('should reload merchant when QB connect returns a success message', () => {
      spyOn(quickbooksService, 'importCheckObservable').and.returnValue(of(null));
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));

      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next({ status: true });

      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
    });

    it('should not reload merchant when QB connect does not return success', () => {
      initiateFlowSpy.and.returnValue(of(omniauthFailedFlowResponse));
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(merchantDataFactory.build()));
      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next({ status: false });

      expect(merchantService.loadMerchant).not.toHaveBeenCalled();
    });

    it('should add success alert when there is no merchant', () => {
      const qbSuccessfulDashboardAlert = uiAlertFactory.build({ msg: 'QUICKBOOKS.CONNECT_SUCCESS', timeout: 5000 });
      spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(of(null));

      component.ngOnInit();
      quickbooksService.receiveConnectedEvent.next({ status: true, message: QuickbooksFlowMessage.realmIdChangedError });

      expect(component.alerts.push).toHaveBeenCalledWith(qbSuccessfulDashboardAlert);
    });

  });

  describe('onChartTypeChanged', () => {
    it('should set showCashFlowChart value', () => {
      const showCashFlowChart = true;

      component.onChartTypeChanged(showCashFlowChart);
      expect(component.showCashFlowChart).toBe(showCashFlowChart);
    });
  });
});
