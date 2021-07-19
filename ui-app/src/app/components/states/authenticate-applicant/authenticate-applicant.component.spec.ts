import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApplicantAuthentication } from 'app/models/api-entities/applicant-authentication';
import { ApplicantAuthenticationComplete } from 'app/models/api-entities/applicant-authentication-complete';
import { AuthenticateApplicant } from 'app/models/authenticate-applicant';
import { UiError } from 'app/models/ui-error';
import { ApplicantService } from 'app/services/applicant.service';
import { ErrorService } from 'app/services/error.service';
import { LoadingService } from 'app/services/loading.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { get_goodAuthenticateResponses, get_goodInitAuthenticateResponse } from 'app/test-stubs/api-entities-stubs';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { userPropertiesFactory } from 'app/test-stubs/factories/user-session';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { AuthenticateApplicantComponent } from './authenticate-applicant.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';
import { internalServerErrorFactory, serviceUnavailableFactory } from 'app/test-stubs/factories/response';
import { ErrorResponse } from "app/models/error-response";


describe('AuthenticateApplicantComponent', () => {
  let component: AuthenticateApplicantComponent;
  let fixture: ComponentFixture<AuthenticateApplicantComponent>;

  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
       ],
      declarations: [ AuthenticateApplicantComponent ],
      providers: [
        CookieService,
        ErrorService,
        LoadingService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        UserSessionService,
        UtilityService,
        { provide: ApplicantService,
          useValue: {
            getInitAuthenticateSubject: () => new BehaviorSubject<ApplicantAuthentication>(get_goodInitAuthenticateResponse.data),
            getAuthenticateSubject: () => new BehaviorSubject<ApplicantAuthenticationComplete>(get_goodAuthenticateResponses[0].data),
            setInitAuthenticationSubject: () => undefined,
            setAuthenticateSubject: () => undefined,
            initAuthentication: () => of(get_goodInitAuthenticateResponse),
            authenticate: () => of(get_goodAuthenticateResponses[0])
          }
        },
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthenticateApplicantComponent);
    component = fixture.componentInstance;

    stateRoutingService = TestBed.inject(StateRoutingService);

    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // LIFE CYCLE

  // --------------------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    it('should call showMainLoader', inject([ LoadingService ], (loadingService: LoadingService) => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'onInitNavigationGuard');      // Disable
      spyOn(component, 'setApplicantId');             //
      spyOn(component, 'getAuthenticationQuestions'); //
      spyOn(component, 'createForm');
      spyOn(loadingService, 'showMainLoader');

      component.ngOnInit();

      expect(loadingService.showMainLoader).toHaveBeenCalledTimes(1);
    }));

    it('should call onInitNavigationGuard()', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'onInitNavigationGuard');
      spyOn(component, 'setApplicantId');             // Disable
      spyOn(component, 'getAuthenticationQuestions'); //
      spyOn(component, 'createForm');                 //

      component.ngOnInit();

      expect(component.onInitNavigationGuard).toHaveBeenCalledTimes(1);
    });

    it('should call setApplicantId()', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'setApplicantId');
      spyOn(component, 'onInitNavigationGuard');      // Disable
      spyOn(component, 'getAuthenticationQuestions'); //
      spyOn(component, 'createForm');                 //

      component.ngOnInit();

      expect(component.setApplicantId).toHaveBeenCalledTimes(1);
    });

    it('should fetch the list of authentication questions', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'getAuthenticationQuestions');
      spyOn(component, 'onInitNavigationGuard'); // Disable
      spyOn(component, 'setApplicantId');        //
      spyOn(component, 'createForm');            //

      component.ngOnInit();

      expect(component.getAuthenticationQuestions).toHaveBeenCalledTimes(1);
    });

    it('should create the form', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'createForm');
      spyOn(component, 'onInitNavigationGuard');      // Disable
      spyOn(component, 'setApplicantId');             //
      spyOn(component, 'getAuthenticationQuestions'); //

      component.ngOnInit();

      expect(component.createForm).toHaveBeenCalledTimes(1);
    });

    describe('if user in delegated access mode', () => {
      it('should not set the questions using the fetched data', () => {
        spyOn(component, 'isDelegatedAccessMode').and.returnValue(true);
        spyOn(component, 'onInitNavigationGuard'); // Disable
        spyOn(component, 'setApplicantId');        //
        spyOn(component, 'createForm');            //
        spyOn(component, 'getAuthenticationQuestions');

        component.ngOnInit();

        expect(component.getAuthenticationQuestions).not.toHaveBeenCalled();
      });

      it('should not initialize the questions form', () => {
        spyOn(component, 'isDelegatedAccessMode').and.returnValue(true);
        spyOn(component, 'onInitNavigationGuard');      // Disable
        spyOn(component, 'setApplicantId');             //
        spyOn(component, 'getAuthenticationQuestions'); //
        spyOn(component, 'createForm');

        component.ngOnInit();

        expect(component.createForm).not.toHaveBeenCalled();
      });
    }); // describe - 'if user in delegated access mode'
  }); // describe - ngOnInit

  // FORMS

  // ------------------------------------------------------------------------------------ submit()
  describe('submit()', () => {
    const questions = get_goodInitAuthenticateResponse.data.questions;

    it('should call authenticate if all questions have been answered', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'authenticate');
      component.questions = questions;
      component.answers = questions.map(() => 1); // All questions answered with 1 answer

      component.submit();

      expect(component.authenticate).toHaveBeenCalledTimes(1);
    });

    it('should not call authenticate if all questions have not been answered', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(component, 'authenticate');
      component.questions = questions;
      component.answers = []; // No questions answered

      component.submit();

      expect(component.authenticate).not.toHaveBeenCalled();
    });

    describe('if user in delegated access mode', () => {
      it('should not call authenticate', inject([], () => {
        spyOn(component, 'isDelegatedAccessMode').and.returnValue(true);
        spyOn(component, 'authenticate');
        component.questions = questions;
        component.answers = questions.map(() => 1); // All questions answered with 1 answer

        component.submit();

        expect(component.authenticate).not.toHaveBeenCalled();
      }));

      it('should trigger delegated mode modal', inject(
        [ ErrorService ], (errorService: ErrorService) => {
        spyOn(errorService, 'show');
        spyOn(component, 'isDelegatedAccessMode').and.returnValue(true);

        component.submit();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
      }));
    }); // describe - 'if user in delegated access mode'
  }); // describe - submit()

  // SERVICE CALLS

  // --------------------------------------------------------------- getAuthenticationQuestions()
  describe('getAuthenticationQuestions()', () => {
    const language = 'fr';

    describe('if initialized authentication successfully', () => {
      it('should call hideMainLoader and set loaded to true', inject(
        [ ApplicantService, LoadingService ], (applicantService: ApplicantService, loadingService: LoadingService) => {
          spyOn(applicantService, 'initAuthentication').and.returnValue(of(null));
          spyOn(applicantService, 'getInitAuthenticateSubject').and.returnValue(
            new BehaviorSubject<ApplicantAuthentication>(get_goodInitAuthenticateResponse.data));
          spyOn(loadingService, 'hideMainLoader');

          expect(component.loaded).toBeFalsy();
          component.getAuthenticationQuestions(language);

          expect(loadingService.hideMainLoader).toHaveBeenCalledTimes(1);
          expect(component.loaded).toBeTruthy();
      }));

      it('should set the questions using the fetched data', inject(
        [ ApplicantService ], (applicantService: ApplicantService) => {
        spyOn(applicantService, 'initAuthentication').and.returnValue(of(null));
        spyOn(applicantService, 'getInitAuthenticateSubject').and.returnValue(
          new BehaviorSubject<ApplicantAuthentication>(get_goodInitAuthenticateResponse.data));

        component.getAuthenticationQuestions(language);

        expect(component.submittingAuthentication).toEqual(false);
        expect(component.questions).toEqual(get_goodInitAuthenticateResponse.data.questions);
      }));

      it('should initialize answers array to same size as questions list', inject(
        [ ApplicantService ], (applicantService: ApplicantService) => {
        spyOn(applicantService, 'initAuthentication').and.returnValue(of(null));
        spyOn(applicantService, 'getInitAuthenticateSubject').and.returnValue(
          new BehaviorSubject<ApplicantAuthentication>(get_goodInitAuthenticateResponse.data));

        component.getAuthenticationQuestions(language);

        expect(component.submittingAuthentication).toEqual(false);
        expect(component.answers.length).toEqual(get_goodInitAuthenticateResponse.data.questions.length);
        expect(component.answers.length).toEqual(component.questions.length);
      }));

      it('should scroll to the top of the window', inject(
        [ ApplicantService ], (applicantService: ApplicantService) => {
        spyOn(applicantService, 'initAuthentication').and.returnValue(of(null));
        spyOn(applicantService, 'getInitAuthenticateSubject').and.returnValue(
          new BehaviorSubject<ApplicantAuthentication>(get_goodInitAuthenticateResponse.data));
        spyOn(window, 'scrollTo');

        component.getAuthenticationQuestions(language);

        expect(window.scrollTo).toHaveBeenCalledOnceWith(0, 0);
        expect(window.scrollX).toEqual(0);
        expect(window.scrollY).toEqual(0);
      }));
    }); // describe - 'if initialized authentication successfully'

    describe('if failed to initialize authentication', () => {
      it('should call hideMainLoader', inject(
        [ ApplicantService, LoadingService ], (applicantService: ApplicantService, loadingService: LoadingService) => {
          const err = new HttpErrorResponse({});
          spyOn(applicantService, 'initAuthentication').and.returnValue(throwError(err));
          spyOn(component, 'handleErrorResponse');
          spyOn(loadingService, 'hideMainLoader');

          component.getAuthenticationQuestions(language);

          expect(loadingService.hideMainLoader).toHaveBeenCalledTimes(1);
        }));

      it('should call handleErrorResponse', inject(
        [ ApplicantService ], (applicantService: ApplicantService) => {
        const err = new ErrorResponse(internalServerErrorFactory.build());
        spyOn(applicantService, 'initAuthentication').and.returnValue(throwError(err));
        spyOn(component, 'handleErrorResponse');

        component.getAuthenticationQuestions(language);

        expect(component.handleErrorResponse).toHaveBeenCalledOnceWith(err);
      }));
    }); // describe - 'if failed to initialize authentication'
  }); // describe - getAuthenticationQuestions()

  // ----------------------------------------------------------------------------- authenticate()
  describe('authenticate()', () => {
    const questions = get_goodInitAuthenticateResponse.data.questions;

    it('should go to waiting_lending_offers if authenticate passed', inject(
      [ ApplicantService ], (applicantService: ApplicantService) => {
        component.authenticationQuestions = get_goodInitAuthenticateResponse.data;
        spyOn(applicantService, 'getAuthenticateSubject').and.returnValue(
          new BehaviorSubject<ApplicantAuthenticationComplete>(get_goodAuthenticateResponses[0].data));
        spyOn(component, 'reloadMerchant').and.returnValue(of(null));
        spyOn(component, 'next');
        component.questions = questions;
        component.answers = questions.map(() => 1); // All questions answered with 1 answer

        component.submit();

        expect(component.reloadMerchant).toHaveBeenCalledTimes(1);
        expect(component.next).toHaveBeenCalledTimes(1);

        expect(component.failedAuthentication).toBeFalsy();
        expect(component.submittingAuthentication).toEqual(true);
      }));

    it('should fetch new questions if authenticate did not pass', inject(
      [ ApplicantService ], (applicantService: ApplicantService) => {
        component.authenticationQuestions = get_goodInitAuthenticateResponse.data;
        spyOn(component, 'getAuthenticationQuestions');
        spyOn(component, 'reloadMerchant').and.returnValue(of(null));
        spyOn(applicantService, 'getAuthenticateSubject').and.returnValue(new BehaviorSubject<ApplicantAuthenticationComplete>(
          get_goodAuthenticateResponses[1].data));
        component.questions = questions;
        component.answers = questions.map(() => 1); // All questions answered with 1 answer

        component.submit();
        expect(component.getAuthenticationQuestions).toHaveBeenCalledTimes(1);
    }));

    it('should display error if authenticate call fails',  inject(
      [ ApplicantService ], (applicantService: ApplicantService) => {
        component.authenticationQuestions = get_goodInitAuthenticateResponse.data;
        spyOn(applicantService, 'authenticate').and.returnValue(throwError(new HttpErrorResponse({})));
        spyOn(component, 'handleErrorResponse');

        component.submit();

        expect(component.submittingAuthentication).toEqual(false);
        expect(component.handleErrorResponse).toHaveBeenCalledTimes(1);
    }));
  }); // describe - authenticate()

  // --------------------------------------------------------------------------- reloadMerchant()
  describe('reloadMerchant()', () => {
    it('should load merchant', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
      spyOn(merchantService, 'loadMerchant');

      component.reloadMerchant();

      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
    }));
  }); // describe - reloadMerchant()

  // ------------------------------------------------------------- handleErrorResponse()
  describe('handleErrorResponse()', () => {
    it('should display error dialog when service unavailable returned', inject(
      [ ErrorService ], (errorService: ErrorService) => {
      spyOn(errorService, 'show');
      component.handleErrorResponse(new ErrorResponse(serviceUnavailableFactory.build()));

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.equifaxAuthentication);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    }));

    it('should call next for any non 503 error', () => {
      const spy = spyOn(component, 'next');
      spyOn(component, 'reloadMerchant').and.returnValue(of(null));

      HTTP_ERRORS.forEach((error) => {
        component.handleErrorResponse(new ErrorResponse(error));

        expect(component.next).toHaveBeenCalledTimes(1);
        spy.calls.reset();
      });
    });
  }); // describe - handleErrorResponse()

  // NAVIGATION

  // -------------------------------------------------------------------- onInitNavigationGuard()
  describe('onInitNavigationGuard()', () => {
    describe('if the applicant has gone through authentication', () => {
      it('should call navigation next()', inject([], () => {
        spyOn(component, 'authenticationCheckComplete').and.returnValue(true);
        spyOn(component, 'next');

        component.onInitNavigationGuard();

        expect(component.next).toHaveBeenCalledTimes(1);
      }));
    }); // describe - 'if the applicant has already gone through application'

    describe('if the applicant has NOT gone through authentication', () => {
      it('should not call navigation next()', inject([], () => {
        spyOn(component, 'authenticationCheckComplete').and.returnValue(false);
        spyOn(component, 'next');

        component.onInitNavigationGuard();

        expect(component.next).not.toHaveBeenCalled();
      }));
    }); // describe - 'if the applicant has NOT gone through authentication'
  }); // describe - nonInitNavigationGuard()

  // ------------------------------------------------------------------------------------- next()
  describe('next()', () => {
    it('should state-route to waiting_lending_application', () => {

      component.next();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.waiting_lending_offers, true);
    });
  }); // describe - next()

  // HELPERS

  // ---------------------------------------------------------------------------- createForm()
  describe('createForm()', () => {
    it('should assign the form', inject([], () => {
      expect(component.verifyYourselfForm).toBeUndefined();
      component.createForm(new AuthenticateApplicant());
      expect(component.verifyYourselfForm).toBeDefined();
    }));
  }); // describe - createForm()

  // ---------------------------------------------------------------------------- setApplicantId()
  describe('setApplicantId()', () => {
    it('should set applicantid from userSessionService', inject([ UserSessionService ], (userSessionService: UserSessionService) => {
      const sessionProperties = userPropertiesFactory.build();
      spyOnProperty(userSessionService, 'applicantId').and.returnValue(sessionProperties.applicant);
      expect(component.applicantId).toBeUndefined();

      component.setApplicantId();
      expect(component.applicantId).toEqual(sessionProperties.applicant);
    }));
  }); // describe - setApplicantId()

  // ------------------------------------------------------------------------------ getLanguage()
  describe('getLanguage()', () => {
    it('should return French if currentLang is fr', inject(
      [ TranslateService ], (translateService: TranslateService) => {
      spyOnProperty(translateService, 'currentLang', 'get').and.returnValue('fr');

      expect(component.getLanguage()).toEqual('French');
    }));

    it('should return English if currentLang is en', inject(
      [ TranslateService ], (translateService: TranslateService) => {
      spyOnProperty(translateService, 'currentLang', 'get').and.returnValue('en');

      expect(component.getLanguage()).toEqual('English');
    }));

    it('should return English by default', inject(
      [ TranslateService ], (translateService: TranslateService) => {
      spyOnProperty(translateService, 'currentLang', 'get').and.returnValue('unknown');

      expect(component.getLanguage()).toEqual('English');
    }));
  }); // describe - getLanguage()

  // --------------------------------------------------------------------- isDelegatedAccessMode()
  describe('isDelegatedAccessMode()', () => {
    it('should return true if merchantService return true', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(true);

      const res = component.isDelegatedAccessMode();

      expect(merchantService.isDelegatedAccessMode).toHaveBeenCalledTimes(1);
      expect(res).toEqual(true);
    }));

    it('should return false if merchantService return false', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);

      const res = component.isDelegatedAccessMode();

      expect(merchantService.isDelegatedAccessMode).toHaveBeenCalledTimes(1);
      expect(res).toEqual(false);
    }));
  }); // describe - isDelegatedAccessMode()

  // ------------------------------------------------------------------ authenticationCheckComplete()()
  describe('authenticationCheckComplete()()', () => {
    it('should return true from merchantService returns true', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);

      const res = component.authenticationCheckComplete();

      expect(merchantService.authenticationCheckComplete).toHaveBeenCalledTimes(1);
      expect(res).toEqual(true);
    }));

    it('should return false from merchantService returns false', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);

      const res = component.authenticationCheckComplete();

      expect(merchantService.authenticationCheckComplete).toHaveBeenCalledTimes(1);
      expect(res).toEqual(false);
    }));
  }); // describe - authenticationCheckComplete()()


}); // describe - AuthenticateApplicantComponent
