import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { CashFlowComponent } from './cash-flow.component';
import { StateRoutingService } from 'app/services/state-routing.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { UtilityService } from 'app/services/utility.service';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { MerchantService } from 'app/services/merchant.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { LoggingService } from 'app/services/logging.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { CashFlowStartComponent } from 'app/components/containers/cash-flow-start/cash-flow-start.component';
import { CashFlowEndComponent } from 'app/components/containers/cash-flow-end/cash-flow-end.component';
import { CashFlowDirective } from 'app/components/routes/cash-flow/cash-flow.directive';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { ErrorService } from 'app/services/error.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CashFlowManualComponent } from 'app/components/containers/cash-flow-manual/cash-flow-manual.component';
import { LogSeverity } from 'app/models/api-entities/log';
import { UiError } from 'app/models/ui-error';
import { manualUnverifiedBankAccount, flinksBankAccount } from 'app/test-stubs/factories/bank-account';
import { OfferService } from 'app/services/offer.service';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';

describe('CashFlowComponent', () => {
  let component: CashFlowComponent;
  let fixture: ComponentFixture<CashFlowComponent>;

  let stateRoutingService: StateRoutingService;

  let stubLoadComponent;
  let stubIsBankFlowInProgress;
  let stubBankAccount;
  let stubMerchantHasSelectedBankAccount;
  let stubMerchant;
  let stubLoadBankAccount;
  let stubLogMessage;
  let stubErrorModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [
        CashFlowComponent,
        SetUpBankComponent,
        CashFlowStartComponent,
        CashFlowEndComponent,
        CashFlowDirective,
        CashFlowManualComponent
      ],
      providers: [
        BankAccountService,
        UtilityService,
        MerchantService,
        BankingFlowService,
        DynamicComponentService,
        CookieService,
        ErrorService,
        LoggingService,
        OfferService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          SetUpBankComponent,
          CashFlowStartComponent,
          CashFlowEndComponent,
          CashFlowManualComponent
        ]
      }
    })
    .compileComponents();
  }));

  beforeEach(inject(
    [ DynamicComponentService, BankingFlowService, BankAccountService, MerchantService, LoggingService, ErrorService ],
    (componentLoader: DynamicComponentService, bankingFlowService: BankingFlowService, bankAccountService: BankAccountService,
     merchantService: MerchantService, loggingService: LoggingService, errorService: ErrorService) => {
      fixture = TestBed.createComponent(CashFlowComponent);
      component = fixture.componentInstance;

      stateRoutingService = TestBed.inject(StateRoutingService);
      spyOn(stateRoutingService, 'navigate');

      bankAccountService.increaseLimit = false;

      stubLoadComponent = () => spyOn(componentLoader, 'loadComponent');
      stubIsBankFlowInProgress = (val) => spyOn(bankingFlowService, 'isBankFlowInProgress').and.returnValue(val);
      stubBankAccount = (val) => spyOnProperty(bankAccountService, 'bankAccount').and.returnValue(new BehaviorSubject(val));
      stubMerchantHasSelectedBankAccount = (val) => spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(val);
      stubMerchant = (val) => spyOn(merchantService, 'getMerchant').and.returnValue(val);
      stubLoadBankAccount = (val) => spyOn(bankAccountService, 'loadBankAccount').and.returnValue(val);
      stubLogMessage = () => spyOn(loggingService, 'log');
      stubErrorModal = () => spyOn(errorService, 'show');
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should set viewComponentRef in componentLoader to CashFlowDirective\'s ref',
      inject([ DynamicComponentService ], (componentLoader: DynamicComponentService) => {
        expect(componentLoader.viewContainerRef).toBeFalsy();

        fixture.detectChanges();

        expect(componentLoader.viewContainerRef).toEqual(component.cashFlowDirective.viewContainerRef);
      }));

    it('should set increaseLimit to true in BankAccountService', inject(
      [ BankAccountService ], (bankAccountService: BankAccountService) => {
        expect(bankAccountService.increaseLimit).toEqual(false);

        fixture.detectChanges();

        expect(bankAccountService.increaseLimit).toEqual(true);
      }));

    it('should call loadBankAccount if merchant has a selected bank account',
      inject([ BankAccountService ], (bankAccountService: BankAccountService) => {
        const merchant = merchantDataFactory.build({ selected_bank_account: 'ba_123' });
        stubMerchant(merchant);
        stubLoadBankAccount(of(null));

        fixture.detectChanges();

        expect(bankAccountService.loadBankAccount).toHaveBeenCalledOnceWith(merchant.selected_bank_account);
      }));

    it('should not call loadBankAccount if merchant does not have a selected bank account',
      inject([ BankAccountService ], (bankAccountService: BankAccountService) => {
        const merchant = merchantDataFactory.build({ selected_bank_account: '' });
        stubMerchant(merchant);
        stubLoadBankAccount(of(null));

        fixture.detectChanges();

        expect(bankAccountService.loadBankAccount).not.toHaveBeenCalled();
      }));

    it('should trigger log and error modal if loadBankAccount call failed',
      inject([ ErrorService, LoggingService ], (errorService: ErrorService, loggingService: LoggingService) => {
        const merchant = merchantDataFactory.build({ selected_bank_account: 'ba_123' });
        stubMerchant(merchant);
        stubLoadBankAccount(throwError(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })));
        stubLogMessage();
        stubErrorModal();

        fixture.detectChanges();

        expect(loggingService.log).toHaveBeenCalledOnceWith({
          message: 'Error loading bank account in cash-flow component: Http failure response for (unknown url): 500 Internal Server Error',
          severity: LogSeverity.warn
        });
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccount);
      }));

    it('should load SetUpBankComponent if isBankFlowInProgress returns true', inject(
      [ DynamicComponentService ], (componentLoader: DynamicComponentService) => {
        stubIsBankFlowInProgress(true);
        stubLoadComponent();

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(SetUpBankComponent);
      }));

    describe('should load CashFlowManual if if isBankFLowInProgress returns false and', () => {
      it('merchant has selected bank account + manual bank account', inject(
        [ DynamicComponentService ], (componentLoader: DynamicComponentService) => {
          stubIsBankFlowInProgress(false);
          stubBankAccount(manualUnverifiedBankAccount);
          stubLoadBankAccount(of(null));
          stubMerchantHasSelectedBankAccount(true);
          stubLoadComponent();

          fixture.detectChanges();

          expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(CashFlowManualComponent);
        }));
    });

    describe('should load CashFlowStart if isBankFlowInProgress returns false and', () => {
      it('merchant does not have selected bank account', inject(
        [ DynamicComponentService ], (componentLoader: DynamicComponentService) => {
          stubIsBankFlowInProgress(false);
          stubMerchantHasSelectedBankAccount(false);
          stubLoadComponent();

          fixture.detectChanges();

          expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(CashFlowStartComponent);
        }));

      it('merchant has selected bank account but bank account does not have manual source', inject(
        [ DynamicComponentService ], (componentLoader: DynamicComponentService) => {
          stubIsBankFlowInProgress(false);
          stubBankAccount(flinksBankAccount);
          stubLoadBankAccount(of(null));
          stubMerchantHasSelectedBankAccount(true);
          stubLoadComponent();

          fixture.detectChanges();

          expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(CashFlowStartComponent);
        }));
    });

    describe('Banking flow parameters', () => {
      it('should set attributes in BankingFlowService', inject(
        [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
          fixture.detectChanges();

          expect(bankingFlowService.skippable).toEqual(false);
        }));

      describe('BankingFlowService events handling', () => {
        it('should call clearFlinksCookies and route to dashboard when cancel event is trigger', inject(
          [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
            fixture.detectChanges();
            bankingFlowService.triggerCancelEvent();
            expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
          }));

        it('should load CashFlowEndComponent when complete event is trigger', inject(
          [ BankingFlowService, DynamicComponentService ], (bankingFlowService: BankingFlowService, componentLoader: DynamicComponentService) => {
            stubLoadComponent();

            fixture.detectChanges();
            bankingFlowService.triggerCompleteEvent();
            expect(componentLoader.loadComponent).toHaveBeenCalledTimes(2); // initial call + event triggered call
            expect(componentLoader.loadComponent).toHaveBeenCalledWith(CashFlowEndComponent);
          }));

        it('should load SetUpBankComponent when start event is trigger', inject(
          [ BankingFlowService, DynamicComponentService ], (bankingFlowService: BankingFlowService, componentLoader: DynamicComponentService) => {
            stubLoadComponent();

            fixture.detectChanges();
            bankingFlowService.triggerStartEvent();
            expect(componentLoader.loadComponent).toHaveBeenCalledTimes(2); // initial call + event triggered call
            expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
          }));
      });
    });

  });

  describe('ngOnDestroy()', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });

    it('should clear BankingFlowService attributes', inject(
      [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOn(bankingFlowService, 'clearAttributes');
        fixture.destroy();

        expect(bankingFlowService.clearAttributes).toHaveBeenCalledTimes(1);
      }));
  });
}); // describe - CashFlowComponent
