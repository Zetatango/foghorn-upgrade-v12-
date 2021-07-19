import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SocialConnectionsComponent } from './social-connections.component';

import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { SocialConnectionsService } from 'app/services/social-connections.service';
import { FacebookSocialConnectionState, SocialConnections } from 'app/models/api-entities/social-connections';
import {
  facebookSocialConnectionAboutToExpire, facebookSocialConnectionConnected,
  facebookSocialConnectionInvalidConnection, facebookSocialConnectionNotConnected,
  socialConnectionsFactory
} from 'app/test-stubs/factories/social-connections';
import { FacebookService } from 'app/services/facebook.service';
import { uiAlertFactory } from 'app/test-stubs/factories/ui-alerts';
import { UiAlertStatus } from 'app/models/ui-alerts';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';

describe('SocialConnectionsComponent', () => {
  let component: SocialConnectionsComponent;
  let facebookService: FacebookService;
  let loggingService: LoggingService;
  let errorService: ErrorService;
  let socialConnectionsService: SocialConnectionsService;
  let fixture: ComponentFixture<SocialConnectionsComponent>;
  let spySocialConnectionsGet: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SocialConnectionsComponent ],
      providers: [
        LoggingService,
        UtilityService,
        CookieService,
        SocialConnectionsService,
        ErrorService,
        FacebookService
      ],
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialConnectionsComponent);
    component = fixture.componentInstance;
    loggingService = TestBed.inject(LoggingService);
    errorService = TestBed.inject(ErrorService);
    facebookService = TestBed.inject(FacebookService);
    socialConnectionsService = TestBed.inject(SocialConnectionsService);
    spySocialConnectionsGet = spyOn(socialConnectionsService, 'getSocialConnections');
    spyOn(errorService, 'show');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      spyOn(component.alerts, 'push');
    });

    it('should subscribe to get social connection updates', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));

      component.ngOnInit();

      expect(socialConnectionsService.getSocialConnections).toHaveBeenCalledTimes(1);
    });

    it('should load the merchants social connections', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));
      spyOn(socialConnectionsService, 'loadSocialConnections').and.returnValue(of(null));

      component.ngOnInit();

      expect(socialConnectionsService.loadSocialConnections).toHaveBeenCalledTimes(1);
    });

    it('should trigger a Bugsnag if loading the merchant social connections fails', () => {
      const error = internalServerErrorFactory.build();
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));
      spyOn(socialConnectionsService, 'loadSocialConnections').and.returnValue(throwError(error));
      spyOn(Bugsnag, 'notify');

      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should show an error dialog if loading the merchant social connections fails', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));
      spyOn(socialConnectionsService, 'loadSocialConnections').and.returnValue(throwError(null));
      spyOn(Bugsnag, 'notify');

      component.ngOnInit();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.failedToLoadSocialConnections);
    });

    it('sets the Facebook social connection status correctly (null)', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));

      component.ngOnInit();

      expect(component.facebookStatus).toEqual(FacebookSocialConnectionState.unknown);
    });

    it('sets the Facebook social connection status correctly (null Facebook)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: null
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatus).toEqual(FacebookSocialConnectionState.unknown);
    });

    it('sets the Facebook social connection status correctly (connected)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionConnected()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatus).toEqual(FacebookSocialConnectionState.connected);
    });

    it('sets the Facebook social connection status correctly (not connected)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionNotConnected()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatus).toEqual(FacebookSocialConnectionState.not_connected);
    });

    it('sets the Facebook social connection status correctly (invalid connection)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionInvalidConnection()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatus).toEqual(FacebookSocialConnectionState.invalid_connection);
    });

    it('sets the Facebook social connection status correctly (about to expire)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionAboutToExpire()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatus).toEqual(FacebookSocialConnectionState.about_to_expire);
    });

    it('should add success alert when FB connect status is true', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));
      const fbSuccessDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.success, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_SUCCESS', timeout: 5000 });

      component.ngOnInit();
      spyOn(socialConnectionsService, 'loadSocialConnections').and.returnValue(of(null));
      facebookService.receiveConnectedEvent.next({ status: true });

      expect(component.alerts.push).toHaveBeenCalledWith(fbSuccessDashboardAlert);
      expect(socialConnectionsService.loadSocialConnections).toHaveBeenCalled();
    });

    it('should push an alert when FB connect status is false', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));
      const fbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL', timeout: 5000 });

      component.ngOnInit();
      spyOn(socialConnectionsService, 'loadSocialConnections').and.returnValue(of(null));
      facebookService.receiveConnectedEvent.next({ status: false });

      expect(component.alerts.push).toHaveBeenCalledWith(fbErrorDashboardAlert);
      expect(socialConnectionsService.loadSocialConnections).not.toHaveBeenCalled();
    });

    it('should push an alert when FB connect throws an error', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));
      const fbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL', timeout: 5000 });

      component.ngOnInit();
      spyOn(socialConnectionsService, 'loadSocialConnections').and.returnValue(of(null));
      facebookService.receiveConnectedEvent.error(null);
      facebookService.receiveConnectedEvent = new Subject(); // Reset the subject so the error doesn't affect other tests

      expect(component.alerts.push).toHaveBeenCalledWith(fbErrorDashboardAlert);
      expect(socialConnectionsService.loadSocialConnections).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('facebookStatusDisplay', () => {
    it('sets the correct Facebook connection status string (null)', () => {
      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(null));

      component.ngOnInit();

      expect(component.facebookStatusDisplay).toEqual('');
    });

    it('sets the correct Facebook connection status string (unknown)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: null
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatusDisplay).toEqual('');
    });

    it('sets the correct Facebook connection status string (connected)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionConnected()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatusDisplay).toEqual('SOCIAL_CONNECTIONS.FACEBOOK.CONNECTED_STATUS');
    });

    it('sets the correct Facebook connection status string (not connected)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionNotConnected()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatusDisplay).toEqual('SOCIAL_CONNECTIONS.FACEBOOK.NOT_CONNECTED_STATUS');
    });

    it('sets the correct Facebook connection status string (invalid connection)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionInvalidConnection()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatusDisplay).toEqual('SOCIAL_CONNECTIONS.FACEBOOK.INVALID_CONNECTION_STATUS');
    });

    it('sets the correct Facebook connection status string (about to expire)', () => {
      const socialConnection: SocialConnections = socialConnectionsFactory.build({
        facebook: facebookSocialConnectionAboutToExpire()
      });

      spySocialConnectionsGet.and.returnValue(new BehaviorSubject<SocialConnections>(socialConnection));

      component.ngOnInit();

      expect(component.facebookStatusDisplay).toEqual('SOCIAL_CONNECTIONS.FACEBOOK.CONNECTED_STATUS');
    });
  });

  describe('connectFacebook()', () => {
    beforeEach(() => {
      spyOn(loggingService, 'GTMUpdate');
      spyOn(facebookService, 'initiateAuthFlow');
    });

    it('should call Facebook Service to initiate auth', () => {
      component.connectFacebook();

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Connect to Facebook');
      expect(facebookService.initiateAuthFlow).toHaveBeenCalledTimes(1);
    });
  });

  describe('onClosed', () => {
    it('should remove the alert that was closed', () => {
      const fbSuccessfulDashboardAlert = uiAlertFactory.build({ msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_SUCCESS', timeout: 5000 });
      const fbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL', timeout: 5000 });
      component.alerts = [ fbErrorDashboardAlert, fbSuccessfulDashboardAlert ];
      component.onClosed(fbErrorDashboardAlert);

      expect(component.alerts).toEqual([ fbSuccessfulDashboardAlert ]);
    });

    it('should have no effect if alerts is null', () => {
      const fbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL', timeout: 5000 });
      component.alerts = null;
      component.onClosed(fbErrorDashboardAlert);

      expect(component.alerts).toEqual([]);
    });

    it('should have no effect if alerts is undefined', () => {
      const fbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL', timeout: 5000 });
      component.onClosed(fbErrorDashboardAlert);

      expect(component.alerts).toEqual([]);
    });

    it('should have no effect if alerts is empty array', () => {
      const fbErrorDashboardAlert = uiAlertFactory.build({ type: UiAlertStatus.danger, msg: 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL', timeout: 5000 });
      component.alerts = [];
      component.onClosed(fbErrorDashboardAlert);

      expect(component.alerts).toEqual([]);
    });
  });
});
