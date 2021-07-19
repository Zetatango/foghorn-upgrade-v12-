import { HttpClientTestingModule, HttpTestingController, RequestMatch } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  updateInsightsPreferenceFactory,
  userPropertiesFactory,
  userSessionFactory,
  userSessionResponseFactory
} from 'app/test-stubs/factories/user-session';
import { CookieService } from 'ngx-cookie-service';
import { CONSTANTS } from 'app/constants';
import { UserSessionService } from './user-session.service';
import { UtilityService } from './utility.service';
import { leadFactory } from 'app/test-stubs/factories/lead';
import { SupportedLanguage } from 'app/models/languages';
import { notFoundFactory } from 'app/test-stubs/factories/response';
import { LoggingService } from './logging.service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { ProductPreference } from 'app/models/user-entities/user-session';
import { take } from 'rxjs/operators';

describe('UserSessionService', () => {
  let loggingService: LoggingService;
  let userSessionService: UserSessionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserSessionService,
        CookieService,
        UtilityService,
        LoggingService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    userSessionService = TestBed.inject(UserSessionService);
    loggingService = TestBed.inject(LoggingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(userSessionService).toBeTruthy();
  });

  describe('loadUserSession', () => {
    it('should return user session data', () => {
      userSessionService.loadUserSession()
        .pipe(take(1))
        .subscribe(
          () => {
            expect(userSessionService.userSession).toBeDefined();
            expect(userSessionService.userProfile).toBeDefined();
            expect(userSessionService.userProperties).toBeDefined();
            expect(userSessionService.userProfiles).toBeDefined();
          },
          (err) => fail(`Unexpected error: ${err}`)
        );
      const request = httpMock.expectOne(CONSTANTS.CURRENT_USER_DATA_PATH);
      expect(request.request.method).toEqual('GET');
      request.flush(userSessionResponseFactory.build());
    });

    it('should handle falsy user session data', () => {
      userSessionService.loadUserSession()
        .pipe(take(1))
        .subscribe(
          () => {
            expect(userSessionService.userSession).toBeUndefined();
            expect(userSessionService.userProfile).toBeUndefined();
            expect(userSessionService.userProperties).toBeUndefined();
            expect(userSessionService.userProfiles).toBeUndefined();
          },
          (err) => fail(`Unexpected error: ${err}`)
        );
      const request = httpMock.expectOne(CONSTANTS.CURRENT_USER_DATA_PATH);
      expect(request.request.method).toEqual('GET');
      request.flush(null);
    });

    it('should return promise rejection when error occurs in call to API', () => {
      const error = notFoundFactory.build();
      userSessionService.loadUserSession()
        .pipe(take(1))
        .subscribe(
          () => fail('loadUserSession should not fulfill'),
          (err) => expect(err.status).toEqual(error.status)
        );
      const request = httpMock.expectOne(CONSTANTS.CURRENT_USER_DATA_PATH);
      request.flush([], error);
    });
  });

  describe('updateInsightsPreference', () => {
    let logSpy: jasmine.Spy;
    const updateInsighsPreferenceBodyOptIn = updateInsightsPreferenceFactory.build();
    const updateInsighsPreferenceBodyOptOut = updateInsightsPreferenceFactory.build({
      opt_in: false
    });

    beforeEach(() => {
      logSpy = spyOn(loggingService, 'log');
    });

    it('should be able to send request to update the user insights preference', fakeAsync(() => {
      userSessionService.updateInsightsPreference(true)
        .catch((err) => fail('Prevented this test to fail silently: ' + err));

      tick();

      const expectedRequest: RequestMatch = { method: 'PUT', url: CONSTANTS.UPDATE_INSIGHTS_PREFERENCE_PATH };
      const updateInsightsPreferenceRequest = httpMock.expectOne(expectedRequest);
      updateInsightsPreferenceRequest.flush(null);
    }));

    it('should log a message that the insight has been updated', fakeAsync(() => {
      userSessionService.updateInsightsPreference(true)
        .catch((err) => fail('Prevented this test to fail silently: ' + err));

      const expectedRequest: RequestMatch = { method: 'PUT', url: CONSTANTS.UPDATE_INSIGHTS_PREFERENCE_PATH };
      const updateInsightsPreferenceRequest = httpMock.expectOne(expectedRequest);
      updateInsightsPreferenceRequest.flush(null);

      tick();

      const expectedLogMessage: LogMessage = {
        message: 'Updated insights preference',
        severity: LogSeverity.info
      };

      expect(logSpy).toHaveBeenCalledOnceWith(expectedLogMessage);
      logSpy.calls.reset();
    }));

    it('should be able to send request to update the user insights preference with the correct params (opt in)', fakeAsync(() => {
      userSessionService.updateInsightsPreference(true)
        .catch((err) => fail('Prevented this test to fail silently: ' + err));

      tick();

      const expectedRequest: RequestMatch = { method: 'PUT', url: CONSTANTS.UPDATE_INSIGHTS_PREFERENCE_PATH };
      const updateInsightsPreferenceRequest = httpMock.expectOne(expectedRequest);
      expect(updateInsightsPreferenceRequest.request.body).toEqual(updateInsighsPreferenceBodyOptIn);
      updateInsightsPreferenceRequest.flush(null);
    }));

    it('should be able to send request to update the user insights preference with the correct params (opt out)', fakeAsync(() => {
      userSessionService.updateInsightsPreference(false)
        .catch((err) => fail('Prevented this test to fail silently: ' + err));

      tick();

      const expectedRequest: RequestMatch = { method: 'PUT', url: CONSTANTS.UPDATE_INSIGHTS_PREFERENCE_PATH };
      const updateInsightsPreferenceRequest = httpMock.expectOne(expectedRequest);
      expect(updateInsightsPreferenceRequest.request.body).toEqual(updateInsighsPreferenceBodyOptOut);
      updateInsightsPreferenceRequest.flush(null);
    }));

    it('should pass down an error if updateInsightsPreference returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        userSessionService.updateInsightsPreference(true)
          .then(() => fail('Should not succeed'))
          .catch((err) => expect(err.status).toEqual(httpError.status));

        const expectedRequest: RequestMatch = { method: 'PUT', url: CONSTANTS.UPDATE_INSIGHTS_PREFERENCE_PATH };
        const updateInsightsPreferenceRequest = httpMock.expectOne(expectedRequest);
        updateInsightsPreferenceRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('areMultipleBusinessesSupported', () => {
    let userSessionSpy: jasmine.Spy;

    beforeEach(() => {
      userSessionSpy = spyOnProperty(userSessionService, 'userSession');
    });

    it('should return false if user session is falsy', () => {
      userSessionSpy.and.returnValue(undefined);
      expect(userSessionService.areMultipleBusinessesSupported).toBeFalse();

      userSessionSpy.and.returnValue(null);
      expect(userSessionService.areMultipleBusinessesSupported).toBeFalse();
    });

    it('should return false if user session partner is falsy', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({ partner: null }));
      expect(userSessionService.areMultipleBusinessesSupported).toBeFalse();
    });

    it('should return false if conf_allow_multiple_businesses is falsy', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({ partner: { conf_allow_multiple_businesses: false } }));
      expect(userSessionService.areMultipleBusinessesSupported).toBeFalse();
    });

    it('should return true if conf_allow_multiple_businesses is truthy', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({ partner: { conf_allow_multiple_businesses: true } }));
      expect(userSessionService.areMultipleBusinessesSupported).toBeTrue();
    });
  });

  describe('isMerchantOnboardingSupported', () => {
    let userSessionSpy: jasmine.Spy;

    beforeEach(() => {
      userSessionSpy = spyOnProperty(userSessionService, 'userSession');
    });

    it('should return false if user session is falsy', () => {
      userSessionSpy.and.returnValue(undefined);
      expect(userSessionService.isMerchantOnboardingSupported).toBeFalse();

      userSessionSpy.and.returnValue(null);
      expect(userSessionService.isMerchantOnboardingSupported).toBeFalse();
    });

    it('should return false if user session partner is falsy', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({ partner: null }));
      expect(userSessionService.isMerchantOnboardingSupported).toBeFalse();
    });

    it('should return false if conf_onboard_supported is falsy', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({ partner: { conf_onboard_supported: false } }));
      expect(userSessionService.isMerchantOnboardingSupported).toBeFalse();
    });

    it('should return true conf_onboard_supported is truthy', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({ partner: { conf_onboard_supported: true } }));
      expect(userSessionService.isMerchantOnboardingSupported).toBeTrue();
    });
  });

  describe('presence helper', () => {
    let userPropertiesSpy: jasmine.Spy;
    let userSessionSpy: jasmine.Spy;

    beforeEach(() => {
      userPropertiesSpy = spyOnProperty(userSessionService, 'userProperties');
      userSessionSpy = spyOnProperty(userSessionService, 'userSession');
    });

    describe('hasApplicant', () => {
      it('should return false if user properties are not set', () => {
        userPropertiesSpy.and.returnValue(undefined);
        expect(userSessionService.hasApplicant).toBeFalse();

        userPropertiesSpy.and.returnValue(null);
        expect(userSessionService.hasApplicant).toBeFalse();
      });

      it('should return whether the applicant property exists or not (when defined in user profile)', () => {
        [null, undefined, ''].forEach(value => {
          userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ applicant: value }));
          expect(userSessionService.hasApplicant).toBeFalse();
        });

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build());
        expect(userSessionService.hasApplicant).toBeTrue();
      });

      it('should return whether the applicant property exists or not (when defined in user session)', () => {
        [null, undefined, ''].forEach(value => {
          userSessionSpy.and.returnValue(userSessionFactory.build({ applicant_guid: value }));
          expect(userSessionService.hasApplicant).toBeFalse();
        });

        userSessionSpy.and.returnValue(userSessionFactory.build());
        expect(userSessionService.hasApplicant).toBeTrue();
      });
    });

    describe('hasGuarantor', () => {
      it('should return false if user properties is falsy', () => {
        userPropertiesSpy.and.returnValue(undefined);
        expect(userSessionService.hasGuarantor).toBeFalse();

        userPropertiesSpy.and.returnValue(null);
        expect(userSessionService.hasGuarantor).toBeFalse();
      });

      it('should return whether the guarantor property exists or not', () => {
        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ guarantor: null }));
        expect(userSessionService.hasGuarantor).toBeFalse();

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ guarantor: undefined }));
        expect(userSessionService.hasGuarantor).toBeFalse();

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ guarantor: 'g_123' }));
        expect(userSessionService.hasGuarantor).toBeTrue();
      });
    });

    describe('hasMerchant', () => {
      it('should return false if user properties are not set', () => {
        userPropertiesSpy.and.returnValue(undefined);
        expect(userSessionService.hasMerchant).toBeFalse();

        userPropertiesSpy.and.returnValue(null);
        expect(userSessionService.hasMerchant).toBeFalse();
      });

      it('should return whether the merchant property exists or not', () => {
        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ merchant: null }));
        expect(userSessionService.hasMerchant).toBeFalse();

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ merchant: undefined }));
        expect(userSessionService.hasMerchant).toBeFalse();

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build());
        expect(userSessionService.hasMerchant).toBeTrue();
      });
    });

    describe('hasPartner', () => {
      it('should return false if user properties are not set', () => {
        userPropertiesSpy.and.returnValue(undefined);
        expect(userSessionService.hasPartner).toBeFalse();

        userPropertiesSpy.and.returnValue(null);
        expect(userSessionService.hasPartner).toBeFalse();
      });

      it('should return whether the partner property exists or not', () => {
        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ partner: null }));
        expect(userSessionService.hasPartner).toBeFalse();

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build({ partner: undefined }));
        expect(userSessionService.hasPartner).toBeFalse();

        userPropertiesSpy.and.returnValue(userPropertiesFactory.build());
        expect(userSessionService.hasPartner).toBeTrue();
      });
    });
  });

  describe('userProperties', () => {
    it('should be undefined initially', () => {
      expect(userSessionService.userProperties).toBeUndefined();
    });
  });

  describe('applicant', () => {
    it('should be undefined initially', () => {
      expect(userSessionService.applicantId).toBeUndefined();
    });

    it('should return applicant from userProperties if truthy', () => {
      const hasApplicantSession = userPropertiesFactory.build();
      spyOnProperty(userSessionService, 'userProperties').and.returnValue(hasApplicantSession);

      expect(userSessionService.applicantId).toBe(hasApplicantSession.applicant);
    });

    it('should return applicant from userSession if truthy', () => {
      const hasApplicantSession = userSessionFactory.build();
      spyOnProperty(userSessionService, 'userSession').and.returnValue(hasApplicantSession);

      expect(userSessionService.applicantId).toBe(hasApplicantSession.applicant_guid);
    });

    it('should return applicant from userProperties if both userSession and userProperties have applicant', () => {
      const hasApplicantProperties = userPropertiesFactory.build();
      const hasApplicantSession = userSessionFactory.build();
      spyOnProperty(userSessionService, 'userProperties').and.returnValue(hasApplicantProperties);
      spyOnProperty(userSessionService, 'userSession').and.returnValue(hasApplicantSession);

      expect(userSessionService.applicantId).toBe(hasApplicantProperties.applicant);
    });

    it('should be undefined when userProperties is not truthy', () => {
      spyOnProperty(userSessionService, 'userProperties').and.returnValue(undefined);

      expect(userSessionService.applicantId).toBeUndefined();
    });
  });

  describe('leadId', () => {
    it('should be undefined initially', () => {
      expect(userSessionService.leadId).toBeUndefined();
    });

    it('should return lead id from userSession if truthy', () => {
      const lead = leadFactory.build();
      const userSession = userSessionFactory.build({ lead: lead });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSession);

      expect(userSessionService.leadId).toEqual(lead.id);
    });

    it('should be undefined when userSession is not truthy', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(undefined);

      expect(userSessionService.leadId).toBeUndefined();
    });

    it('should be undefined when lead is not truthy', () => {
      const userSession = userSessionFactory.build({ lead: null });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSession);

      expect(userSessionService.leadId).toBeUndefined();
    });
  });

  describe('partner', () => {
    it('should be undefined initially', () => {
      expect(userSessionService.partner).toBeUndefined();
    });

    it('should return partner from userProperties if truthy', () => {
      const hasPartnerSession = userPropertiesFactory.build();
      spyOnProperty(userSessionService, 'userProperties').and.returnValue(hasPartnerSession);

      expect(userSessionService.partner).toBe(hasPartnerSession.partner);
    });

    it('should be undefined when userProperties is not truthy', () => {
      spyOnProperty(userSessionService, 'userProperties').and.returnValue(undefined);

      expect(userSessionService.partner).toBeUndefined();
    });
  });

  describe('userId', () => {
    it('should return id from userSession if truthy', () => {
      const session = userSessionFactory.build({ id: 'u_123' });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

      expect(userSessionService.userId).toBe(session.id);
    });

    it('should be undefined when userProperties is not truthy', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(undefined);

      expect(userSessionService.userId).toBeUndefined();
    });
  });

  describe('userEmail', () => {
    it('should return email from userSession if truthy', () => {
      const session = userSessionFactory.build({ email: 'test@test.com' });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

      expect(userSessionService.userEmail).toBe(btoa(session.email));
    });

    it('should be undefined when userProperties is not truthy', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(undefined);

      expect(userSessionService.userEmail).toEqual(btoa(undefined));
    });
  });

  describe('preferredLanguage', () => {
    it('should be undefined when session is falsy', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(null);
      expect(userSessionService.preferredLanguage).toBe(undefined);
    });

    it('should return language from userProfile if truthy', () => {
      const sessionWithLanguage = userSessionFactory.build({ preferred_language: SupportedLanguage.fr });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(sessionWithLanguage);

      expect(userSessionService.preferredLanguage).toBe(SupportedLanguage.fr);
    });
  });

  describe('insightsPreference', () => {
    it('should be undefined when session is falsy', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(null);
      expect(userSessionService.insightsPreference).toBe(undefined);
    });

    it('should return null from userProfile if not set', () => {
      const sessionWithInsightsNotSet = userSessionFactory.build({ insights_preference: null });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(sessionWithInsightsNotSet);

      expect(userSessionService.insightsPreference).toBeNull();
    });

    it('should return insights preference from userProfile if set (opt in)', () => {
      const sessionWithInsightsOptIn = userSessionFactory.build({ insights_preference: true });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(sessionWithInsightsOptIn);

      expect(userSessionService.insightsPreference).toBeTrue();
    });

    it('should return insights preference from userProfile if set (opt out)', () => {
      const sessionWithInsightsOptIn = userSessionFactory.build({ insights_preference: false });
      spyOnProperty(userSessionService, 'userSession').and.returnValue(sessionWithInsightsOptIn);

      expect(userSessionService.insightsPreference).toBeFalse();
    });
  });

  describe('isCfaCustomer', () => {
    it('should be false when there is no userSession', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(null);

      expect(userSessionService.isCfaCustomer).toBeFalse();
    });

    it('should be false when there is userSession with product_preference as LOC', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build({ product_preference: ProductPreference.LOC }));

      expect(userSessionService.isCfaCustomer).toBeFalse();
    });

    it('should be true when there is userSession with product_preference as CFA', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build({ product_preference: ProductPreference.CFA }));

      expect(userSessionService.isCfaCustomer).toBeTrue();
    });
  });

  describe('isLocCustomer', () => {
    it('should be false when there is no userSession', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(null);

      expect(userSessionService.isLocCustomer).toBeFalse();
    });

    it('should be false when there is userSession with product_preference as CFA', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build({ product_preference: ProductPreference.CFA }));

      expect(userSessionService.isLocCustomer).toBeFalse();
    });

    it('should be true when there is userSession with product_preference as LOC', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build({ product_preference: ProductPreference.LOC }));

      expect(userSessionService.isLocCustomer).toBeTrue();
    });
  });

  describe('productPreference', () => {
    it('should be undefined when there is no userSession', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(null);

      expect(userSessionService.productPreference).toBeUndefined();
    });

    it('should return the value when set', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build({ product_preference: ProductPreference.CFA }));

      expect(userSessionService.productPreference).toBe(ProductPreference.CFA);
    });
  });

  describe('isMyBusinessLinkVisible', () => {
    it('should be false when a CFA customer does not have a merchant', () => {
      spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(true);
      spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(false);
      spyOnProperty(userSessionService, 'isLocCustomer').and.returnValue(false);

      expect(userSessionService.isMyBusinessLinkVisible).toBeFalse();
    });

    it('should be true when a CFA customer does have a merchant', () => {
      spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(true);
      spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(true);

      expect(userSessionService.isMyBusinessLinkVisible).toBeTrue();
    });

    it('should be true when they are a LOC customer', () => {
      spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(false);
      spyOnProperty(userSessionService, 'isLocCustomer').and.returnValue(true);

      expect(userSessionService.isMyBusinessLinkVisible).toBeTrue();
    });
  });
});
