import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AddGuarantorComponent } from 'app/components/states/add-guarantor/add-guarantor.component';
import { BehaviorSubject, of, Observable, throwError } from 'rxjs';
import { ApprovalPrerequisitesComponent } from './approval-prerequisites.component';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { ReviewLendingApplicationComponent } from 'app/components/states/review-lending-application/review-lending-application.component';
import { UploadDocumentsComponent } from 'app/components/containers/upload-documents/upload-documents.component';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { LendingAgreementComponent } from 'app/components/states/lending-agreement/lending-agreement.component';
import { ApprovalPrerequisitesDirective } from 'app/components/states/approval-prerequisites/approval-prerequisites.directive';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { UtilityService } from 'app/services/utility.service';
import { OfferService } from 'app/services/offer.service';
import { LoadingService } from 'app/services/loading.service';
import { ErrorService } from 'app/services/error.service';
import {
  lendingApplicationApproved,
  lendingApplicationFactory,
  lendingApplicationWaitingForDocuments,
  lendingApplicationReviewing
} from 'app/test-stubs/factories/lending-application';
import { offer, offerWca } from 'app/test-stubs/factories/lending/offers';
import { BankAccountService } from 'app/services/bank-account.service';
import { MerchantService } from 'app/services/merchant.service';
import { CookieService } from 'ngx-cookie-service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UiError } from 'app/models/ui-error';
import { ApplicationState} from 'app/models/api-entities/utility';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { AppRoutes } from 'app/models/routes';
import { ApprovalPostDirective } from 'app/components/states/approval-post/approval-post.directive';
import { ApprovalPostComponent } from 'app/components/states/approval-post/approval-post.component';

import { LendingApplication } from 'app/models/api-entities/lending-application';
import { LoggingService } from 'app/services/logging.service';
import { ALL_DOC_CODES, DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { Offer } from 'app/models/api-entities/offer';
import { MarkdownModule } from 'ngx-markdown';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { RouterTestingModule } from '@angular/router/testing';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage } from "app/models/error-response";

describe('ApprovalPrerequisitesComponent', () => {
  let component: ApprovalPrerequisitesComponent;
  let fixture: ComponentFixture<ApprovalPrerequisitesComponent>;

  let bankAccountService;
  let componentLoader;
  let errorService;
  let loggingService;
  let loadingService;
  let merchantService;
  let offerService;

  let stateRoutingService: StateRoutingService;

  let stubLendingApplication;
  let stubOffer;
  let stubCancelApplication;
  let stubMerchantHasSelectedBankAccount;

  let loadComponentSpy: jasmine.Spy;
  let bankingFlowService: BankingFlowService;
  let lendingApplicationsService: LendingApplicationsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        MarkdownModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [
        ApprovalPrerequisitesComponent,
        ApprovalPrerequisitesDirective,
        SetUpBankComponent,
        ReviewLendingApplicationComponent,
        LendingAgreementComponent,
        UploadDocumentsComponent,
        ApprovalPendingComponent,
        ApprovalPostComponent,
        ApprovalPostDirective
      ],
      providers: [
        LendingApplicationsService,
        OfferService,
        LoadingService,
        ErrorService,
        UtilityService,
        BankAccountService,
        MerchantService,
        CookieService,
        DynamicComponentService,
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
          UploadDocumentsComponent,
          ApprovalPendingComponent,
          ApprovalPostComponent
        ],
      }
    })
    .compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(ApprovalPrerequisitesComponent);
      component = fixture.componentInstance;

      bankAccountService = TestBed.inject(BankAccountService);
      componentLoader = TestBed.inject(DynamicComponentService);
      errorService = TestBed.inject(ErrorService);
      loadingService = TestBed.inject(LoadingService);
      loggingService = TestBed.inject(LoggingService);
      merchantService = TestBed.inject(MerchantService);
      offerService = TestBed.inject(OfferService);
      stateRoutingService = TestBed.inject(StateRoutingService);

      spyOn(stateRoutingService, 'navigate');

      // Stubs
      stubLendingApplication = (val: LendingApplication) =>
        spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(val));
      stubOffer = (val: Offer) =>
        spyOnProperty(offerService, 'offer$').and.returnValue(new BehaviorSubject(val));
      stubMerchantHasSelectedBankAccount = (val: boolean) =>
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(val);
      stubCancelApplication = (response: Observable<any>) => // eslint-disable-line
        spyOn(lendingApplicationsService, 'cancel').and.returnValue(response);

      // Spies
      loadComponentSpy = spyOn(componentLoader, 'loadComponent');
      spyOn(loadingService, 'hideMainLoader');
      spyOn(loadingService, 'showMainLoader');
      spyOn(loggingService, 'log');
      spyOn(Bugsnag, 'notify');

      bankingFlowService = TestBed.inject(BankingFlowService);
      lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should call showMainLoader', () => {
        fixture.detectChanges();

        expect(loadingService.showMainLoader).toHaveBeenCalledTimes(1);
      });

    it('should eventually call hideMainLoader', () => {
        fixture.detectChanges();

        expect(loadingService.hideMainLoader).toHaveBeenCalledTimes(1);
      });

    it('should set increaseLimit in BankAccountService to false', () => {
      fixture.detectChanges();

      expect(bankAccountService.increaseLimit).toEqual(false);
    });

    it('should set correct banking flow parameters in BankingFlowService', () => {
      fixture.detectChanges();

      expect(bankingFlowService.skippable).toEqual(false);
    });

    describe('Load component', () => {
      it('should goTo approval_post when application is approved', () => {
        stubMerchantHasSelectedBankAccount(true);
        stubOffer(offerWca);
        stubLendingApplication(lendingApplicationApproved);

        fixture.detectChanges();
        // NOTE: toHaveBeenCalledOnceWith is a thing.
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.approval_post, true);
      });

      it('should call loadComponent if application is not approved', () => {
        stubOffer(offerWca);
        const application = lendingApplicationFactory.build({ state: ApplicationState.reviewing });
        stubLendingApplication(application);

        fixture.detectChanges();

        expect(loadComponentSpy).toHaveBeenCalledTimes(1);
      });

      it('should call loadComponent with UploadDocumentsComponent when application state is waiting_for_documents', () => {
        stubOffer(offerWca);
        stubMerchantHasSelectedBankAccount(true);
        const application = lendingApplicationFactory.build({ state: ApplicationState.waiting_for_documents });
        stubLendingApplication(application);

        fixture.detectChanges();

        expect(loadComponentSpy).toHaveBeenCalledOnceWith(UploadDocumentsComponent);
      });

      it('should call loadComponent with ApprovalPendingComponent when application is in reviewing state and no guarantor is required', () => {
        stubOffer(offerWca);
        stubMerchantHasSelectedBankAccount(true);
        const application = lendingApplicationFactory.build({ state: ApplicationState.reviewing });
        stubLendingApplication(application);

        fixture.detectChanges();

        expect(loadComponentSpy).toHaveBeenCalledOnceWith(ApprovalPendingComponent);
      });

      it('should call loadComponent with AddGuarantorComponent when application is in reviewing state and a guarantor is required', () => {
        stubOffer(offerWca);
        stubMerchantHasSelectedBankAccount(true);
        const application = lendingApplicationFactory.build({ state: ApplicationState.reviewing, requires_guarantor: true });
        stubLendingApplication(application);

        fixture.detectChanges();

        expect(loadComponentSpy).toHaveBeenCalledOnceWith(AddGuarantorComponent);
      });

      it('should display general error modal when application state is not recognised in this context', () => {
          stubOffer(offerWca);
          stubMerchantHasSelectedBankAccount(true);
          const application = lendingApplicationFactory.build({ state: null });
          stubLendingApplication(application);
          spyOn(errorService, 'show');

          fixture.detectChanges();

          expect(errorService.show).toHaveBeenCalledWith(UiError.general);
        });

      it('should notify Bugsnag when application state is not recognised in this context', () => {
          stubOffer(offerWca);
          stubMerchantHasSelectedBankAccount(true);
          const invalidState = null;
          const application = lendingApplicationFactory.build({ state: invalidState });
          stubLendingApplication(application);
          fixture.detectChanges();

          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        });
    });
  });

  describe('When cancel event from BankingFlowService is triggered', () => {
    it('should successfully cancel application and route to dashboard', () => {
      stubLendingApplication(lendingApplicationApproved);
      stubCancelApplication(of(null));

      fixture.detectChanges();
      bankingFlowService.triggerCancelEvent();

      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      expect(lendingApplicationsService.cancel).toHaveBeenCalledWith(lendingApplicationApproved.id);
    });

    it('should display error modal on failure', () => {
        stubLendingApplication(lendingApplicationApproved);
        stubCancelApplication(throwError({}));
        spyOn(errorService, 'show');

        fixture.detectChanges();
        bankingFlowService.triggerCancelEvent();

        expect(errorService.show).toHaveBeenCalledWith(UiError.cancelLendingApplication);
      });

    it('should notify Bugsnag when it fails to cancel the application', () => {
        stubLendingApplication(lendingApplicationApproved);
        stubCancelApplication(throwError(internalServerErrorFactory.build()));

        fixture.detectChanges();
        bankingFlowService.triggerCancelEvent();

        expect(lendingApplicationsService.cancel).toHaveBeenCalledWith(lendingApplicationApproved.id);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      });

      it('should notify Bugsnag when it fails to cancel the application', () => {
          stubLendingApplication(lendingApplicationApproved);
          stubCancelApplication(throwError(null));

          fixture.detectChanges();
          bankingFlowService.triggerCancelEvent();

          expect(lendingApplicationsService.cancel).toHaveBeenCalledWith(lendingApplicationApproved.id);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        });
  });

  describe('When skip event from BankingFlowService is triggered', () => {
    it('should set skipBankingFlow to true', () => {
        stubLendingApplication(lendingApplicationApproved);
        expect(component.skipBankingFlow).toEqual(false);

        fixture.detectChanges();
        bankingFlowService.triggerSkipEvent();

        expect(component.skipBankingFlow).toEqual(true);
      });

    it('should load SetUpBankComponent if merchantHasSelectedBankAccount returns false and skipBankingFlow is false', () => {
        stubMerchantHasSelectedBankAccount(false);
        component.skipBankingFlow = false;
        stubLendingApplication(lendingApplicationApproved);

        fixture.detectChanges();
        bankingFlowService.triggerSkipEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });

    it('should state route to approval_post if application is in approved state', () => {
      stubMerchantHasSelectedBankAccount(true);
      component.skipBankingFlow = false;
      stubLendingApplication(lendingApplicationApproved);

      fixture.detectChanges();
      bankingFlowService.triggerSkipEvent();

      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.approval_post, true);
    });

    it('should load UploadDocumentsComponent if application is in waiting_for_documents state', () => {
        stubMerchantHasSelectedBankAccount(true);
        component.skipBankingFlow = false;
        stubLendingApplication(lendingApplicationWaitingForDocuments);

        fixture.detectChanges();
        bankingFlowService.triggerSkipEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(UploadDocumentsComponent);
      });

    it('should load ApprovalPendingComponent if application is in reviewing state', () => {
        stubMerchantHasSelectedBankAccount(true);
        component.skipBankingFlow = false;
        stubLendingApplication(lendingApplicationReviewing);

        fixture.detectChanges();
        bankingFlowService.triggerSkipEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ApprovalPendingComponent);
      });
  });

  describe('When complete event from BankingFlowService is triggered', () => {
    it('should load SetUpBankComponent if merchantHasSelectedBankAccount returns false and skipBankingFlow is false', () => {
        stubMerchantHasSelectedBankAccount(false);
        component.skipBankingFlow = false;
        stubLendingApplication(lendingApplicationApproved);

        fixture.detectChanges();
        bankingFlowService.triggerCompleteEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(SetUpBankComponent);
      });

    it('should state route to approval_post if application is in approved state', () => {
      stubMerchantHasSelectedBankAccount(true);
      component.skipBankingFlow = false;
      stubLendingApplication(lendingApplicationApproved);

      fixture.detectChanges();
      bankingFlowService.triggerCompleteEvent();

      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.approval_post, true);
    });

    it('should load UploadDocumentsComponent if application is in waiting_for_documents state', () => {
        stubMerchantHasSelectedBankAccount(true);
        component.skipBankingFlow = false;
        stubLendingApplication(lendingApplicationWaitingForDocuments);

        fixture.detectChanges();
        bankingFlowService.triggerCompleteEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(UploadDocumentsComponent);
      });

    it('should load ApprovalPendingComponent if application is in reviewing state', () => {
        stubMerchantHasSelectedBankAccount(true);
        component.skipBankingFlow = false;
        stubLendingApplication(lendingApplicationReviewing);

        fixture.detectChanges();
        bankingFlowService.triggerCompleteEvent();

        expect(componentLoader.loadComponent).toHaveBeenCalledWith(ApprovalPendingComponent);
      });
  });

  describe('Required documents', () => {
    beforeEach(() => {
      stubOffer(offer);
      const application = lendingApplicationFactory.build({ state: ApplicationState.waiting_for_documents });
      stubLendingApplication(application);
    });

    it('should trigger a log for each unsupported document retrieved', () => {
        const docs = ALL_DOC_CODES;
        stubMerchantHasSelectedBankAccount(true);
        spyOn(lendingApplicationsService, 'getRequiredDocuments').and.returnValue(docs);

        fixture.detectChanges();

        docs.filter(doc => doc !== DocumentCode.cra_tax_assessment)
          .forEach((doc) => {
            const expectedMessage = new ErrorMessage(`Unsupported required document detected: ${doc}`);
            expect(loggingService.log).toHaveBeenCalledWith(expectedMessage);
          });

        expect(loggingService.log).toHaveBeenCalledTimes(docs.length - 1);
      });

    it('should not trigger a log if there are only supported documents', () => {
        const docs = [ DocumentCode.cra_tax_assessment];
        spyOn(lendingApplicationsService, 'getRequiredDocuments').and.returnValue(docs);

        fixture.detectChanges();

        expect(loggingService.log).not.toHaveBeenCalled();
      });

    it('should not trigger a log if there are no documents', () => {
        const docs = [];
        spyOn(lendingApplicationsService, 'getRequiredDocuments').and.returnValue(docs);

        fixture.detectChanges();

        expect(loggingService.log).not.toHaveBeenCalled();
      });
  });

  it('should not call LendingApplicationService.cancel if cancellingApplication is true', () => {
    spyOn(lendingApplicationsService, 'cancel');
    component.cancellingApplication = true;
    component.ngOnInit();
    bankingFlowService.cancelEvent.emit();
    expect(lendingApplicationsService.cancel).not.toHaveBeenCalled();
  });
});
