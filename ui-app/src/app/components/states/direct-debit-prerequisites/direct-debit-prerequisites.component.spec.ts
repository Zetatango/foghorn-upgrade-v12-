import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, Observable, throwError } from 'rxjs';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { UtilityService } from 'app/services/utility.service';
import { LoadingService } from 'app/services/loading.service';
import { ErrorService } from 'app/services/error.service';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { AgreementService } from 'app/services/agreement.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { CookieService } from 'ngx-cookie-service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DirectDebitPrerequisitesComponent } from './direct-debit-prerequisites.component';
import { DirectDebitPrerequisitesDirective } from './direct-debit-prerequisites.directive';
import { ReviewDirectDebitComponent } from '../review-direct-debit/review-direct-debit.component';
import { LoggingService } from 'app/services/logging.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { BankAccount } from 'app/models/bank-account';
import { UiError } from 'app/models/ui-error';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { bankAccountFactory } from 'app/test-stubs/factories/bank-account';
import { directPaymentResponseFactory, directPaymentPostFactory } from 'app/test-stubs/factories/direct-payment';
import { MaskPipe } from 'app/pipes/mask.pipe';
import { PadAgreementComponent } from 'app/components/states/pad-agreement/pad-agreement.component';
import { agreementFactory } from 'app/test-stubs/factories/agreement';
import { Agreement, AgreementType } from 'app/models/agreement';
import { DirectPaymentPost } from 'app/models/api-entities/direct-payment-post';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { supplierInfoLcbo } from 'app/test-stubs/factories/supplier';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import Bugsnag from '@bugsnag/js';
import { MockProvider } from 'ng-mocks';
import { AppLoadService } from 'app/services/app-load.service';

describe('DirectDebitPrerequisitesComponent', () => {
  let component: DirectDebitPrerequisitesComponent;
  let fixture: ComponentFixture<DirectDebitPrerequisitesComponent>;

  let bankingFlowService;
  let componentLoader;
  let directPaymentService;
  let errorService;
  let loadingService;
  let stateRoutingService: StateRoutingService;

  let stubLoadBankAccount;
  let stubBankAccount;
  let stubMerchantHasSelectedBankAccount;
  let stubIsBankFlowInProgress;
  let stubDirectDebitPost;
  let stubSupplierInformation;

  let loadComponentSpy: jasmine.Spy;
  let getAgreementSpy: jasmine.Spy;
  let agreementBehaviorSubjectSpy: jasmine.Spy;
  let merchantSpy: jasmine.Spy;

  const defaultPadAgreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_debit });

  beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          TranslateModule.forRoot(),
          RouterTestingModule
        ],
        declarations: [
          DirectDebitPrerequisitesComponent,
          DirectDebitPrerequisitesDirective,
          SetUpBankComponent,
          ReviewDirectDebitComponent,
          PadAgreementComponent,
          MaskPipe,
          ZttCurrencyPipe
        ],
        providers: [
          MockProvider(AppLoadService),
          AgreementService,
          MerchantService,
          DirectPaymentService,
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
            PadAgreementComponent,
            ReviewDirectDebitComponent
          ],
        }
      });

      fixture = TestBed.createComponent(DirectDebitPrerequisitesComponent);
      component = fixture.componentInstance;

      bankingFlowService = TestBed.inject(BankingFlowService);
      componentLoader = TestBed.inject(DynamicComponentService);
      directPaymentService = TestBed.inject(DirectPaymentService);
      errorService = TestBed.inject(ErrorService);
      loadingService = TestBed.inject(LoadingService);
      stateRoutingService = TestBed.inject(StateRoutingService);

      const merchantService: MerchantService = TestBed.inject(MerchantService);
      const loggingService: LoggingService = TestBed.inject(LoggingService);
      const bankAccountService: BankAccountService = TestBed.inject(BankAccountService);


      const agreementService: AgreementService = TestBed.inject(AgreementService);

      // Specific Stubs
      spyOn(stateRoutingService, 'navigate');

      stubLoadBankAccount = (response: Observable<any>) => // eslint-disable-line
        spyOn(bankAccountService, 'loadBankAccount').and.returnValue(response);

      stubBankAccount = (value: BankAccount) =>
        spyOnProperty(bankAccountService, 'bankAccount').and.returnValue(new BehaviorSubject(value));

      stubMerchantHasSelectedBankAccount = (value: boolean) =>
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(value);

      stubIsBankFlowInProgress = (value: boolean) =>
        spyOn(bankingFlowService, 'isBankFlowInProgress').and.returnValue(value);

      stubDirectDebitPost = (value: DirectPaymentPost) =>
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(value));

      stubSupplierInformation = (value: SupplierInformation) =>
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(value));

      // Spies
      merchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build({ id: defaultPadAgreement.merchant_id }));
      spyOn(loadingService, 'hideMainLoader');
      spyOn(loadingService, 'showMainLoader');
      loadComponentSpy = spyOn(componentLoader, 'loadComponent').and.callThrough(); // so component ref gets set
      spyOn(errorService, 'show');
      spyOn(loggingService, 'log');
      spyOn(Bugsnag, 'notify');

      getAgreementSpy = spyOn(agreementService, 'loadAgreementByType').and.returnValue(of(null));
      agreementBehaviorSubjectSpy = spyOnProperty(agreementService, 'agreementSubject').and.returnValue(new BehaviorSubject<Agreement>(
        agreementFactory.build({ type: AgreementType.pre_authorized_debit })));
    });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ----------------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
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

    it('should load the PAD agreement for the merchant', () => {
      component.ngOnInit();

      expect(component.agreement).toEqual(defaultPadAgreement);
    });

    it('should set the agreement even if agreement has already been rendered', () => {
      spyOnProperty(component, 'agreementRendered').and.returnValue(true);
      component.ngOnInit();

      expect(component.agreement).toEqual(defaultPadAgreement);
    });

    it('should not set the agreement if no agreement returned', () => {
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(null));
      component.ngOnInit();

      expect(component.agreement).toBeUndefined();
    });

    it('should not set the agreement if agreement is not type PAD', () => {
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build({ type: AgreementType.pre_authorized_financing })));
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
      getAgreementSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: 'https://foghorn.com' })));
      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getAgreement);
    });
  });

  describe('ngOnDestroy()', () => {
    it('should trigger the completion of observables, and clear banking attributes', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();
      spyOn(bankingFlowService, 'clearAttributes').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
      expect(bankingFlowService.clearAttributes).toHaveBeenCalledOnceWith();
    });
  });

  // ----------------------------------------------------------------------------- render()
  describe('render()', () => {
    it('should call loadComponent with SetUpBankComponent bank flow if banking flow is in progress', () => {
        stubIsBankFlowInProgress(true);
        stubMerchantHasSelectedBankAccount(false);

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalled();
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });

    it('should call loadComponent with SetUpBankComponent bank flow if merchant has not selected a bank account', () => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(false);

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalled();
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });

    it('should call loadComponent with ReviewDirectDebitComponent if merchant has already selected bank account', () => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubDirectDebitPost(directPaymentResponseFactory.build());
        stubSupplierInformation(supplierInfoLcbo);

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(ReviewDirectDebitComponent);
      });


    it('review complete should go to agreement if not yet signed', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        spyOnProperty(directPaymentService, 'reviewed').and.returnValue(true);
        const agreementResponse: Agreement = agreementFactory.build({ accepted_at: null });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const directPaymentPost = directPaymentPostFactory.build();
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));

        fixture.detectChanges();

        expect(loadComponentSpy).toHaveBeenCalled();
        expect(loadComponentSpy).toHaveBeenCalledWith(PadAgreementComponent);
      });

    it('confirm should be called when contract signed in direct call', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const agreementResponse: Agreement = agreementFactory.build({ opt_out_at: null });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const directPaymentPost = directPaymentPostFactory.build();

        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOn(directPaymentService, 'postDirectPayment').and.returnValue(of(null));
        // Need to have set to false to force loading of review component
        const reviewSpy = spyOnProperty(directPaymentService, 'reviewed').and.returnValue(false);

        fixture.detectChanges();

        expect(loadComponentSpy).toHaveBeenCalled();
        expect(loadComponentSpy).toHaveBeenCalledWith(ReviewDirectDebitComponent);
        reviewSpy.and.returnValue(true);
        component.componentRef.instance.nextEvent.emit();
        expect(directPaymentService.postDirectPayment).toHaveBeenCalledTimes(1);
      });

    it('should show bank account verifying error modal if bank account is not verified', () => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'false' }));

        fixture.detectChanges();

        const expected_context: ErrorModalContext = new ErrorModalContext(
          'PENDING_BANK_ACCOUNT_VERIFICATION.TITLE',
          [ 'PENDING_BANK_ACCOUNT_VERIFICATION.BODY_1', 'PENDING_BANK_ACCOUNT_VERIFICATION.BODY_2' ]
        );

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
      });

    it('should go to dashboard if bank account is not verified', () => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'false' }));

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledTimes(0);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });

    it('should log bugsnag and display error modal if failed to load bank account', () => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(throwError(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })));

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledTimes(0);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledTimes(1);
      });

    it('should go to dashboard if failed to load bank account', () => {
        stubIsBankFlowInProgress(false);
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(throwError(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })));

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledTimes(0);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });
  }); // describe - render()

  describe('event handling', () => {
    it('banking service complete event should go to review page', () => {
        stubMerchantHasSelectedBankAccount(true);
        merchantSpy.and.returnValue(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPadAgreement.merchant_id }));
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubDirectDebitPost(directPaymentResponseFactory.build());
        stubSupplierInformation(supplierInfoLcbo);
        fixture.detectChanges();

        bankingFlowService.triggerCompleteEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalled();
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ReviewDirectDebitComponent);
      });

    it('banking service complete event should cause refresh of direct payment', () => {
        stubMerchantHasSelectedBankAccount(true);
        merchantSpy.and.returnValue(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPadAgreement.merchant_id }));
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const sampleResp = directPaymentResponseFactory.build();
        stubDirectDebitPost(sampleResp);
        stubSupplierInformation(supplierInfoLcbo);

        fixture.detectChanges();
        const refreshSpy = spyOn(directPaymentService, 'refreshDirectPayment');
        spyOnProperty(directPaymentService, 'hasActiveDirectDebitSet').and.returnValue(true);

        bankingFlowService.triggerCompleteEvent();

        expect(refreshSpy).toHaveBeenCalledTimes(1);
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ReviewDirectDebitComponent);
      });

    it('banking service complete event should log bugsnag on error if refresh fails', () => {
        stubMerchantHasSelectedBankAccount(true);
        merchantSpy.and.returnValue(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPadAgreement.merchant_id }));
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        spyOnProperty(directPaymentService, 'hasActiveDirectDebitSet').and.returnValue(true);
        const directPaymentPost = directPaymentPostFactory.build();
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOnProperty(directPaymentService, 'reviewed').and.returnValue(false);

        fixture.detectChanges();
        const refreshSpy = spyOn(directPaymentService, 'refreshDirectPayment').and.callFake(() => { throw new Error('Error'); });

        bankingFlowService.triggerCompleteEvent();

        expect(refreshSpy).toHaveBeenCalledTimes(1);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      });

    it('banking service cancel event should go to dashboard', () => {
        stubMerchantHasSelectedBankAccount(true);
        merchantSpy.and.returnValue(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPadAgreement.merchant_id }));
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const directPaymentPost = directPaymentPostFactory.build();
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        fixture.detectChanges();

        bankingFlowService.triggerCancelEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });

    it('review confirm event should confirm and go to the dashboard', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const agreementResponse = agreementFactory.build({
          type: AgreementType.pre_authorized_debit,
          opt_out_at: null
        });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const reviewedSpy = spyOnProperty(directPaymentService, 'reviewed').and.returnValue(false);
        const directPaymentPost = directPaymentPostFactory.build();

        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOn(directPaymentService, 'postDirectPayment').and.returnValue(of(null));
        fixture.detectChanges();
        reviewedSpy.and.returnValue(true);
        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit();
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });

    it('review confirm event should log bugsnag on error', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const agreementResponse = agreementFactory.build({
          type: AgreementType.pre_authorized_debit,
          opt_out_at: null
        });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const reviewedSpy = spyOnProperty(directPaymentService, 'reviewed').and.returnValue(false);
        const directPaymentPost = directPaymentPostFactory.build();

        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOn(directPaymentService, 'postDirectPayment').and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
        fixture.detectChanges();
        reviewedSpy.and.returnValue(true);
        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit();
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      });

    it('review confirm event should show generic error modal on error', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const agreementResponse = agreementFactory.build({
          type: AgreementType.pre_authorized_debit,
          opt_out_at: null
        });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const reviewedSpy = spyOnProperty(directPaymentService, 'reviewed').and.returnValue(false);
        const directPaymentPost = directPaymentPostFactory.build();

        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOn(directPaymentService, 'postDirectPayment').and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
        fixture.detectChanges();
        reviewedSpy.and.returnValue(true);
        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
      });

    it('review cancel event should go to dashboard', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const directPaymentPost = directPaymentPostFactory.build();
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        fixture.detectChanges();

        component.componentRef.instance.cancelEvent.emit();
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });

    it('agreement next event should call confirm', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        merchantSpy.and.returnValue(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPadAgreement.merchant_id }));
        spyOnProperty(directPaymentService, 'reviewed').and.returnValue(true);
        const agreementResponse = agreementFactory.build({
          type: AgreementType.pre_authorized_debit,
          accepted_at: null,
          opt_out_at: null
        });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const directPaymentPost = directPaymentPostFactory.build();

        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOn(directPaymentService, 'postDirectPayment').and.returnValue(of(null));
        fixture.detectChanges();

        agreementResponse.accepted_at = '2019-01-01';
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit();

        expect(directPaymentService.postDirectPayment).toHaveBeenCalledTimes(1);
      });

    it('agreement back event should cancel direct payment', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        merchantSpy.and.returnValue(merchantDataFactory.build({ selected_bank_account: 'ba_123', id: defaultPadAgreement.merchant_id }));
        spyOnProperty(directPaymentService, 'reviewed').and.returnValue(true);
        const agreementResponse: Agreement = agreementFactory.build({
          type: AgreementType.pre_authorized_debit,
          accepted_at: null,
          opt_out_at: null
        });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const directPaymentPost = directPaymentPostFactory.build();
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));

        fixture.detectChanges();

        component.componentRef.instance.backEvent.emit();
        // check it calls cancel
      });

    it('review cancel should only cancel once', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const directPaymentPost = directPaymentPostFactory.build();
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));

        fixture.detectChanges();

        component.componentRef.instance.cancelEvent.emit();
        component.componentRef.instance.cancelEvent.emit();
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(1);
      });

    it('review confirm should only confirm once', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubLoadBankAccount(of(null));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        const agreementResponse = agreementFactory.build({
          type: AgreementType.pre_authorized_debit,
          opt_out_at: null
        });
        agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementResponse));
        const reviewedSpy = spyOnProperty(directPaymentService, 'reviewed').and.returnValue(false);
        const directPaymentPost = directPaymentPostFactory.build();

        spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(supplierInfoLcbo));
        spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(directPaymentPost));
        spyOn(directPaymentService, 'postDirectPayment').and.returnValue(of(null));
        fixture.detectChanges();
        reviewedSpy.and.returnValue(true);
        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit();
        component.componentRef.instance.nextEvent.emit();
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
  });
});
