import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Event, NavigationEnd, NavigationStart, Router, RouterEvent } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppRoutes } from 'app/models/routes';
import { StateRoutingService } from './state-routing.service';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Observable } from 'rxjs';

describe('StateRoutingService', () => {
  let loggingService: LoggingService;
  let router: Router;
  let stateRoutingService: StateRoutingService;
  const routerSubject = new BehaviorSubject<RouterEvent>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        CookieService,
        LoggingService,
        StateRoutingService,
        UtilityService,
        {
          provide: Router,
          useValue: {
            url: `/${AppRoutes.insights.root}`,
            events: routerSubject.asObservable(),
            navigateByUrl: jasmine.createSpy()
          }
        },
      ]
    });
  });

  beforeEach(() => {
    loggingService = TestBed.inject(LoggingService);
    router = TestBed.inject(Router);
    stateRoutingService = TestBed.inject(StateRoutingService);
  });

  it('should be created', () => {
    expect(stateRoutingService).toBeTruthy();
  });

  describe('navigate', () => {
    it('should use proper parameters for router.navigateByUrl', () => {
      stateRoutingService.navigate(AppRoutes.application.root);

      expect(router.navigateByUrl).toHaveBeenCalledOnceWith(AppRoutes.application.root, { skipLocationChange: false });
    });
  });

  describe('navigateAndSkip', () => {
    it('should use proper parameters for router.navigateByUrl', () => {
      stateRoutingService.navigate(AppRoutes.application.root, true);

      expect(router.navigateByUrl).toHaveBeenCalledOnceWith(AppRoutes.application.root, { skipLocationChange: true });
    });

    it('should call loggingService.logCurrentPage with proper parameters', () => {
      spyOn(loggingService, 'logCurrentPage');
      stateRoutingService.navigate(AppRoutes.onboarding.authenticate_applicant, true);

      expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(AppRoutes.onboarding.authenticate_applicant);
    });
  });

  describe('rootRoute', () => {
    it('should return flinks_route if set in route', () => {
      const route = new ActivatedRouteSnapshot();
      route.data = {
        flinks_route: AppRoutes.application.root
      };
      expect(stateRoutingService.rootRoute(route)).toEqual(AppRoutes.application.root);
    });

    it('should return unknown if flinks_route is not set 1/2', () => {
      const route = new ActivatedRouteSnapshot();
      expect(stateRoutingService.rootRoute(route)).toEqual(AppRoutes.unknown);
    });

    it('should return unknown if flinks_route is not set 2/2', () => {
      const route = new ActivatedRouteSnapshot();
      route.data = {};
      expect(stateRoutingService.rootRoute(route)).toEqual(AppRoutes.unknown);
    });
  });

  describe('ignoreRootEvents', () => {
    let ignoreRootEvents$: Observable<Event>;
    
    beforeEach(() => {
      ignoreRootEvents$ = stateRoutingService.ignoreRootEvents(AppRoutes.insights.root)
    });

    it('should NOT emit value when event wrong type or URL is NOT root route', () => {
      const subscription = ignoreRootEvents$.subscribe(() => {
        fail();
      });

      routerSubject.next(new NavigationStart(0, `/${AppRoutes.dashboard.root}`, 'imperative'));
      routerSubject.next(new NavigationEnd(0, `/${AppRoutes.application.root}`, `/${AppRoutes.application.root}`));
      routerSubject.next(new NavigationEnd(0, `/${AppRoutes.application.select_lending_offer}`, `/${AppRoutes.application.select_lending_offer}`));
      subscription.unsubscribe();
    });

    it('should emit value when event is of type NavigationEnd and URL is root route', () => {
      const event: NavigationEnd = new NavigationEnd(2828, `/${AppRoutes.insights.root}`, `/${AppRoutes.insights.root}`);

      const subscription = ignoreRootEvents$.subscribe((e: NavigationEnd) => {
        expect(e).toBeTruthy();
        expect(e.id).toEqual(event.id);
      });

      routerSubject.next(event);
      subscription.unsubscribe();
    });
  })
});
