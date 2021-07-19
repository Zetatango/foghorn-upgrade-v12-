import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { CalendlyEvent } from 'app/models/calendly_event';
import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { applicationConfiguration } from 'app/test-stubs/factories/application-configuration';
import { businessPartnerProfileFactory, emptyBusinessPartnerProfile, businessPartnerProfileResponseFactory } from 'app/test-stubs/factories/business-partner-profile';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MarketingComponent } from './marketing.component';
import { userSessionFactory } from 'app/test-stubs/factories/user-session';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';

describe('MarketingComponent', () => {
  let component: MarketingComponent;
  let fixture: ComponentFixture<MarketingComponent>;

  let businessPartnerService: BusinessPartnerService;
  let configurationService: ConfigurationService;
  let errorService: ErrorService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let userService: UserSessionService;

  let gtmUpdateSpy: jasmine.Spy;
  let merchantSpy: jasmine.Spy;
  let userSessionSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketingComponent ],
      providers: [
        LoggingService,
        UtilityService,
        CookieService,
        ConfigurationService,
        UserSessionService,
        BusinessPartnerService,
        MerchantService,
        ErrorService
      ],
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketingComponent);
    component = fixture.componentInstance;

    businessPartnerService = TestBed.inject(BusinessPartnerService);
    configurationService = TestBed.inject(ConfigurationService);
    errorService = TestBed.inject(ErrorService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    userService = TestBed.inject(UserSessionService);
    gtmUpdateSpy = spyOn(loggingService, 'GTMUpdate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load merchant if merchant is not initially set in service', () => {
      spyOn(merchantService, 'getMerchant').and.returnValue(null);
      spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));

      component.ngOnInit();

      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
    });

    it('should set merchant if merchant is not initially set in service', () => {
      spyOn(merchantService, 'getMerchant').and.returnValues(null, merchantDataFactory.build());
      spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));

      component.ngOnInit();

      expect(component.merchant).toEqual(merchantDataFactory.build());
    });

    it('should set merchant if merchant is set in service', () => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

      component.ngOnInit();

      expect(component.merchant).toEqual(merchantDataFactory.build());
    });

    describe('with merchant initially not set', () => {
      beforeEach(() => {
        spyOn(merchantService, 'getMerchant').and.returnValues(null, merchantDataFactory.build());
        spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
      });

      it('should load business partner profile', () => {
        spyOn(businessPartnerService, 'getProfile').and.returnValue(of(businessPartnerProfileResponseFactory.build()));
        spyOn(businessPartnerService, 'getBusinessPartnerProfile').and.returnValue(new BehaviorSubject<BusinessPartnerProfile>(emptyBusinessPartnerProfile));

        component.ngOnInit();

        expect(businessPartnerService.getProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id);
        expect(component.businessPartnerProfile).toEqual(emptyBusinessPartnerProfile);
      });
    });

    describe('with merchant initially set', () => {
      beforeEach(() => {
        spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      });

      it('should load business partner profile', () => {
        spyOn(businessPartnerService, 'getProfile').and.returnValue(of(businessPartnerProfileResponseFactory.build()));
        spyOn(businessPartnerService, 'getBusinessPartnerProfile').and.returnValue(new BehaviorSubject<BusinessPartnerProfile>(emptyBusinessPartnerProfile));

        component.ngOnInit();

        expect(businessPartnerService.getProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id);
        expect(component.businessPartnerProfile).toEqual(emptyBusinessPartnerProfile);
      });
    });

    it('should trigger a bugsnag if load merchant fails', () => {
      const error = internalServerErrorFactory.build();
      spyOn(merchantService, 'getMerchant').and.returnValue(null);
      spyOn(merchantService, 'loadMerchant').and.returnValue(throwError(error));
      spyOn(Bugsnag, 'notify');

      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should show an error if load merchant fails', () => {
      const error = internalServerErrorFactory.build();
      spyOn(merchantService, 'getMerchant').and.returnValue(null);
      spyOn(merchantService, 'loadMerchant').and.returnValue(throwError(error));
      spyOn(Bugsnag, 'notify');
      spyOn(errorService, 'show');

      component.ngOnInit();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getMerchant);
    });

    it('should trigger a bugsnag if load business partner profile fails', () => {
      const error = internalServerErrorFactory.build();
      spyOn(merchantService, 'getMerchant').and.returnValues(null, merchantDataFactory.build());
      spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getProfile').and.returnValue(throwError(error));
      spyOn(Bugsnag, 'notify');

      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should show an error dialog if load business partner profile fails', () => {
      spyOn(merchantService, 'getMerchant').and.returnValues(null, merchantDataFactory.build());
      spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getProfile').and.returnValue(throwError(null));
      spyOn(Bugsnag, 'notify');
      spyOn(errorService, 'show');

      component.ngOnInit();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getBusinessPartnerProfileError);
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

  describe('GTMUpdate()', () => {
    it('should call logginService.GTMUpdate with correct anchor link label', () => {
      const buttonLabel = 'View sample blog';
      const event = { target: { innerText: buttonLabel } };

      component.GTMUpdate(event);

      expect(gtmUpdateSpy).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, buttonLabel);
    });

    it('should not call logginService.GTMUpdate when no anchor link label is present', () => {
      const event = { target: { innerText: null } };

      component.GTMUpdate(event);

      expect(gtmUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('marketingSampleBlogUrl', () => {
    it('should return the correct blog url', () => {
      spyOnProperty(configurationService, 'marketingSampleBlogUrl').and.returnValue(applicationConfiguration.marketing_sample_blog_url);

      expect(component.marketingSampleBlogUrl).toEqual(applicationConfiguration.marketing_sample_blog_url);
    });
  });

  describe('schedulePartnerMarketingWithCalendly', () => {
    beforeEach(() => {
      window['Calendly'] = {
        initPopupWidget: (): void => undefined
      };

      spyOn(component.alerts, 'push');
      spyOn(window['Calendly'], 'initPopupWidget');
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());
      spyOnProperty(configurationService, 'marketingCalendlyUrl').and.returnValue(applicationConfiguration.marketing_calendly_url);
      userSessionSpy = spyOnProperty(userService, 'userSession', 'get').and.returnValue(userSessionFactory.build());
    });

    it('should call initPopupWidget and add an event listener', () => {
      spyOn(window, 'addEventListener');

      component.schedulePartnerMarketingWithCalendly();

      const userSession = userSessionFactory.build();
      expect(window['Calendly'].initPopupWidget).toHaveBeenCalledOnceWith({
        url: applicationConfiguration.marketing_calendly_url,
        prefill: {
          name: userSession.name,
          email: userSession.email
        }
      });
    });

    it('should call initPopupWidget with empty prefill when no user session exists and add an event listener', () => {
      spyOn(window, 'addEventListener');
      userSessionSpy.and.returnValue(null);

      component.schedulePartnerMarketingWithCalendly();

      expect(window['Calendly'].initPopupWidget).toHaveBeenCalledOnceWith({
        url: applicationConfiguration.marketing_calendly_url,
        prefill: {
          name: '',
          email: ''
        }
      });
    });

    it('should not call updateProfile unless calendly.event_scheduled event received', () => {
      spyOn(businessPartnerService, 'updateProfile');

      component.schedulePartnerMarketingWithCalendly();

      const event: MessageEvent = new MessageEvent('message', {
        data: {
          event: 'calendly.test_event'
        }
      });
      window.dispatchEvent(event);

      expect(businessPartnerService.updateProfile).not.toHaveBeenCalled();
    });

    it('should call updateProfile if calendly.event_scheduled event received', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(of(businessPartnerProfileResponseFactory.build()));

      component.schedulePartnerMarketingWithCalendly();

      const event: MessageEvent = new MessageEvent('message', {
        data: {
          event: CalendlyEvent.scheduled
        }
      });
      window.dispatchEvent(event);

      expect(businessPartnerService.updateProfile).toHaveBeenCalledOnceWith(merchantDataFactory.build().id, { ario_marketing_requested: true });
    });

    it('should trigger a bugsnag if updateProfile fails', () => {
      const error = internalServerErrorFactory.build();
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(throwError(error));
      spyOn(Bugsnag, 'notify');

      component.schedulePartnerMarketingWithCalendly();

      const event: MessageEvent = new MessageEvent('message', {
        data: {
          event: CalendlyEvent.scheduled
        }
      });
      window.dispatchEvent(event);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should show an error if updateProfile fails', () => {
      const error = internalServerErrorFactory.build();
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(throwError(error));
      spyOn(Bugsnag, 'notify');
      spyOn(errorService, 'show');

      component.schedulePartnerMarketingWithCalendly();

      const event: MessageEvent = new MessageEvent('message', {
        data: {
          event: CalendlyEvent.scheduled
        }
      });
      window.dispatchEvent(event);

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.putBusinessPartnerProfileError);
    });

    it('should call logginService.GTMUpdate with correct anchor link label', () => {
      component.schedulePartnerMarketingWithCalendly();

      const label = 'Schedule marketing meeting';

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, label);
    });

    it('should display a success message on success event', () => {
      spyOn(businessPartnerService, 'updateProfile').and.returnValue(of(businessPartnerProfileResponseFactory.build()));

      component.schedulePartnerMarketingWithCalendly();

      const event: MessageEvent = new MessageEvent('message', {
        data: {
          event: CalendlyEvent.scheduled
        }
      });
      window.dispatchEvent(event);

      expect(component.alerts.push).toHaveBeenCalledWith({
        type: UiAlertStatus.success,
        msg: 'MARKETING.SCHEDULE_MEETING_SUCCESS',
        timeout: 5000
      });
    });
  });

  describe('onClosed', () => {
    it('should remove the alert that was closed', () => {
      const alert1: UiAlert = {
        type: UiAlertStatus.success,
        msg: 'alert1',
        timeout: 5000
      };

      const alert2: UiAlert = {
        type: UiAlertStatus.success,
        msg: 'alert2',
        timeout: 5000
      };

      component.alerts = [alert1, alert2];
      component.onClosed(alert1);

      expect(component.alerts).toEqual([alert2]);
    });

    it('should have no effect if alerts is null, undefined or an empty array', () => {
      [null, undefined, []].forEach(invalidValue => {
        const alert1: UiAlert = {
          type: UiAlertStatus.success,
          msg: 'alert1',
          timeout: 5000
        };

        component.alerts = invalidValue;
        component.onClosed(alert1);

        expect(component.alerts).toEqual([]);
      });
    });
  });

  describe('requestMeetingDisabled', () => {
    beforeEach(() => {
      merchantSpy = spyOnProperty(component, 'merchant');
    });

    it('should be false if merchant is falsy', () => {
      merchantSpy.and.returnValue(null);
      expect(component.requestMeetingDisabled).toBeTruthy();
    });

    describe('when merchant is truthy', () => {
      beforeEach(() => {
        merchantSpy.and.returnValue(merchantDataFactory.build());
      });

      it('should be false if ario_marketing_requested_at is undefined, null or blank', () => {
        [null, undefined, ''].forEach(invalidValue => {
          component.businessPartnerProfile = businessPartnerProfileFactory.build({ ario_marketing_requested_at: invalidValue });

          expect(component.requestMeetingDisabled).toBeFalsy();
        });
      });

      it('should be true if businessPartnerProfile is null', () => {
        component.businessPartnerProfile = null;

        expect(component.requestMeetingDisabled).toBeTruthy();
      });

      it('should be true if ario_marketing_requested_at is set', () => {
        component.businessPartnerProfile = businessPartnerProfileFactory.build({ ario_marketing_requested_at: Date.now().toString() });

        expect(component.requestMeetingDisabled).toBeTruthy();
      });
    });
  });

  describe('scheduleMarketingCampaignEnabled', () => {
    it('should return the correct blog url', () => {
      spyOnProperty(configurationService, 'scheduleMarketingCampaignEnabled').and
        .returnValue(applicationConfiguration.schedule_marketing_campaign_enabled);

      expect(component.scheduleMarketingCampaignEnabled).toEqual(applicationConfiguration.schedule_marketing_campaign_enabled);
    });
  });

}); // describe - Marketing
