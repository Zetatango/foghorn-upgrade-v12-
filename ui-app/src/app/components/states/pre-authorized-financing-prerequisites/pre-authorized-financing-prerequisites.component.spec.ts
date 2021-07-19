import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, Observable, throwError } from 'rxjs';
import { PreAuthorizedFinancingPrerequisitesComponent } from './pre-authorized-financing-prerequisites.component';
import { PreAuthorizedFinancingDirective } from './pre-authorized-financing.directive';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { LoadingService } from 'app/services/loading.service';
import { AgreementService } from 'app/services/agreement.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { MerchantService } from 'app/services/merchant.service';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { LoggingService } from 'app/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { ErrorService } from 'app/services/error.service';
import { UtilityService } from 'app/services/utility.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { Merchant } from 'app/models/api-entities/merchant';
import { UiError } from 'app/models/ui-error';
import { MaskPipe } from 'app/pipes/mask.pipe';
import { agreementFactory } from 'app/test-stubs/factories/agreement';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { bankAccountFactory } from 'app/test-stubs/factories/bank-account';
import { BankAccount } from 'app/models/bank-account';
import { PafAgreementComponent } from 'app/components/states/paf-agreement/paf-agreement.component';
import { Agreement, AgreementType } from 'app/models/agreement';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';
import Bugsnag from '@bugsnag/js';
import { MockProvider } from 'ng-mocks';
import { AppLoadService } from 'app/services/app-load.service';

describe('PreAuthorizedFinancingPrerequisitesComponent', () => {
  let component: PreAuthorizedFinancingPrerequisitesComponent;
  let fixture: ComponentFixture<PreAuthorizedFinancingPrerequisitesComponent>;

  let bankingFlowService: BankingFlowService;
  let componentLoader: DynamicComponentService;
  let errorService: ErrorService;
  let loadingService: LoadingService;
  let stateRoutingService: StateRoutingService;

  let stubMerchant;
  let stubMerchantHasSelectedBankAccount;
  let stubIsBankFlowInProgress;
  let loadAgreementByTypeSpy: jasmine.Spy;
  let errorServiceShowSpy: jasmine.Spy;
  let loadComponentSpy: jasmine.Spy;
  let stubLoadBankAccount;
  let stubBankAccount;
  let agreementBehaviorSubjectSpy: jasmine.Spy;
  let supplierIdSpy: jasmine.Spy;
  let routeSpy: jasmine.Spy;

  const defaultPafAgreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_financing });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, TranslateModule.forRoot(), RouterTestingModule ],
      declarations: [
        PreAuthorizedFinancingPrerequisitesComponent,
        PreAuthorizedFinancingDirective,
        PafAgreementComponent,
        SetUpBankComponent,
        MaskPipe
      ],
      providers: [
        MockProvider(AppLoadService),
        AgreementService,
        MerchantService,
        LoadingService,
        CookieService,
        ErrorService,
        UtilityService,
        BankAccountService,
        BankingFlowService,
        MerchantService,
        DynamicComponentService,
        LoggingService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          SetUpBankComponent,
          PafAgreementComponent
        ],
      }
    });

    fixture = TestBed.createComponent(PreAuthorizedFinancingPrerequisitesComponent);
    component = fixture.componentInstance;

    bankingFlowService = TestBed.inject(BankingFlowService);
    componentLoader = TestBed.inject(DynamicComponentService);
    errorService = TestBed.inject(ErrorService);
    loadingService = TestBed.inject(LoadingService);
    stateRoutingService = TestBed.inject(StateRoutingService);

    const merchantService: MerchantService = TestBed.inject(MerchantService);
    const bankAccountService: BankAccountService = TestBed.inject(BankAccountService);
    const agreementService: AgreementService = TestBed.inject(AgreementService);


    // Specific Stubs
    stubMerchant = (value: Merchant) =>
      spyOn(merchantService, 'getMerchant').and.returnValue(value);

    stubMerchantHasSelectedBankAccount = (value: boolean) =>
      spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(value);

    stubIsBankFlowInProgress = (value: boolean) =>
      spyOn(bankingFlowService, 'isBankFlowInProgress').and.returnValue(value);

    stubLoadBankAccount = (response: Observable<any>) => // eslint-disable-line
      spyOn(bankAccountService, 'loadBankAccount').and.returnValue(response);

    stubBankAccount = (value: BankAccount) =>
      spyOnProperty(bankAccountService, 'bankAccount').and.returnValue(new BehaviorSubject(value));

    // Spies

    spyOn(loadingService, 'hideMainLoader');
    spyOn(loadingService, 'showMainLoader');
    loadAgreementByTypeSpy = spyOn(agreementService, 'loadAgreementByType').and.returnValue(of(null));
    agreementBehaviorSubjectSpy = spyOnProperty(agreementService, 'agreementSubject').and.returnValue(new BehaviorSubject<Agreement>(defaultPafAgreement));
    errorServiceShowSpy = spyOn(errorService, 'show');
    loadComponentSpy = spyOn(componentLoader, 'loadComponent').and.callThrough(); // so component ref gets set
    supplierIdSpy = spyOnProperty(component, 'supplierId').and.returnValue('su_123');
    spyOn(Bugsnag, 'notify');
    routeSpy = spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ----------------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    beforeEach(() => {
      stubMerchant(merchantDataFactory.build({ id: defaultPafAgreement.merchant_id }));
    });

    it('should call showMainLoader', () => {
      fixture.detectChanges();

      expect(loadingService.showMainLoader).toHaveBeenCalledTimes(1);
    });

    it('should eventually call hideMainLoader', () => {
      fixture.detectChanges();

      expect(loadingService.hideMainLoader).toHaveBeenCalledTimes(1);
    });

    it('should set correct banking flow parameters in BankingFlowService', () => {
      fixture.detectChanges();

      expect(bankingFlowService.skippable).toEqual(false);
    });

    it('should load the PAF agreement for the merchant and selected supplier', () => {
      component.ngOnInit();

      expect(component.agreement).toEqual(defaultPafAgreement);
    });

    it('should set the agreement even if agreement has already been rendered', () => {
      spyOnProperty(component, 'agreementRendered').and.returnValue(true);
      component.ngOnInit();

      expect(component.agreement).toEqual(defaultPafAgreement);
    });

    it('should not set the agreement if no agreement returned', () => {
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(null));
      component.ngOnInit();

      expect(component.agreement).toBeUndefined();
    });

    it('should not set the agreement if agreement is not type PAF', () => {
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build()));
      component.ngOnInit();

      expect(component.agreement).toBeUndefined();
    });

    it('should not set the agreement if agreement merchant does not match current merchant', () => {
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build({
          type: AgreementType.pre_authorized_financing,
          merchant_id: 'UNKNOWN'
      })));
      component.ngOnInit();

      expect(component.agreement).toBeUndefined();
    });

    it('should log error and display error dialog if error occurs while loading agreement', () => {
      loadAgreementByTypeSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: 'https://foghorn.com' })));
      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getAgreement);
    });

    it('should set supplier ID to value in local storage', () => {
      spyOn(localStorage, 'getItem').and.returnValue('su_123');
      supplierIdSpy.and.callThrough();

      component.ngOnInit();

      expect(component.supplierId).toEqual('su_123');
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
  });

  // ----------------------------------------------------------------------------- render()
  describe('render()', () => {
    beforeEach(() => {
      stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPafAgreement.merchant_id }));
    });

    describe('when merchant has not selected a bank account', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(false);
        fixture.detectChanges();
      });

      it('should call loadComponent with SetUpBankComponent bank flow', () => {
        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(SetUpBankComponent);
        expect(errorService.show).not.toHaveBeenCalled();
      });
    });

    describe('when banking flow is in progress', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(true);
        stubMerchantHasSelectedBankAccount(false);
        fixture.detectChanges();
      });

      it('should call loadComponent with SetUpBankComponent bank flow', () => {
        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(SetUpBankComponent);
        expect(errorService.show).not.toHaveBeenCalled();
      });
    });

    it('should show generic error modal if the bank account failed to load', () => {
      stubIsBankFlowInProgress(false);
      stubMerchantHasSelectedBankAccount(true);
      stubLoadBankAccount(throwError(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })));
      fixture.detectChanges();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });

    describe('when merchant has selected a verified bank account', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(new HttpResponse({status: 200, body: {}})));
        const bankAccount = bankAccountFactory.build({ verified: 'true' });
        stubBankAccount(bankAccount);
      });

      it('should go to sign PAF agreement page if the PAF agreement has not been signed', () => {
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build({
            type: AgreementType.pre_authorized_financing,
            accepted_at: null
        })));
        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(PafAgreementComponent);
        expect(errorServiceShowSpy).not.toHaveBeenCalled();
      });

      it('should go to sign PAF agreement page if the PAF agreement has been opted out', () => {
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build({
          type: AgreementType.pre_authorized_financing
        })));
        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(PafAgreementComponent);
        expect(errorServiceShowSpy).not.toHaveBeenCalled();
      });

      it('should redirect to the dashboard page if the PAF agreement has been signed', () => {
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build({
          type: AgreementType.pre_authorized_financing,
          opt_out_at: null
        })));
        fixture.detectChanges();

        expect(routeSpy).toHaveBeenCalledWith(AppRoutes.dashboard.root);
        expect(errorServiceShowSpy).not.toHaveBeenCalled();
      });
    });

    describe('when merchant has selected an unverified bank account', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(new HttpResponse({status: 200, body: {}})));
        const bankAccount = bankAccountFactory.build({ verified: 'false' });
        stubBankAccount(bankAccount);
        fixture.detectChanges();
      });

      it('should redirect to the dashboard page', () => {
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });

      it('should show bank account verifying error modal', () => {
        const expected_context: ErrorModalContext = new ErrorModalContext(
          'PENDING_BANK_ACCOUNT_VERIFICATION.TITLE',
          [ 'PENDING_BANK_ACCOUNT_VERIFICATION.BODY_1', 'PENDING_BANK_ACCOUNT_VERIFICATION.BODY_2' ]
        );
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
      });
    });
  }); // describe - render()

  describe('event handling', () => {
    beforeEach(() => {
      stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPafAgreement.merchant_id }));
    });

    describe('banking service complete event', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(new HttpResponse({status: 200, body: {}})));
      });

      describe('when merchant has selected a verified bank account', () => {
        beforeEach(() => {
          const bankAccount = bankAccountFactory.build({ verified: 'true' });
          stubBankAccount(bankAccount);
        });

        it('should go to sign PAF agreement page if the PAF agreement has not been signed', () => {
          const agreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_financing, accepted_at: null, opt_out_at: null });
          spyOnProperty(component, 'agreement').and.returnValue(agreement);
          fixture.detectChanges();
          loadComponentSpy.calls.reset();

          bankingFlowService.triggerCompleteEvent();

          expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(PafAgreementComponent);
        });

        it('should go to sign PAF agreement page if the PAF agreement has been opted out', () => {
          const agreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_financing });
          spyOnProperty(component, 'agreement').and.returnValue(agreement);
          fixture.detectChanges();
          loadComponentSpy.calls.reset();

          bankingFlowService.triggerCompleteEvent();

          expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(PafAgreementComponent);
        });

        it('should redirect to the dashboard if the PAF agreement has been signed', () => {
          const agreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_financing, opt_out_at: null });
          spyOnProperty(component, 'agreement').and.returnValue(agreement);
          fixture.detectChanges();

          routeSpy.calls.reset();
          bankingFlowService.triggerCompleteEvent();

          expect(routeSpy).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
        });
      });

      describe('when merchant has selected an unverified bank account', () => {
        beforeEach(() => {
          const bankAccount = bankAccountFactory.build({ verified: 'false' });
          stubBankAccount(bankAccount);
        });

        it('should redirect to the dashboard page', () => {
          fixture.detectChanges();

          routeSpy.calls.reset();
          bankingFlowService.triggerCompleteEvent();

          expect(routeSpy).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
        });

        it('should show bank account verifying error modal', () => {
          fixture.detectChanges();
          errorServiceShowSpy.calls.reset();

          bankingFlowService.triggerCompleteEvent();

          const expected_context: ErrorModalContext = new ErrorModalContext(
            'PENDING_BANK_ACCOUNT_VERIFICATION.TITLE',
            [ 'PENDING_BANK_ACCOUNT_VERIFICATION.BODY_1', 'PENDING_BANK_ACCOUNT_VERIFICATION.BODY_2' ]
          );

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
        });
      });
    });

    describe('banking service cancel event', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(true);
        stubMerchantHasSelectedBankAccount(false);
      });

      it('should show dashboard', () => {
        fixture.detectChanges();

        bankingFlowService.triggerCancelEvent();

        expect(routeSpy).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    });

    describe('agreement next event', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(new HttpResponse({status: 200, body: {}})));
        const bankAccount = bankAccountFactory.build({ verified: 'true' });
        stubBankAccount(bankAccount);
      });

      it('should show dashboard', () => {
        const agreementSpy = spyOnProperty(component, 'agreement');
        const agreement: Agreement = agreementFactory.build({
          type: AgreementType.pre_authorized_financing,
          accepted_at: null,
          opt_out_at: null
        });
        agreementSpy.and.returnValue(agreement);
        fixture.detectChanges();
        agreement.accepted_at = '2019-01-01';
        agreementSpy.and.returnValue(agreement);
        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit();

        expect(routeSpy).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    });

    describe('agreement back event', () => {
      beforeEach(() => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(new HttpResponse({status: 200, body: {}})));
        const bankAccount = bankAccountFactory.build({ verified: 'true' });
        stubBankAccount(bankAccount);
      });

      it('should show dashboard', () => {
        const agreementSpy = spyOnProperty(component, 'agreement');
        agreementSpy.and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing, accepted_at: null }));
        fixture.detectChanges();

        component.componentRef.instance.backEvent.emit();

        expect(routeSpy).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    });
  });
});
