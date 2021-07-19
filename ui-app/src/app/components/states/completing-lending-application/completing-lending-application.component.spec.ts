import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LogSeverity } from 'app/models/api-entities/log';
import { ApplicationState } from 'app/models/api-entities/utility';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of } from 'rxjs';
import { CompletingLendingApplicationComponent } from './completing-lending-application.component';
import { AppRoutes } from 'app/models/routes';
import { COMPLETED_APP_STATES, DECLINED_APP_STATES, FAILED_APP_STATES, LendingApplication, COMPLETING_APP_STATES } from 'app/models/api-entities/lending-application';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { LENDING_OFFERS_POLLING } from 'app/constants';
import {
  lendingApplicationFactory
} from 'app/test-stubs/factories/lending-application';
import { RouterTestingModule } from '@angular/router/testing';
import Bugsnag from '@bugsnag/js';

describe('CompletingLendingApplicationComponent', () => {
  let component: CompletingLendingApplicationComponent;
  let fixture: ComponentFixture<CompletingLendingApplicationComponent>;
  let stateRoutingService: StateRoutingService;

  let getLendingApplicationSpy: jasmine.Spy;
  let logSpy: jasmine.Spy;

  const defaultApplication = lendingApplicationFactory.build({ state: ApplicationState.completed });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ CompletingLendingApplicationComponent ],
      providers: [
        CookieService,
        ErrorService,
        LendingApplicationsService,
        LoggingService,
        StateRoutingService,
        UtilityService
      ]
    });

    fixture = TestBed.createComponent(CompletingLendingApplicationComponent);
    component = fixture.componentInstance;
    stateRoutingService = TestBed.inject(StateRoutingService);

    spyOn(stateRoutingService, 'navigate');

    const lendingApplicationsService: LendingApplicationsService = TestBed.inject(LendingApplicationsService);
    const loggingService: LoggingService = TestBed.inject(LoggingService);

    getLendingApplicationSpy = spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(defaultApplication));
    spyOn(lendingApplicationsService, 'loadApplication').and.returnValue(of(null));
    logSpy = spyOn(loggingService, 'log');
    spyOn(Bugsnag, 'notify');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // LIFE CYCLE

  // ------------------------------------------------------------------------------ ngOnInit()
  describe('ngOnInit()', () => {
    it('should poll to refresh current lending application', () => {
      spyOn(component, 'pollForLendingApplication');

      fixture.detectChanges();

      expect(component.pollForLendingApplication).toHaveBeenCalledTimes(1);
    });
  }); // describe - ngOnInit()

  // ------------------------------------------------------------- pollForLendingApplication()
  describe('pollForLendingApplication()', () => {

    describe('if lending application is found and is in FAILED-like state', () => {
      it('should redirect to kyc_failed', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        FAILED_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));
          component.ngOnInit();

          expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.error.kyc_failed, true);
        });

        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(FAILED_APP_STATES.length);
      });

      it('should not register to re-poll', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        FAILED_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));
          component.ngOnInit();

          expect(component.registerNextPollForLendingApplication).not.toHaveBeenCalled();
        });
      });
    }); // describe - 'if lending application is found and is in FAILED-like state'

    describe('if lending application is found and is in DECLINED-like state', () => {
      it('should redirect to lending_application_declined', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        DECLINED_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));
          component.ngOnInit();

          expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.lending_application_declined, true);
        });

        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(DECLINED_APP_STATES.length);
      });

      it('should not register to re-poll', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        DECLINED_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));
          component.ngOnInit();

          expect(component.registerNextPollForLendingApplication).not.toHaveBeenCalled();
        });
      });
    }); // describe - 'if lending application is found and is in DECLINED-like state'

    describe('if the lending application is in COMPLETED-like state', () => {
      it('should redirect to dashboard', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        COMPLETED_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));
          component.ngOnInit();

          expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
        });

        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(COMPLETED_APP_STATES.length);
      });

      it('should not register to re-poll', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        COMPLETED_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));
          component.ngOnInit();

          expect(component.registerNextPollForLendingApplication).not.toHaveBeenCalled();
        });
      });
    }); // describe - ' if the lending application is in COMPLETED-like state'

    describe('if the lending application is in COMPLETED-like state', () => {
      it('should redirect to dashboard', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        COMPLETING_APP_STATES.forEach((state) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: state })));

          component.ngOnInit();
          expect(component.isCompletingApplication).toBeTrue();
          expect(component.iconClass).toEqual('fa-check-circle');
        });
      });
    });

    describe('if the lending application is an any other state', () => {
      const OTHER_STATES = Object.values(ApplicationState).filter((state) => {
        return !COMPLETED_APP_STATES.includes(state) &&
          !FAILED_APP_STATES.includes(state) &&
          !DECLINED_APP_STATES.includes(state) &&
          !COMPLETING_APP_STATES.includes(state);
      });

      it('should call pollForLendingApplication', () => {
        spyOn(component, 'registerNextPollForLendingApplication');

        OTHER_STATES.forEach(() => {
          getLendingApplicationSpy.and.returnValues(
            new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: ApplicationState.pending })),
            new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ state: ApplicationState.reviewing })));

          component.ngOnInit();
        });

        expect(component.registerNextPollForLendingApplication).toHaveBeenCalledTimes(OTHER_STATES.length);
        expect(component.iconClass).toEqual('fa-circle-notch fa-spin');
      });
    });

    describe('if there is no application', () => {
      it('should redirect to dashboard and trigger log with bugsnag', () => {
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(null));
        component.ngOnInit();

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    });

  }); // describe - pollForLendingApplication()

  // ------------------------------------------------- registerNextPollForLendingApplication()
  describe('registerNextPollForLendingApplication()', () => {
    it('schedules only one poll at a time', fakeAsync(() => {
      spyOn(component, 'calculateNextInterval');
      component.registerNextPollForLendingApplication();
      tick();

      expect(component.calculateNextInterval).toHaveBeenCalledTimes(1);
    }));

    it('schedule one poll for the expected time', fakeAsync(() => {
      spyOn(component, 'pollForLendingApplication');
      spyOn(component, 'calculateNextInterval');

      component.registerNextPollForLendingApplication();
      expect(component.pollForLendingApplication).not.toHaveBeenCalled();

      tick();
      expect(component.pollForLendingApplication).toHaveBeenCalledTimes(1);
    }));

    it('scheduling a poll increments the poll retry counter', () => {
      component.backoffConfig.retryCounter = 0;
      expect(component.backoffConfig.retryCounter).toEqual(0);

      component.registerNextPollForLendingApplication();
      expect(component.backoffConfig.retryCounter).toEqual(1);
    });

    it('does not schedule a poll and triggers log if exhausted max poll attempt configured', fakeAsync(() => {
      spyOn(component, 'pollForLendingApplication');
      spyOn(component, 'calculateNextInterval');

      component.backoffConfig.retryCounter = LENDING_OFFERS_POLLING.MAX_ATTEMPTS;

      component.registerNextPollForLendingApplication();

      expect(component.backoffConfig.retryCounter).toEqual(LENDING_OFFERS_POLLING.MAX_ATTEMPTS);
      tick();

      expect(component.pollForLendingApplication).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledOnceWith({
        message: `Automated polling lending applications is now disabled after ${component.backoffConfig.maxAttempts} tries.`,
        severity: LogSeverity.warn
      });
    }));

    it('does not call calculate next interval if max tries exceeded', () => {
      spyOn(component, 'calculateNextInterval');
      component.backoffConfig.retryCounter = LENDING_OFFERS_POLLING.MAX_ATTEMPTS + 1;
      component.registerNextPollForLendingApplication();

      expect(component.calculateNextInterval).not.toHaveBeenCalled();
    });

    it('does not schedule a poll if exhausted max poll attempt configured', fakeAsync(() => {
      spyOn(component, 'pollForLendingApplication');
      spyOn(component, 'calculateNextInterval');
      component.backoffConfig.retryCounter = LENDING_OFFERS_POLLING.MAX_ATTEMPTS;

      component.registerNextPollForLendingApplication();
      expect(component.backoffConfig.retryCounter).toEqual(LENDING_OFFERS_POLLING.MAX_ATTEMPTS);

      tick(component.calculateNextInterval());
      expect(component.pollForLendingApplication).not.toHaveBeenCalled();
    }));
  }); // describe - registerNextPollForLendingApplication()

  describe('dashboardRouterLink', () => {
    it('should be set to dashboard root', () => {
      expect(component.dashboardRouterLink).toEqual(AppRoutes.dashboard.root_link);
    });
  });
}); // describe - CompletingLendingApplicationComponent
