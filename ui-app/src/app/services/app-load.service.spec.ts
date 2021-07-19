import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { LogSeverity } from 'app/models/api-entities/log';
import { AppLoadService } from 'app/services/app-load.service';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { LeadService } from 'app/services/lead.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { applicationConfiguration } from 'app/test-stubs/factories/application-configuration';
import { businessPartnerApplicationFactory } from 'app/test-stubs/factories/business-partner';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { userSessionFactory } from 'app/test-stubs/factories/user-session';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupportedLanguage } from 'app/models/languages';
import { ErrorHandlerService } from './error-handler.service';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { ErrorResponse } from 'app/models/error-response';
import { leadFactory } from 'app/test-stubs/factories/lead';
import { BankAccountService } from './bank-account.service';
import { take } from 'rxjs/operators';

describe('AppLoadService', () => {
  let appLoadService: AppLoadService;
  let bankAccountService: BankAccountService;
  let businessPartnerService: BusinessPartnerService;
  let configService: ConfigurationService;
  let errorHandlerService: ErrorHandlerService;
  let leadService: LeadService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let translateService: TranslateService;
  let userSessionService: UserSessionService;

  let loadUserSessionSpy: jasmine.Spy;
  let logSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        AppLoadService,
        BankAccountService,
        BusinessPartnerService,
        ConfigurationService,
        CookieService,
        ErrorHandlerService,
        LoggingService,
        MerchantService,
        TranslateService,
        UserSessionService,
        UtilityService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    appLoadService = TestBed.inject(AppLoadService);
    bankAccountService = TestBed.inject(BankAccountService);
    businessPartnerService = TestBed.inject(BusinessPartnerService);
    configService = TestBed.inject(ConfigurationService);
    errorHandlerService = TestBed.inject(ErrorHandlerService);
    leadService = TestBed.inject(LeadService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    translateService = TestBed.inject(TranslateService);
    userSessionService = TestBed.inject(UserSessionService);

    loadUserSessionSpy = spyOn(userSessionService, 'loadUserSession');
    logSpy = spyOn(loggingService, 'log');
    spyOn(leadService, 'setLead');
    spyOn(errorHandlerService, 'initMetadata');
    spyOn(errorHandlerService, 'initBugsnagClient');
  });

  it('should be created', () => {
    expect(appLoadService).toBeTruthy();
  });

  describe('loadAppConfig()', () => {
    it('should resolve and not trigger error log if call to loadConfig succeeded', fakeAsync(() => {
      spyOn(configService, 'loadConfig').and.returnValue(of(applicationConfiguration));
      spyOnProperty(configService, 'initialAppVersion').and.returnValue(applicationConfiguration.app_version);
      spyOnProperty(configService, 'bugsnagApiKey').and.returnValue(applicationConfiguration.angular_bugsnag_api_key);

      appLoadService.loadAppConfig()
        .catch(() => fail('Should not be rejected'));
      tick();

      expect(loggingService.log).not.toHaveBeenCalled();
      expect(errorHandlerService.initBugsnagClient).toHaveBeenCalledOnceWith(applicationConfiguration.angular_bugsnag_api_key, applicationConfiguration.app_version);
    }));

    it('should resolve and trigger error log if call to loadConfig failed', fakeAsync(() => {
      const error = new ErrorResponse(internalServerErrorFactory.build());
      spyOn(configService, 'loadConfig').and.returnValue(throwError(error));

      appLoadService.loadAppConfig()
        .catch(() => fail('Should not be rejected'));
      tick();

      const expectedLogMessage = {
        message: `Error occurred trying to load config from configuration service: ${error.statusCode} - ${error.message}`,
        severity: LogSeverity.warn
      };
      expect(loggingService.log).toHaveBeenCalledWith(expectedLogMessage);
    }));
  }); // describe - loadAppConfig()

  describe('loadUserData', () => {
    beforeEach(() => {
      spyOn(merchantService, 'setMerchant').and.callThrough();
      spyOn(businessPartnerService, 'setBusinessPartnerApplication');
      spyOn(translateService, 'use');
      spyOn(bankAccountService, 'setBankAccountOwner');
    });

    describe('when it succeeds', () => {
      it('should set the lead when available', fakeAsync(() => {
        const session = userSessionFactory.build({
          merchant: null,
          lead: leadFactory.build()
        });
        loadUserSessionSpy.and.returnValue(of(session));
        spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

        appLoadService.loadUserData()
          .pipe(take(1))
          .subscribe();
        tick();

        expect(leadService.setLead).toHaveBeenCalledOnceWith(session.lead);
        expect(bankAccountService.setBankAccountOwner).toHaveBeenCalledOnceWith(session.lead);
      }));

      it('should set the merchant when available', fakeAsync(() => {
        const session = userSessionFactory.build({
          merchant: merchantDataFactory.build()
        });
        loadUserSessionSpy.and.returnValue(of(null));
        spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

        appLoadService.loadUserData()
          .pipe(take(1))
          .subscribe();

        tick();

        expect(merchantService.setMerchant).toHaveBeenCalledOnceWith(session.merchant);
        expect(bankAccountService.setBankAccountOwner).toHaveBeenCalledOnceWith(session.merchant);
      }));

      describe('when businessPartnerEnabled is TRUE', () => {
        it('should set the business partner application values when received', fakeAsync(() => {
          const session = userSessionFactory.build({
            business_partner_application: businessPartnerApplicationFactory.build()
          });
          loadUserSessionSpy.and.returnValue(of(null));
          spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

          appLoadService.loadUserData()
            .pipe(take(1))
            .subscribe();

          tick();

          expect(businessPartnerService.setBusinessPartnerApplication).toHaveBeenCalledOnceWith(session.business_partner_application);
        }));
      });

      describe('when businessPartnerEnabled is FALSE', () => {
        it('should not set the business partner application values', fakeAsync(() => {
          spyOnProperty(configService, 'businessPartnerEnabled').and.returnValue(false);
          const session = userSessionFactory.build();
          loadUserSessionSpy.and.returnValue(of(null));
          spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

          appLoadService.loadUserData()
            .pipe(take(1))
            .subscribe();

          tick();

          expect(businessPartnerService.setBusinessPartnerApplication).not.toHaveBeenCalled();
        }));
      });


      it('should set language to preferred language', fakeAsync(() => {
        loadUserSessionSpy.and.returnValue(of(null));
        spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build());
        spyOnProperty(userSessionService, 'preferredLanguage').and.returnValue(SupportedLanguage.fr);

        appLoadService.loadUserData()
          .pipe(take(1))
          .subscribe();

        tick();

        expect(translateService.use).toHaveBeenCalledOnceWith(SupportedLanguage.fr);
      }));

      it('should set language to default language when preference is falsy', fakeAsync(() => {
        loadUserSessionSpy.and.returnValue(of(null));
        spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build());
        spyOnProperty(userSessionService, 'preferredLanguage').and.returnValue(undefined);

        appLoadService.loadUserData()
          .pipe(take(1))
          .subscribe();

        tick();

        expect(translateService.use).toHaveBeenCalledOnceWith(SupportedLanguage.en);
      }));

      it('should set metadata for ErrorHandlerService', fakeAsync(() => {
        const session = userSessionFactory.build({ merchant: merchantDataFactory.build(), lead: leadFactory.build() });
        const expectedMetadata = {
          applicantId: session.applicant_guid,
          leadId: session.lead.id,
          merchantId: session.merchant.id,
          userId: session.id
        };
        loadUserSessionSpy.and.returnValue(of(null));
        spyOnProperty(userSessionService, 'userSession').and.returnValue(session);

        appLoadService.loadUserData()
          .pipe(take(1))
          .subscribe();
        tick();

        expect(errorHandlerService.initMetadata).toHaveBeenCalledOnceWith(expectedMetadata);
      }));
    });

    describe('when it fails', () => {
      it('should not set the raw lead, merchant or business partner application and log error', fakeAsync(() => {
        HTTP_ERRORS.forEach((httpError) => {
          const error = new ErrorResponse(httpError);
          const expectedLog = {
            message: `Error occurred trying to load user data from user session service: ${error.statusCode} - ${error.message}`,
            severity: LogSeverity.warn
          };
          loadUserSessionSpy.and.returnValue(throwError(error));

          appLoadService.loadUserData()
            .pipe(take(1))
            .subscribe({
              error: ((err) => {
                expect(err).toEqual(error);
                expect(loggingService.log).toHaveBeenCalledOnceWith(expectedLog);
              })
            });
          tick();

          expect(merchantService.setMerchant).not.toHaveBeenCalled();
          expect(businessPartnerService.setBusinessPartnerApplication).not.toHaveBeenCalled();
          logSpy.calls.reset();
        }); // forEach
      }));
    }); // describe - 'when it fails'
  }); // describe - loadUserData

}); // describe - AppLoadService
