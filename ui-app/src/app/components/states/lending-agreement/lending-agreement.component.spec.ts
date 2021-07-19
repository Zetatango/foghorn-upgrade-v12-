import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LendingAgreement } from 'app/models/api-entities/lending-agreement';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ReauthService } from 'app/services/reauth.service';
import { UtilityService } from 'app/services/utility.service';
import { goodLendingApplicationTerms } from 'app/test-stubs/api-entities-stubs';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { LendingAgreementComponent } from './lending-agreement.component';
import { MarkdownModule } from 'ngx-markdown';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';

describe('LendingAgreementComponent', () => {
  let component: LendingAgreementComponent;
  let fixture: ComponentFixture<LendingAgreementComponent>;
  let errorService: ErrorService;
  let lendingApplicationsService: LendingApplicationsService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let reauthService: ReauthService;

  let notifyBugsnagSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule, MarkdownModule.forRoot()],
      declarations: [LendingAgreementComponent],
      providers: [
        CookieService,
        ErrorService,
        LendingApplicationsService,
        LoggingService,
        MerchantService,
        ReauthService,
        UtilityService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LendingAgreementComponent);
    component = fixture.componentInstance;

    errorService = TestBed.inject(ErrorService);
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    reauthService = TestBed.inject(ReauthService);
    notifyBugsnagSpy = spyOn(Bugsnag, 'notify');
    spyOn(loggingService, 'GTMUpdate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isProcessingAgreement()', () => {
    it('should initially be false', () => {
      expect(component.isProcessingAgreement).toBeFalse();
    });
  }); // describe - isButtonDisabled()

  // ----------------------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    it('should load lending application and terms on init', () => {
      spyOn(lendingApplicationsService, 'loadApplications').and.returnValue(of(null));
      spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationApproved));
      spyOn(lendingApplicationsService, 'loadTerms').and.returnValue(of(null));
      spyOnProperty(lendingApplicationsService, 'terms$').and.returnValue(new BehaviorSubject<LendingAgreement>(goodLendingApplicationTerms));

      spyOn(component, 'setLendingApplicationSubscription').and.callThrough();

      component.ngOnInit();

      expect(component.setLendingApplicationSubscription).toHaveBeenCalledTimes(1);
      expect(component.lendingApplication).toEqual(lendingApplicationApproved);
      expect(component.currentTerms).toEqual(goodLendingApplicationTerms);
    });

    it('should handle failure to load applications on init', () => {
      spyOn(lendingApplicationsService, 'loadApplications').and.returnValue(throwError({}));
      spyOn(errorService, 'show');

      component.ngOnInit();

      expect(errorService.show).toHaveBeenCalledWith(UiError.loadLendingApplications);
    });
  }); // describe - ngOnInit()

  // --------------------------------------------------------------------- loadTerms()
  describe('loadTerms()', () => {
    it('should set currentTerms based on loadTerms response', () => {
      spyOn(lendingApplicationsService, 'loadTerms').and.returnValue(of(null));
      spyOnProperty(lendingApplicationsService, 'terms$').and.returnValue(new BehaviorSubject<LendingAgreement>(goodLendingApplicationTerms));
      component.lendingApplication = lendingApplicationApproved;

      component.loadTerms();

      expect(component.currentTerms).toEqual(goodLendingApplicationTerms);
    });

    it('should set loaded to true on receipt of terms in subscription', () => {
      spyOn(lendingApplicationsService, 'loadTerms').and.returnValue(of(null));
      spyOnProperty(lendingApplicationsService, 'terms$').and.returnValue(new BehaviorSubject<LendingAgreement>(goodLendingApplicationTerms));
      component.lendingApplication = lendingApplicationApproved;

      expect(component.loaded).toBeFalsy();

      component.loadTerms();

      expect(component.loaded).toBeTruthy();
    });

    it('should display general error modal on failure', () => {
      spyOn(lendingApplicationsService, 'loadTerms').and.returnValue(throwError(null));
      spyOn(errorService, 'show');
      component.lendingApplication = lendingApplicationApproved;

      component.loadTerms();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });
  }); // describe - loadTerms()

  // --------------------------------------------------------------------- signAgreementByReauth()
  describe('signAgreementByReauth()', () => {
    it('should open new tab via reauth service if user has selected bank account', () => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: 'success' }));
      spyOn(component, 'acceptLendingApplication');

      component.signAgreementByReauth();

      expect(reauthService.open).toHaveBeenCalledTimes(1);
      expect(component.acceptLendingApplication).toHaveBeenCalledTimes(1);
    });

    it('should not proceed when the reauthService returns an invalid response', () => {
      spyOn(reauthService, 'open').and.returnValue(of(null));
      spyOn(component, 'acceptLendingApplication');

      component.signAgreementByReauth();

      expect(reauthService.open).toHaveBeenCalledTimes(1);
      expect(component.acceptLendingApplication).not.toHaveBeenCalledTimes(1);
      expect(component.isProcessingAgreement).toBeFalse();
    });

    it('should not open new tab via reauth service if user is in delegated access', () => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: 'success' }));
      spyOn(component, 'acceptLendingApplication');
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(true);

      component.signAgreementByReauth();

      expect(reauthService.open).not.toHaveBeenCalled();
      expect(component.acceptLendingApplication).not.toHaveBeenCalled();
    });

    it('should trigger delegated mode modal if user is in delegated access', () => {
      spyOn(errorService, 'show');
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(true);

      component.signAgreementByReauth();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
    });

    it('should call loggingService.GTMUpdate with correct button label', () => {
      component.signAgreementByReauth();

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Sign Agreement');
    });

    describe('if reauth resolves with anything else other success', () => {
      it('should not call acceptLendingApplication()', () => {
        spyOn(reauthService, 'open').and.returnValue(of({ status: 'fluffykins' })); // Whatever data content
        spyOn(component, 'acceptLendingApplication');

        component.signAgreementByReauth();

        expect(reauthService.open).toHaveBeenCalledTimes(1);
        expect(component.acceptLendingApplication).toHaveBeenCalledTimes(0);
      });

      it('the first time, should be able to acceptLendingApplication() again', () => {

        const reauthSpy = spyOn(reauthService, 'open');
        const acceptSpy = spyOn(component, 'acceptLendingApplication');

        // Missed Reauth Attempt ------------------------------------------------
        reauthSpy.and.returnValue(of({ status: 'fluffykins' })); // Whatever data content
        component.signAgreementByReauth();

        expect(reauthService.open).toHaveBeenCalledTimes(1);
        expect(component.acceptLendingApplication).toHaveBeenCalledTimes(0);

        // Successfull Reauth Attempt -------------------------------------------
        reauthSpy.calls.reset();
        reauthSpy.and.returnValue(of({ status: 'success' }));
        acceptSpy.calls.reset();
        component.signAgreementByReauth();

        expect(reauthService.open).toHaveBeenCalledTimes(1);
        expect(component.acceptLendingApplication).toHaveBeenCalledTimes(1);
      });
    });

    it('should not try to open new tab via reauth service if already performing one', () => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: 'success' }));
      spyOn(component, 'acceptLendingApplication');

      // Attempt double reauth
      component.signAgreementByReauth();
      component.signAgreementByReauth();

      expect(reauthService.open).toHaveBeenCalledTimes(1);
      expect(component.acceptLendingApplication).toHaveBeenCalledTimes(1);
    });

    it('should handle error from reauth service', () => {
      spyOn(reauthService, 'open').and.returnValue(throwError({}));
      spyOn(errorService, 'show');

      component.signAgreementByReauth();

      expect(errorService.show).toHaveBeenCalledWith(UiError.signByReauth);
    });

    it('should trigger a bugsnag if reauth fails', () => {
      const reauthSpy = spyOn(reauthService, 'open');
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      const errors: any[] = [null, {}, internalServerErrorFactory.build()]; // eslint-disable-line
      errors.forEach(error => {
        reauthSpy.and.returnValue(throwError(error));

        component.signAgreementByReauth();

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        notifyBugsnagSpy.calls.reset();
      });
    });
  }); // describe - signAgreementByReauth()

  // ------------------------------------------------------------------ acceptLendingApplication()
  describe('acceptLendingApplication()', () => {
    it('should emit acceptApplication event', () => {
      component.lendingApplication = lendingApplicationApproved;
      spyOn(component.acceptApplicationEvent, 'emit');

      component.acceptLendingApplication();

      expect(component.acceptApplicationEvent.emit).toHaveBeenCalledTimes(1);
    });
  }); // describe - acceptLendingApplication()

  // NAVIGATION

  // -------------------------------------------------------------------------------------- back()
  describe('back()', () => {
    it('should emit back event', () => {
      spyOn(component.backEvent, 'emit');
      component.back();

      expect(component.backEvent.emit).toHaveBeenCalledTimes(1);
    });
  }); // describe - back()
});
