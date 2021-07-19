import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { OmniauthProviderService } from './omniauth-provider.service';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { FACEBOOK_CONNECT } from 'app/constants';
import { closedWindow, fakeWindow } from 'app/test-stubs/factories/window';
import { fakeObserver } from 'app/test-stubs/observer';
import { NgZone } from '@angular/core';
import { of } from 'rxjs';
import { LoggingService } from './logging.service';
import { UtilityService } from './utility.service';
import { CookieService } from 'ngx-cookie-service';

import { OmniauthFlowResponse } from 'app/models/api-entities/omniauth-flow-response';

describe('OmniauthProviderService', () => {
  const expectedAuthUrl = FACEBOOK_CONNECT.URL_ROUTE;

  let omniauthProviderService: OmniauthProviderService;

  // Calculate width, height, left, and top in the same way that the re-auth service does
  const WIDTH = 600;
  const HEIGHT = 600;

  // Calculate width, height, left, and top in the same way that the re-auth service does
  const windowParams = (windowTop: number, windowLeft: number): string => {
    const top = windowTop + (window.innerHeight / 2) - (HEIGHT / 2);
    const left = windowLeft + (window.innerWidth / 2) - (WIDTH / 2);
    return `width=${WIDTH}, height=${HEIGHT}, top=${top}, left=${left}, rel="noopener"`;
  };

  class MockService extends OmniauthProviderService {
    authFlowUrl(): string {
      return expectedAuthUrl;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OmniauthProviderService,
        LoggingService,
        UtilityService,
        CookieService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    const ngZone = TestBed.inject(NgZone);
    const loggingSerivce = TestBed.inject(LoggingService);

    omniauthProviderService = new MockService(ngZone, loggingSerivce);
  });

  it('should be created', () => {
    expect(omniauthProviderService).toBeTruthy();
  });

  it('should correctly set observer', () => {
    omniauthProviderService.windowMessageObserver = fakeObserver;
    expect(omniauthProviderService.windowMessageObserver).toEqual(fakeObserver);
  });

  it('should correctly set windowInstance', () => {
    omniauthProviderService.windowInstance = fakeWindow;
    expect(omniauthProviderService.windowInstance).toEqual(fakeWindow);
  });

  describe('initiateAuthFlow()', () => {
    beforeEach(() => {
      omniauthProviderService.connecting = false;
    });

    it('should publish falsy event value when already connecting to QuickBooks', () => {
      omniauthProviderService.connecting = true;
      omniauthProviderService.receiveConnectedEvent.subscribe(
        (flowResponse: OmniauthFlowResponse) => expect(flowResponse.status).toBeFalsy(),
        (err) => fail(`Unexpected error: ${err}`));
      omniauthProviderService.initiateAuthFlow();
    });

    it('should publish falsy event value when a cancel event is returned from window', () => {
      spyOn(omniauthProviderService, 'startOmniauthFlow').and.returnValue(of({ status: OmniauthProviderConnectEvent.cancel }));
      omniauthProviderService.receiveConnectedEvent.subscribe(
        (flowResponse: OmniauthFlowResponse) => expect(flowResponse.status).toBeFalsy(),
        (err) => fail(`Unexpected error: ${err}`));
      omniauthProviderService.initiateAuthFlow();
    });

    it('should publish failure message value when a fail event is returned from window', () => {
      const errorMessage = 'SOME_ERROR';
      spyOn(omniauthProviderService, 'startOmniauthFlow').and.returnValue(of({ status: OmniauthProviderConnectEvent.fail, message: errorMessage }));
      omniauthProviderService.receiveConnectedEvent.subscribe(
        (flowResponse: OmniauthFlowResponse) => {
          expect(flowResponse.status).toBeFalsy();
          expect(flowResponse.message).toEqual(errorMessage);
        },
        (err) => fail(`Unexpected error: ${err}`));
      omniauthProviderService.initiateAuthFlow();
    });

    it('should publish without a message when the flow does not have a message', () => {
      spyOn(omniauthProviderService, 'startOmniauthFlow').and.returnValue(of({ status: OmniauthProviderConnectEvent.fail }));
      omniauthProviderService.receiveConnectedEvent.subscribe(
        (flowResponse: OmniauthFlowResponse) => {
          expect(flowResponse.status).toBeFalsy();
          expect(flowResponse.message).toBeUndefined();
        },
        (err) => fail(`Unexpected error: ${err}`));
      omniauthProviderService.initiateAuthFlow();
    });

    it('should publish truthy event value when a success event is returned from window', () => {
      spyOn(omniauthProviderService, 'startOmniauthFlow').and.returnValue(of({ status: OmniauthProviderConnectEvent.success }));
      omniauthProviderService.receiveConnectedEvent.subscribe(
        (flowResponse: OmniauthFlowResponse) => expect(flowResponse.status).toBeTruthy(),
        (err) => fail(`Unexpected error: ${err}`));
      omniauthProviderService.initiateAuthFlow();
    });
  });

  describe('startOmniauthFlow()', () => {
    beforeEach(() => {
      const value = 400;
      spyOn(window, 'open');
      spyOnProperty(window, 'innerWidth').and.returnValue(value);
      spyOnProperty(window, 'innerHeight').and.returnValue(value);
      spyOnProperty(window, 'screenX').and.returnValue(value);
      spyOnProperty(window, 'screenY').and.returnValue(value);
    });

    it('should set correct window params when window.screenLeft/screenTop are NOT set', () => {
      const value = null;
      spyOnProperty(window, 'screenLeft').and.returnValue(value);
      spyOnProperty(window, 'screenTop').and.returnValue(value);

      omniauthProviderService.startOmniauthFlow();
      expect(window.open).toHaveBeenCalledWith(expectedAuthUrl, '_blank', windowParams(window.screenY, window.screenX));
    });

    it('should set correct window params when window.screenLeft/screenTop are set', () => {
      const value = 200;
      spyOnProperty(window, 'screenLeft').and.returnValue(value);
      spyOnProperty(window, 'screenTop').and.returnValue(value);
      omniauthProviderService.startOmniauthFlow();
      expect(window.open).toHaveBeenCalledWith(expectedAuthUrl, '_blank', windowParams(window.screenTop, window.screenLeft));
    });

    it('should start the polling after opening the window', () => {
      spyOn(window, 'setInterval');

      omniauthProviderService.startOmniauthFlow().subscribe(
        (res) => expect(res).toBeTruthy(),
        (err) => fail(`Unexpected error: ${err}`));
      expect(window.setInterval).toHaveBeenCalledTimes(1);
    });

    it('should startOmniauthFlow with window\'s rel attribute set to "noopener"', () => {
      const value = 200;
      spyOnProperty(window, 'screenLeft').and.returnValue(value);
      spyOnProperty(window, 'screenTop').and.returnValue(value);
      omniauthProviderService.startOmniauthFlow().subscribe(
        (res) => expect(res).toBeTruthy(),
        (err) => fail(`Unexpected error: ${err}`));

      expect(window.open).toHaveBeenCalledWith(expectedAuthUrl, '_blank', windowParams(window.screenTop, window.screenLeft));
    });
  }); // describe - startOmniauthFlow()

  describe('checkIfClosed()', () => {
    beforeEach(() => {
      spyOnProperty(omniauthProviderService, 'windowInstance').and.returnValue(closedWindow());
      expect(omniauthProviderService.windowInstance.closed).toBeTruthy();
      expect(omniauthProviderService.windowInstance.close).toBeTruthy();
      spyOn(omniauthProviderService, 'finishOmniauthFlow');
      spyOn(window, 'open');
    });

    it('should call next and complete on observer if window is closed', () => {
      spyOnProperty(omniauthProviderService, 'windowMessageObserver').and.returnValue(fakeObserver);
      spyOn(omniauthProviderService.windowMessageObserver, 'next');
      expect(omniauthProviderService.windowMessageObserver).toBeTruthy();

      omniauthProviderService.checkIfClosed();

      expect(omniauthProviderService.finishOmniauthFlow).toHaveBeenCalledOnceWith(OmniauthProviderConnectEvent.cancel);
    });
  }); // describe - checkIfClosed()

  describe('checkIfClosed() - 2/2', () => {
    beforeEach(() => {
      spyOn(omniauthProviderService, 'finishOmniauthFlow');
    });

    it('should not call finishOmniauthFlow if window instance is null', () => {
      spyOnProperty(omniauthProviderService, 'windowInstance').and.returnValue(null);

      omniauthProviderService.checkIfClosed();
      expect(omniauthProviderService.finishOmniauthFlow).not.toHaveBeenCalled();
    });

    it('should not call finishOmniauthFlow if window instance is open', () => {
      spyOnProperty(omniauthProviderService, 'windowInstance').and.returnValue(fakeWindow);

      omniauthProviderService.checkIfClosed();
      expect(omniauthProviderService.finishOmniauthFlow).not.toHaveBeenCalled();
    });
  });

  describe('finishOmniauthFlow()', () => {
    let windowInstanceSpy: jasmine.Spy;
    let windowMessageObserverSpy: jasmine.Spy;

    beforeEach(() => {
      windowInstanceSpy = spyOnProperty(omniauthProviderService, 'windowInstance').and.returnValue(fakeWindow);
      windowMessageObserverSpy = spyOnProperty(omniauthProviderService, 'windowMessageObserver').and.returnValue(fakeObserver);
      spyOn(omniauthProviderService.windowInstance, 'close');
      spyOn(omniauthProviderService.windowMessageObserver, 'next');
      spyOn(omniauthProviderService.windowMessageObserver, 'complete');
      spyOn(window, 'clearInterval');
    });

    it('should trigger destroying of observables and finishOmniauthFlow of window', () => {
      omniauthProviderService.finishOmniauthFlow(OmniauthProviderConnectEvent.success);

      expect(omniauthProviderService.windowMessageObserver.next).toHaveBeenCalledOnceWith({ status: OmniauthProviderConnectEvent.success });
      expect(omniauthProviderService.windowInstance.close).toHaveBeenCalledTimes(1);

      expect(omniauthProviderService.windowMessageObserver.complete).toHaveBeenCalledTimes(1);
      expect(window.clearInterval).toHaveBeenCalledTimes(1);
    });

    it('should pass the error message if specified in failure response', () => {
      const testMessage = 'TEST_MESSAGE';
      omniauthProviderService.finishOmniauthFlow(OmniauthProviderConnectEvent.fail, testMessage);

      expect(omniauthProviderService.windowMessageObserver.next).toHaveBeenCalledOnceWith({ status: OmniauthProviderConnectEvent.fail, message: testMessage });
    });

    it('should trigger destroying of observables and finishOmniauthFlow of window', () => {
      omniauthProviderService.finishOmniauthFlow(OmniauthProviderConnectEvent.cancel);

      expect(omniauthProviderService.windowMessageObserver.next).toHaveBeenCalledOnceWith({ status: OmniauthProviderConnectEvent.cancel });
    });

    it('should call clearInterval if windowInstance and windowMessageObserver are null', () => {
      windowInstanceSpy.and.returnValue(null);
      windowMessageObserverSpy.and.returnValue(null);

      omniauthProviderService.finishOmniauthFlow(OmniauthProviderConnectEvent.cancel);

      expect(window.clearInterval).toHaveBeenCalledTimes(1);
    });
  }); // describe - finishOmniauthFlow()
}); // describe - OmniauthProviderService
