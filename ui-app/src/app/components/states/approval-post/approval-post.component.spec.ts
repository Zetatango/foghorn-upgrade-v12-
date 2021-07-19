import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApprovalPostDirective } from 'app/components/states/approval-post/approval-post.directive';
import { ApprovalPostComponent } from 'app/components/states/approval-post/approval-post.component';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { ReviewLendingApplicationComponent } from 'app/components/states/review-lending-application/review-lending-application.component';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { LendingAgreementComponent } from 'app/components/states/lending-agreement/lending-agreement.component';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { ReauthService } from 'app/services/reauth.service';
import { LoadingService } from 'app/services/loading.service';
import { ErrorService } from 'app/services/error.service';
import { UtilityService } from 'app/services/utility.service';
import { OfferService } from 'app/services/offer.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import {
  lendingApplicationApproved,
  lendingApplicationCancelled, lendingApplicationFactory,
  lendingApplicationResponseFactory,
} from 'app/test-stubs/factories/lending-application';
import { BankAccountService } from 'app/services/bank-account.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UiError } from 'app/models/ui-error';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { bankAccountFactory } from 'app/test-stubs/factories/bank-account';
import { LoggingService } from 'app/services/logging.service';
import { BankAccount } from 'app/models/bank-account';
import { Merchant } from 'app/models/api-entities/merchant';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { MarkdownModule } from 'ngx-markdown';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from 'app/models/error-response';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { HttpErrorResponse } from '@angular/common/http';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { MockProvider } from 'ng-mocks';
import { AppLoadService } from 'app/services/app-load.service';

describe('ApprovalPostComponent', () => {
  let component: ApprovalPostComponent;
  let fixture: ComponentFixture<ApprovalPostComponent>;

  let bankAccountService;
  let bankingFlowService;
  let componentLoader;
  let errorService;
  let lendingApplicationsService;
  let loadingService;
  let loggingService;
  let merchantService;

  let stateRoutingService: StateRoutingService;

  let stubMerchant;
  let stubLendingApplication;
  let stubCancelApplication;
  let stubAcceptApplication;
  let stubBankAccount;
  let stubMerchantHasSelectedBankAccount;
  let stubSignatureRequired;
  let stubIsBankFlowInProgress;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        MarkdownModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [
        ApprovalPostComponent,
        ApprovalPostDirective,
        SetUpBankComponent,
        ReviewLendingApplicationComponent,
        LendingAgreementComponent,
        ApprovalPendingComponent,
        ZttCurrencyPipe
      ],
      providers: [
        MockProvider(AppLoadService),
        LendingApplicationsService,
        LoadingService,
        ReauthService,
        ErrorService,
        BankAccountService,
        BankingFlowService,
        UtilityService,
        MerchantService,
        DynamicComponentService,
        CookieService,
        OfferService,
        LoggingService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          SetUpBankComponent,
          ReviewLendingApplicationComponent,
          LendingAgreementComponent,
          ApprovalPendingComponent
        ],
      }
    })
    .compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(ApprovalPostComponent);
      component = fixture.componentInstance;

      bankAccountService = TestBed.inject(BankAccountService);
      bankingFlowService = TestBed.inject(BankingFlowService);
      componentLoader = TestBed.inject(DynamicComponentService);
      errorService = TestBed.inject(ErrorService);
      lendingApplicationsService = TestBed.inject(LendingApplicationsService);
      loadingService = TestBed.inject(LoadingService);
      loggingService = TestBed.inject(LoggingService);
      merchantService = TestBed.inject(MerchantService);
      stateRoutingService = TestBed.inject(StateRoutingService);

      spyOn(stateRoutingService, 'navigate');

      // Specific Stubs
      stubMerchant = (value: Merchant) =>
        spyOn(merchantService, 'getMerchant').and.returnValue(value);

      stubLendingApplication = (value: LendingApplication) =>
        spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(value));

      stubCancelApplication = (response: Observable<any>) => // eslint-disable-line
        spyOn(lendingApplicationsService, 'cancel').and.returnValue(response);

      stubAcceptApplication = (response: Observable<any>) => // eslint-disable-line
        spyOn(lendingApplicationsService, 'accept').and.returnValue(response);

      stubBankAccount = (value: BankAccount) =>
        spyOnProperty(bankAccountService, 'bankAccount').and.returnValue(new BehaviorSubject(value));

      stubMerchantHasSelectedBankAccount = (value: boolean) =>
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(value);

      stubIsBankFlowInProgress = (value: boolean) =>
        spyOn(bankingFlowService, 'isBankFlowInProgress').and.returnValue(value);

      stubSignatureRequired = (value: boolean) =>
        spyOnProperty(component, 'signatureRequired').and.returnValue(value);

      // Spies
      spyOn(loadingService, 'hideMainLoader');
      spyOn(loadingService, 'showMainLoader');
      spyOn(componentLoader, 'loadComponent').and.callThrough(); // so component ref gets set
      spyOn(errorService, 'show');
      spyOn(loggingService, 'log');
      spyOn(Bugsnag, 'notify');
    });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should set lendingApplication via subscription', () => {
      stubLendingApplication(lendingApplicationApproved);
      fixture.detectChanges();

      expect(component.lendingApplication).toEqual(lendingApplicationApproved);
    });

    it('should set signatureRequired when there is an application', () => {
      const application = lendingApplicationFactory.build({ terms_signature_required: true });
      stubLendingApplication(application);

      expect(component.signatureRequired).toBeFalsy();

      fixture.detectChanges();

      expect(component.signatureRequired).toBeTruthy();
    });

    it('should set signatureRequired to false if application is null', () => {
      stubLendingApplication(null);

      expect(component.signatureRequired).toBeFalsy();

      fixture.detectChanges();

      expect(component.signatureRequired).toBeFalsy();
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

    it('should eventually set componentRef in component', () => {
      expect(component.componentRef).toBeFalsy();

      fixture.detectChanges();
      expect(component.componentRef).toBeTruthy();
    });
  }); // describe - ngOnInit()

  describe('ngOnDestroy()', () => {
    it('should clear BankingFlowService attributes', () => {
        spyOn(bankingFlowService, 'clearAttributes');
        fixture.destroy();

        expect(bankingFlowService.clearAttributes).toHaveBeenCalledTimes(1);
      });
  });

  // ----------------------------------------------------------------------------- render()
  describe('render()', () => {
    it('should call loadComponent with SetUpBankComponent bank flow is in progress', () => {
        stubIsBankFlowInProgress(true);

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalled();
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });

    it('should call loadComponent with ReviewLendingApplicationComponent if banking flow is not in progress', () => {
        stubIsBankFlowInProgress(false);
        stubLendingApplication(lendingApplicationApproved);

        fixture.detectChanges();

        expect(componentLoader.loadComponent).toHaveBeenCalledOnceWith(ReviewLendingApplicationComponent);
      });
  }); // describe - render()

  describe('when NEXT event emitted', () => {
    it('should call loadComponent with SetUpBankComponent when merchant does not have selected bank account', () => {
        stubMerchantHasSelectedBankAccount(false);

        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit();

        expect(componentLoader.loadComponent).toHaveBeenCalledTimes(2); // Once from render() & then once from the next event.
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });

    it('should call loadComponent with LendingAgreementComponent if signature is required', fakeAsync(() => {
        stubMerchantHasSelectedBankAccount(true);
        stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123' }));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubSignatureRequired(true);

        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit();
        tick();

        expect(componentLoader.loadComponent).toHaveBeenCalledTimes(2); // Once from render() & then once from the next event.
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(LendingAgreementComponent);
      }));

    it('should accept application and go to completing page if signature is not required and bank account is verified', fakeAsync(() => {
        stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123' }));
        stubMerchantHasSelectedBankAccount(true);
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubSignatureRequired(false);
        stubLendingApplication(lendingApplicationApproved);
        stubAcceptApplication(of(null));

        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit();
        tick(); // force updateMerchantBankAccount() to resolve

        expect(lendingApplicationsService.accept).toHaveBeenCalledTimes(1);
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.completing_lending_application, true);
      }));

    describe('accept application fails', () => {
      beforeEach(() => {
        stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123' }));
        stubMerchantHasSelectedBankAccount(true);
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubSignatureRequired(false);
        stubLendingApplication(lendingApplicationApproved);
      });

      it('should trigger error modal and notify Bugsnag', fakeAsync(() => {
        stubAcceptApplication(throwError(new ErrorResponse(internalServerErrorFactory.build())));
        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit();
        tick();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.acceptLendingApplication);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      }));

      it('set Bugsnag severity to info if error code is 20004', fakeAsync(() => {
        const err = new ErrorResponse(new HttpErrorResponse({ status: 404, error: { code: 20004 }}));
        const expectedErr = new ErrorResponse(new HttpErrorResponse({ status: 404, error: { code: 20004 }}));
        expectedErr.customSeverity = BugsnagSeverity.info;

        stubAcceptApplication(throwError(err));
        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit();
        tick();

        expect(Bugsnag.notify).toHaveBeenCalledOnceWith(expectedErr);
      }));
    });

    it('should not try to accept the current lending application if already accepting one', fakeAsync(() => {
        stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123' }));
        stubMerchantHasSelectedBankAccount(true);
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubSignatureRequired(false);
        stubLendingApplication(lendingApplicationApproved);
        stubAcceptApplication(of(lendingApplicationResponseFactory.build()).pipe(delay(100)));

        fixture.detectChanges();
        // attempt to accept twice

        component.componentRef.instance.nextEvent.emit(); // go to agreement page where accept event will be emitted
        component.componentRef.instance.nextEvent.emit(); // re-attempt
        tick(100); // force updateMerchantBankAccount() to resolve

        expect(lendingApplicationsService.accept).toHaveBeenCalledTimes(1);
      }));
  }); // describe - when NEXT event emitted

  // --------------------------------------------------------- CANCEL EVENT - from BankFlow

  describe('when CANCEL event from BankingFlowService is triggered', () => {
    it('should load ReviewLendingApplicationComponent component', () => {
        stubLendingApplication(lendingApplicationApproved);

        fixture.detectChanges();
        bankingFlowService.triggerCancelEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ReviewLendingApplicationComponent);
      });
  }); // describe - when CANCEL event from BankingFlowService is triggered

  // ------------------------------------------------------------------------- CANCEL EVENT

  describe('when CANCEL event is emitted', () => {
    it('should successfully cancel application and route to dashboard', () => {
        stubLendingApplication(lendingApplicationApproved);
        stubCancelApplication(of(lendingApplicationResponseFactory.build({ data: lendingApplicationCancelled })));

        fixture.detectChanges();

        component.componentRef.instance.cancelEvent.emit(); // cancel emitted from reviewLendingApplicationComponent

        expect(lendingApplicationsService.cancel).toHaveBeenCalledTimes(1);
      });

    it('should not try to cancel application if already cancelling it', fakeAsync(() => {
        stubLendingApplication(lendingApplicationApproved);
        stubCancelApplication(of(lendingApplicationResponseFactory.build({ data: lendingApplicationCancelled })));

        // Attempt double cancel
        fixture.detectChanges();
        component.componentRef.instance.cancelEvent.emit(); // cancel emitted from reviewLendingApplicationComponent
        component.componentRef.instance.cancelEvent.emit(); // cancel emitted from reviewLendingApplicationComponent
        tick(100);

        expect(lendingApplicationsService.cancel).toHaveBeenCalledTimes(1);
      }));

    it('should trigger error modal and notify Bugsnag if call to cancel application fails', fakeAsync(() => {
        stubLendingApplication(lendingApplicationApproved);
        stubCancelApplication(throwError(new ErrorResponse(internalServerErrorFactory.build())));

        fixture.detectChanges();
        component.componentRef.instance.cancelEvent.emit();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.cancelLendingApplication);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      }));
  }); // describe - when CANCEL event is emitted

  // -------------------------------------------------------- COMPLETE EVENT - from BankFlow

  describe('when COMPLETE event from BankingFlowService is triggered', () => {
    it('should load ReviewLendingApplicationComponent', () => {
        stubLendingApplication(lendingApplicationApproved);

        fixture.detectChanges();
        bankingFlowService.triggerCompleteEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ReviewLendingApplicationComponent);
      });
  }); // describe - when COMPLETE event from BankingFlowService is triggered

  // ---------------------------------------------------------- START EVENT - from BankFlow

  describe('when START event from BankingFlowService is triggered', () => {
    it('should load SetUpBankComponent', () => {
        fixture.detectChanges();
        bankingFlowService.triggerStartEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });
  }); // describe - when START event from BankingFlowService is triggered


  describe('when BACK event is emitted', () => {
    it('should go to review lending application page', fakeAsync(() => {
        stubMerchantHasSelectedBankAccount(true);
        stubMerchant(merchantDataFactory.build({ selected_bank_account: 'ba_123' }));
        stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
        stubSignatureRequired(true);

        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit(); // go to agreement page first
        tick(); // force updateMerchantBankAccount() to resolve

        component.componentRef.instance.backEvent.emit(); // back emitted from agreement page

        expect(componentLoader.loadComponent).toHaveBeenCalledTimes(3); // initial render (review) + next (agreement) + back (review)
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(LendingAgreementComponent);
        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ReviewLendingApplicationComponent);
      }));
  });

  // ------------------------------------------------------------- ACCEPT APPLICATION EVENT

  describe('when acceptApplication event is triggered', () => {
    beforeEach(() => {
      stubMerchant(merchantDataFactory.build());
      stubBankAccount(bankAccountFactory.build({ verified: 'true' }));
      stubMerchantHasSelectedBankAccount(true);
      stubLendingApplication(lendingApplicationApproved);
    });

    it('should be able to accept the application', fakeAsync(() => {
        stubSignatureRequired(true);
        stubAcceptApplication(of(lendingApplicationResponseFactory.build()));

        fixture.detectChanges();

        component.componentRef.instance.nextEvent.emit(); // go to agreement page where accept event will be emitted
        tick(); // force updateMerchantBankAccount() to resolve
        component.componentRef.instance.acceptApplicationEvent.emit();

        expect(lendingApplicationsService.accept).toHaveBeenCalledTimes(1);
      }));

    it('should show a specific error modal if failed accepting the current lending application', fakeAsync(() => {
        stubSignatureRequired(true);
        stubAcceptApplication(throwError({}));

        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit(); // go to agreement page where accept event will be emitted
        tick(); // force updateMerchantBankAccount() to resolve
        component.componentRef.instance.acceptApplicationEvent.emit();

        expect(errorService.show).toHaveBeenCalledWith(UiError.acceptLendingApplication);
      }));

    it('should navigate to completing_lending_application if accept is successful', fakeAsync(() => {
        stubSignatureRequired(true);
        stubAcceptApplication(of(lendingApplicationResponseFactory.build()));

        fixture.detectChanges();
        component.componentRef.instance.nextEvent.emit(); // go to agreement page where accept event will be emitted
        tick(); // force updateMerchantBankAccount() to resolve
        component.componentRef.instance.acceptApplicationEvent.emit();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.completing_lending_application, true);
      }));
  }); // describe - acceptLendingApplication()

}); // describe - ApprovalPostComponent
