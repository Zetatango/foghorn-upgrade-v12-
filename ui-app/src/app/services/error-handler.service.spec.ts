import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import Bugsnag, { Client } from '@bugsnag/js';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';
import { ConfigurationService } from 'app/services/configuration.service';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { ErrorHandlerService } from './error-handler.service';
import { LoggingService } from './logging.service';
import { ErrorMessage, ErrorResponse } from 'app/models/error-response';
import { internalServerErrorFactory, okFactory, serviceUnavailableFactory } from 'app/test-stubs/factories/response';
import { BugsnagSeverity } from 'app/models/bugsnag';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let configurationService: ConfigurationService;
  let loggingService: LoggingService;
  let event;

  const appVersion = 'c78dsoij';
  const mockApiKey = 'a41759f312fee0ccf31bc65feb5bf2f8';
  const mockError = new Error('This is an error');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        ConfigurationService,
        CookieService,
        LoggingService,
        UtilityService
      ]
    });

    service = TestBed.inject(ErrorHandlerService);
    configurationService = TestBed.inject(ConfigurationService);
    loggingService = TestBed.inject(LoggingService);

    spyOn(Bugsnag, 'createClient').and.callThrough();
    spyOn(Client.prototype, 'notify').and.callThrough();
    spyOn(BugsnagErrorHandler.prototype, 'handleError');
    spyOnProperty(configurationService, 'initialAppVersion').and.returnValue(appVersion);
    spyOn(loggingService, 'log');
    spyOn(console, 'error');
    event = jasmine.createSpyObj('event', {
      addMetadata: () => undefined,
      setUser : () => undefined
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleError', () => {
    describe('with bugsnag client', () =>{
      beforeEach(() => {
        spyOnProperty(configurationService, 'bugsnagApiKey').and.returnValue(mockApiKey);
      });
      it('should not call Bugsnag\'s createClient more than once', () => {
        service.handleError(mockError);
        service.handleError(mockError);
        expect(Bugsnag.createClient).toHaveBeenCalledTimes(1);
      });

      it('should call BugsnagErrorHandler\'s handleError with Error object', () => {
        service.handleError(mockError);
        expect(BugsnagErrorHandler.prototype.handleError).toHaveBeenCalledOnceWith(mockError);
      });
    });

    describe('without bugsnag client', () =>{
      it('should not call BugsnagErrorHandler\'s handleError if client is not initialized', () => {
        spyOnProperty(configurationService, 'bugsnagApiKey').and.returnValue(null);
        service.handleError(mockError);
        expect(BugsnagErrorHandler.prototype.handleError).not.toHaveBeenCalled();
      });
    });
  });

  describe('onError', () => {
    const originalError = new ErrorMessage('testing');
    beforeEach(() => {
      event.originalError = originalError;
    });

    it('calls correct functions', () => {
      service.onError(event);

      expect(loggingService.log).toHaveBeenCalledTimes(1);
      expect(event.setUser).toHaveBeenCalledTimes(1);
      expect(event.addMetadata).toHaveBeenCalledTimes(2);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('sets context of error to URL if it has one', () => {
      event.originalError = new ErrorResponse(internalServerErrorFactory.build({ url: '123' }));
      service.onError(event);

      expect(event.context).toEqual('123');
    });

    it('sets severity of error to info if statusCode is 503', () => {
      event.originalError = new ErrorResponse(serviceUnavailableFactory.build());
      service.onError(event);

      expect(event.severity).toEqual(BugsnagSeverity.info);
    });

    it('sets severity of error to info if customSeverity is set', () => {
      const err = new ErrorResponse(internalServerErrorFactory.build());
      err.customSeverity = BugsnagSeverity.info;
      event.originalError = err;
      service.onError(event);

      expect(event.severity).toEqual(BugsnagSeverity.info);
    });

    it('uses originalError for log and is added to metadata', () => {
      service.onError(event);

      expect(loggingService.log).toHaveBeenCalledWith(originalError, false);
      expect(event.addMetadata).toHaveBeenCalledTimes(2);
    });

    it('sends expected values as with no originalError', () => {
      const metadata = {
        applicantId: 'app_123',
        leadId: 'l_123',
        merchantId: 'm_123',
        userId: 'u_123'
      };

      const expectedMetadata = {
        applicant_guid: 'app_123',
        lead_guid: 'l_123',
        merchant_guid: 'm_123',
      }
      event.originalError = null;
      service.initMetadata(metadata);
      service.onError(event);

      expect(loggingService.log).toHaveBeenCalledTimes(0);
      expect(event.setUser).toHaveBeenCalledWith(metadata.userId);
      expect(event.addMetadata).toHaveBeenCalledWith('metadata', expectedMetadata);
    });

    it('should not trigger Bugsnag if error is a ChunkLoadError', () => {
      spyOn(service, 'reloadPage');
      const chunkError = new Error(`Loading chunk 2 failed.\n(error: https://mattp.staging.thinkingcapital.ca/default~dashboard-dashboard-module~insights-insights-module.afafba776733bb1a9341.js`);
      event.originalError = chunkError;
      const isNotified = service.onError(event);

      expect(service.reloadPage).toHaveBeenCalled();
      expect(isNotified).toBeFalse();
    });

    it('should not trigger Bugsnag if error has a 200 status', () => {
      event.originalError = new ErrorResponse(okFactory.build() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      service.onError(event);

      expect(event.severity).toEqual(BugsnagSeverity.info);
      expect(BugsnagErrorHandler.prototype.handleError).not.toHaveBeenCalled();
    });

    it('should trigger Bugsnag if error originalError message is falsy', () => {
      spyOn(service, 'reloadPage');
      event.originalError = new ErrorResponse(internalServerErrorFactory.build({ message: null }));

      const isNotified = service.onError(event);
      expect(isNotified).toBeTrue();
    });

    describe('return value', () => {
      it('returns true for most events', () => {
        const result = service.onError(event);
        expect(result).toBeTrue();
      });
    });
  });

  describe('initMetadata', () => {
    it('should set service ids', () => {
      const metadata = {
        applicantId: 'app_123',
        leadId: 'l_123',
        merchantId: 'm_123',
        userId: 'u_123'
      };
      service.initMetadata(metadata);
      expect(service.applicantId).toEqual(metadata.applicantId);
      expect(service.leadId).toEqual(metadata.leadId);
      expect(service.merchantId).toEqual(metadata.merchantId);
      expect(service.userId).toEqual(metadata.userId);
    });
  });
});
