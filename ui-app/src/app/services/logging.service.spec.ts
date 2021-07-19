import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { GTMEvent, GTMStatus, LoggingService } from './logging.service';
import { UtilityService } from './utility.service';
import { API_LOG_PATH, INTERCOM_NAMES } from 'app/constants';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';

import { CookieService } from 'ngx-cookie-service';
import { AppRoutes, StateRoute } from 'app/models/routes';
import Bugsnag from '@bugsnag/js';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { ErrorMessage } from 'app/models/error-response';
import { GoogleTagManagerEvent, GoogleTagManagerInitEvent } from 'app/models/google-tag-manager';
import { DevModeService } from './dev-mode.service';

describe('LoggingService', () => {
  let httpMock: HttpTestingController;

  let configurationService: ConfigurationService;
  let devModeService: DevModeService;
  let loggingService: LoggingService;

  let dataLayerSpy: jasmine.SpyObj<any>; // eslint-disable-line
  let intercomSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        ConfigurationService,
        CookieService,
        DevModeService,
        ErrorHandlerService,
        LoggingService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    httpMock = TestBed.inject(HttpTestingController);

    configurationService = TestBed.inject(ConfigurationService);
    devModeService = TestBed.inject(DevModeService);
    loggingService = TestBed.inject(LoggingService);

    spyOnProperty(configurationService, 'bugsnagApiKey').and.returnValue('abcd');

    dataLayerSpy = loggingService.dataLayer = jasmine.createSpyObj('dataLayer', ['push']); // eslint-disable-line
    intercomSpy = (window as any).Intercom = jasmine.createSpy('Intercom'); // eslint-disable-line

    spyOn(Bugsnag, 'notify');
    spyOn(devModeService, 'isDevMode').and.returnValue(false);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(loggingService).toBeTruthy();
  });

  describe('log()', () => {
    const validLogMessage: LogMessage = { message: 'Test message', severity: LogSeverity.info };

    it('should throw an error', () => {
      const INVALID_SEVERITIES = [undefined, null];

      INVALID_SEVERITIES.forEach(invalidSeverity => {
        expect(() => loggingService.log({ message: 'Test message', severity: invalidSeverity }))
          .toThrowError('Severity cannot be null or undefined');
      });
    });

    it('if message is invalid should throw an error', () => {
      const INVALID_MESSAGES = [undefined, null, ''];

      INVALID_MESSAGES.forEach(invalidMessage => {
        expect(() => loggingService.log({ message: invalidMessage, severity: LogSeverity.info }))
          .toThrowError('Log message cannot be blank, null or undefined');
      });
    });

    it('should return success given valid message and severity', () => {
      loggingService.log(validLogMessage);

      const logRequest = httpMock.expectOne(API_LOG_PATH);
      expect(logRequest.request.method).toEqual('POST');
      logRequest.flush({}, {});
    });

    it('should trigger bugsnag if API call fails', () => {
      loggingService.log(validLogMessage);

      const logRequest = httpMock.expectOne(API_LOG_PATH);
      expect(logRequest.request.method).toEqual('POST');
      logRequest.flush([], internalServerErrorFactory.build());
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger bugsnag if API call fails and notifyBugsnag param is false', () => {
      loggingService.log(validLogMessage, false);

      const logRequest = httpMock.expectOne(API_LOG_PATH);
      expect(logRequest.request.method).toEqual('POST');
      logRequest.flush([], internalServerErrorFactory.build());
      expect(Bugsnag.notify).not.toHaveBeenCalled();
    });
  });

  describe('Updating 3rd-party services', () => {
    let expectedEvents = {};
    let expectedId = {};

    beforeEach(() => {
      expectedEvents = new GoogleTagManagerEvent({
        'event': 'ario',
        [GTMEvent.BUTTON_CLICKED]: undefined,
        [GTMEvent.TAB_CLICKED]: undefined,
        [GTMEvent.CURRENT_PAGE]: undefined
      });

      expectedId = new GoogleTagManagerInitEvent({
        'userId': undefined,
        'email': undefined
      });
    });

    describe('logCurrentPage()', () => {
      const ALL_ROUTES = Object.values(StateRoute);
      const ALL_CONVERTED_ROUTES = Object.keys(INTERCOM_NAMES);

      it('should update Intercom with current state name as parameter', () => {
        // All route names that are used as they are (not converted to a more readable format)
        const FILTERED_ROUTES = ALL_ROUTES.filter(route => !ALL_CONVERTED_ROUTES.includes(route.toUpperCase()));

        FILTERED_ROUTES.forEach((route) => {
          loggingService.logCurrentPage(route);
          expect(intercomSpy).toHaveBeenCalledOnceWith('update', { current_page: route });
          intercomSpy.calls.reset();
        });
      });

      it('should not update Intercom if window.Intercom is not defined', () => {
        (window as any).Intercom = undefined; // eslint-disable-line

        // All route names that are used as they are (not converted to a more readable format)
        const FILTERED_ROUTES = ALL_ROUTES.filter(route => !ALL_CONVERTED_ROUTES.includes(route.toUpperCase()));

        FILTERED_ROUTES.forEach((route) => {
          loggingService.logCurrentPage(route);
          expect(intercomSpy.calls.mostRecent()).toBeFalsy();
          intercomSpy.calls.reset();
        });
      });

      it('should update Intercom and GTM with current state name converted to page name from route hierarchy', () => {
        spyOn(loggingService, 'GTMUpdate');
        for (const key in AppRoutes.onboarding) {
          if (AppRoutes.onboarding.hasOwnProperty(key) && key !== 'root' && key !== 'root_link') {
            const route = AppRoutes.onboarding[key];
            loggingService.logCurrentPage(route);
            expect(intercomSpy).toHaveBeenCalledWith('update', { current_page: INTERCOM_NAMES[key.toUpperCase()] });
            expect(loggingService.GTMUpdate).toHaveBeenCalledWith(GTMEvent.CURRENT_PAGE, key);
          }
        }
      });

      it('should update Intercom with current state name converted to a more readable string as parameter', () => {
        // All route names that are being converted to a more readable format
        const FILTERED_ROUTES = ALL_ROUTES.filter(route => ALL_CONVERTED_ROUTES.includes(route.toUpperCase()));

        FILTERED_ROUTES.forEach((route) => {
          loggingService.logCurrentPage(route);
          expect(intercomSpy).toHaveBeenCalledOnceWith('update', { current_page: INTERCOM_NAMES[route.toUpperCase()] });
          intercomSpy.calls.reset();
        });
      });

      it('should update GTM with current state name and action as parameter', () => {
        const action = 'selectBankAccount';
        ALL_ROUTES.forEach((route) => {
          Object.assign(expectedEvents, { [GTMEvent.CURRENT_PAGE]: `${route}:${action}` });
          loggingService.logCurrentPage(route, action);
          expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvents);
          dataLayerSpy.push.calls.reset();
        });
      });

      it('should update GTM with current state name as parameter', () => {
        ALL_ROUTES.forEach((route) => {
          Object.assign(expectedEvents, { [GTMEvent.CURRENT_PAGE]: route });
          loggingService.logCurrentPage(route);
          expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvents);
          dataLayerSpy.push.calls.reset();
        });
      });
    });

    describe('intercomShow()', () => {
      it('should call show() on intercom window if intercom is enabled', () => {
        intercomSpy = (window as any).Intercom = jasmine.createSpy('Intercom'); // eslint-disable-line

        loggingService.intercomShow();
        expect(intercomSpy).toHaveBeenCalledOnceWith('show');

        intercomSpy.calls.reset();
      });

      it('should not update Intercom if intercom.window is undefined', () => {
        (window as any).Intercom = undefined; // eslint-disable-line

        loggingService.intercomShow();
        expect(intercomSpy.calls.mostRecent()).toBeFalsy();
        intercomSpy.calls.reset();
      });
    });

    describe('GTMUpdate()', () => {
      it('should update GTM with event data for the event being pushed and undefined for the rest of the events', () => {
        Object.assign(expectedEvents, { [GTMEvent.BUTTON_CLICKED]: 'Send Invoice' });

        loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Send Invoice');

        expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvents);
      });
    });

    describe('GTMAction()', () => {
      it('should update GTM with event data for the event being pushed', () => {
        Object.assign(expectedEvents, {
            eventAction: 'uploaded_bank_statements',
            eventCategory: 'url',
            eventLabel: GTMStatus.SUCCESS
          });

        loggingService.GTMAction('url', 'uploaded_bank_statements', GTMStatus.SUCCESS);

        expect(dataLayerSpy.push).toHaveBeenCalledTimes(1);
        expect(dataLayerSpy.push).toHaveBeenCalledWith(expectedEvents);
      });
    });

    describe('GTMSetUserID()', () => {
      it('should update GTM with user ID data', () => {
        Object.assign(expectedId, { userId: 'u_fakeUserId', email: 'fake@mail.ca'});

        loggingService.GTMSetUserID('u_fakeUserId', 'fake@mail.ca');

        expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedId);
      });

      it('should not update GTM with event name and event if id falsy', () => {
        loggingService.GTMSetUserID(null, null);

        expect(dataLayerSpy.push).not.toHaveBeenCalled();
      });
    });

    describe('GTMOnBlur()', () => {
      it('should update GTM with form event data', () => {
        const formName = 'about-business-form';
        const controlName = 'legal_business_name';
        const expectedEvent = new GoogleTagManagerEvent({
          eventAction: controlName,
          eventCategory: formName,
          eventLabel: 'completed',
          event: 'ario'
        });
        loggingService.GTMOnBlur(formName, controlName);

        expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvent);
      });

      it('should trigger bugsnag if GTM dataLayer is not accessible', () => {
        loggingService.dataLayer = undefined;
        const keys = Object.keys(new GoogleTagManagerEvent({}));
        const errorMessage = new ErrorMessage(`Unable to push GTM event: ${keys}`);

        loggingService.GTMOnBlur('', '');
        expect(Bugsnag.notify).toHaveBeenCalledOnceWith(errorMessage);
      });
    });
    describe('GTMDnq()', () => {
      describe('en', () => {
        it('should update GTM with dnq status and industry when dnq', () => {
          const expectedEvent = new GoogleTagManagerEvent({
            currentPage: 'dnq',
            industry: 'ART_GALLERY',
            event: 'ario'
          });
          loggingService.GTMDnq(false, 'ART_GALLERY', 'en');

          expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvent);
        });

        it('should update GTM with dnq status and industry when qualified', () => {
          const expectedEvent = new GoogleTagManagerEvent({
            currentPage: 'qualified',
            industry: 'ART_GALLERY',
            event: 'ario'
          });
          loggingService.GTMDnq(true, 'ART_GALLERY', 'en');

          expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvent);
        });
      });

      describe('fr', () => {
        it('should update GTM with dnq status and industry when dnq', () => {
          const expectedEvent = new GoogleTagManagerEvent({
            currentPage: 'dnq-fr',
            industry: 'ART_GALLERY',
            event: 'ario'
          });
          loggingService.GTMDnq(false, 'ART_GALLERY', 'fr');

          expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvent);
        });

        it('should update GTM with dnq status and industry when qualified', () => {
          const expectedEvent = new GoogleTagManagerEvent({
            currentPage: 'qualified-fr',
            industry: 'ART_GALLERY',
            event: 'ario'
          });
          loggingService.GTMDnq(true, 'ART_GALLERY', 'fr');

          expect(dataLayerSpy.push).toHaveBeenCalledOnceWith(expectedEvent);
        });
      });
    });
  });
});
