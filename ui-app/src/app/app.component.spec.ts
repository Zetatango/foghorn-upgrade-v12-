import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { HttpLoaderFactory } from 'app/app.module';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AppComponent } from 'app/app.component';
import { SupportedLanguage } from 'app/models/languages';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppLoadService } from 'app/services/app-load.service';
import { UserSessionService } from 'app/services/user-session.service';
import { LoggingService } from './services/logging.service';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot, ActivationEnd, ActivationStart, ChildActivationEnd, ChildActivationStart,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Route, RouteConfigLoadEnd, RouteConfigLoadStart,
  Router, Event, Scroll,
  UrlSegment, Params
} from '@angular/router';
import { AppRoutes } from './models/routes';
import { REAUTH } from './constants';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage } from "./models/error-response";
import { MockProvider } from 'ng-mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BorrowerInvoiceService } from './services/borrower-invoice.service';

class MockActivatedRoute {
  private innerTestParams?: Record<string, unknown>;
  private subject?: BehaviorSubject<unknown> = new BehaviorSubject(this.testParams);

  params = this.subject.asObservable();
  queryParams = this.subject.asObservable();

  constructor(params: Params = {}) {
    this.testParams = params;
  }

  get testParams() {
    return this.innerTestParams;
  }

  set testParams(params: Record<string, unknown>) {
    this.innerTestParams = params;
    this.subject.next(params);
  }

  get firstChild() {
    return this.testParams['firstChild'];
  }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  let httpClient: HttpClient;
  let loggingService: LoggingService;
  let stateRoutingService: StateRoutingService;
  let titleService: Title;
  let translateService: TranslateService;
  let userSessionService: UserSessionService;

  const userId = '1';
  const userEmail = 'dW5kZWZpbmVk';

  const eventsSubject: Subject<Event> = new Subject<Event>();
  const activatedRouteMock = new MockActivatedRoute();

  const defaultActivatedRouteParams = {
    firstChild: {
      snapshot: {
        url: [new UrlSegment('/onboarding', {})],
        data: {
          title_key: 'ONBOARDING'
        }
      },
      firstChild: {
        snapshot: {
          url: [new UrlSegment('/onboarding', {})],
          data: {
            title_key: 'ABOUT_BUSINESS'
          }
        }
      }
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [AppComponent],
      providers: [
        MockProvider(BorrowerInvoiceService),
        MockProvider(LoggingService),
        MockProvider(UserSessionService),
        StateRoutingService,
        {
          provide: APP_BASE_HREF,
          useValue: '/'
        },
        MockProvider(AppLoadService),
        {
          provide: Router,
          useValue:
          {
            url: '/onboarding',
            events: eventsSubject,
            navigate: jasmine.createSpy('navigate')
          }
        },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock
        }
      ]
    })
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.debugElement.componentInstance;

    httpClient = TestBed.inject(HttpClient);
    loggingService = TestBed.inject(LoggingService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    titleService = TestBed.inject(Title);
    translateService = TestBed.inject(TranslateService);
    userSessionService = TestBed.inject(UserSessionService);

    spyOn(stateRoutingService, 'navigate');
    spyOnProperty(userSessionService, 'userId').and.returnValue(userId);
    spyOnProperty(userSessionService, 'userEmail').and.returnValue(userEmail);
    spyOn(Bugsnag, 'notify');
    spyOn(loggingService, 'GTMSetUserID');
  });

  it('should create the app', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  it('should return the TranslateHttpLoader when the app initializes', () => {
    const httpLoaderFactory = HttpLoaderFactory(httpClient);
    fixture.detectChanges();

    expect(httpLoaderFactory.constructor.name).toEqual('TranslateHttpLoader');
  });

  describe('ngOnInit()', () => {
    it('should route to retrieved flow',
      () => {
        spyOn(fixture.elementRef.nativeElement, 'getAttribute')
          .withArgs('flow').and.returnValue('application')
          .withArgs('invoice_id').and.returnValue('');

        fixture.detectChanges();

        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.root);
      });

    describe('when initScrollResetWatch is setup', () => {
      it('triggers stateRoutingService initScrollResetWatch() and finds the element', () => {
        spyOn($.fn, 'scrollTop');
        spyOn(stateRoutingService, 'initScrollResetWatch').and.callThrough();
        fixture.detectChanges();

        expect(stateRoutingService.initScrollResetWatch).toHaveBeenCalledTimes(1);
      });
    });

    describe('invokes setupReauthWindowCloseListener and', () => {
      beforeEach(() => {
        (window as any).opener = {
          postMessage: () => undefined
        };
        spyOn(window.opener, 'postMessage');
      });

      it('sends a success event to parent window messageChannel', () => {
        fixture.detectChanges();
        expect(window.opener.postMessage).toHaveBeenCalled();
        expect(window.opener.postMessage).toHaveBeenCalledWith({ type: 'reauth', message: REAUTH.SUCCESS }, window.location.origin);
      });

      it('does not send a success event to parent window messageChannel when the route is quickbooks', () => {
        spyOn(fixture.elementRef.nativeElement, 'getAttribute')
          .withArgs('flow').and.returnValue(AppRoutes.quickbooks.root)
          .withArgs('invoice_id').and.returnValue('');

        fixture.detectChanges();
        expect(window.opener.postMessage).not.toHaveBeenCalled();
      });
    });

    describe('setupReauthWindowCloseListener on error', () => {
      it('logs a bugsnag', () => {
        const error = new Error('An error message');
        const errorMessage = new ErrorMessage(`Didn\'t setup reauth listener due to: ${error.message}`);

        spyOn(window.opener, 'postMessage').and.throwError(error);

        fixture.detectChanges();
        expect(Bugsnag.notify).toHaveBeenCalledOnceWith(errorMessage);
      });
    });

    it('should run setPageTitle', () => {
      spyOn(titleService, 'setTitle');

      fixture.detectChanges();
      activatedRouteMock.testParams = defaultActivatedRouteParams;
      eventsSubject.next(new NavigationEnd(0, '/onboarding', '/onboarding'));

      expect(titleService.setTitle).toHaveBeenCalledOnceWith('HEAD.TITLE.ABOUT_BUSINESS');
    });

    it('should not call setTitle for events other than NavigationEnd', () => {
      spyOn(titleService, 'setTitle');

      const sampleRouteActivationSnapshot: ActivatedRouteSnapshot = {
        routeConfig: null,
        url: [new UrlSegment('/onboarding', {})],
        params: [],
        queryParams: [],
        fragment: '',
        data: [],
        outlet: '/',
        component: null,
        root: null,
        parent: null,
        firstChild: null,
        children: [null],
        pathFromRoot: [null],
        paramMap: null,
        queryParamMap: null
      };

      const mockRoute: Route = {
        path: '/onboarding'
      };

      const ignoredEvents = [
        new NavigationCancel(1, '/onboarding', 'redirectUrl'),
        new NavigationError(1, '/invalid', 'generic error'),
        new NavigationStart(1, '/onboarding'),
        new RouteConfigLoadStart(mockRoute),
        new RouteConfigLoadEnd(mockRoute),
        new ChildActivationStart(sampleRouteActivationSnapshot),
        new ChildActivationEnd(sampleRouteActivationSnapshot),
        new ActivationStart(sampleRouteActivationSnapshot),
        new ActivationEnd(sampleRouteActivationSnapshot),
        new Scroll(new NavigationEnd(1, '/onboarding', '/onboarding'), [0, 0], null)
      ];

      fixture.detectChanges();
      ignoredEvents.forEach(ignoredEvent => {
        activatedRouteMock.testParams = defaultActivatedRouteParams;
        eventsSubject.next(ignoredEvent);
        expect(titleService.setTitle).not.toHaveBeenCalled();
      });
    });

    describe('use current title for page', () => {
      it('should return current title when child is null', () => {
        const expectedTitle = '123';
        spyOn(titleService, 'getTitle').and.returnValue(expectedTitle);
        spyOn(titleService, 'setTitle');

        fixture.detectChanges();

        activatedRouteMock.testParams = {};

        eventsSubject.next(new NavigationEnd(0, 'http://localhost:4200/login', 'http://localhost:4200/login'));
        expect(titleService.setTitle).toHaveBeenCalledOnceWith('HEAD.TITLE.' + expectedTitle);
      });

      it('should return current title when child route falsy', () => {
        const expectedTitle = '123';
        spyOn(titleService, 'getTitle').and.returnValue(expectedTitle);
        spyOn(titleService, 'setTitle');

        fixture.detectChanges();

        activatedRouteMock.testParams = { firstChild: {} };
        eventsSubject.next(new NavigationEnd(0, 'http://localhost:4200/login', 'http://localhost:4200/login'));
        expect(titleService.setTitle).toHaveBeenCalledOnceWith('HEAD.TITLE.' + expectedTitle);
      });

      it('should return current title when child route snapshot is falsy', () => {
        const expectedTitle = '123';
        spyOn(titleService, 'getTitle').and.returnValue(expectedTitle);
        spyOn(titleService, 'setTitle');

        fixture.detectChanges();

        activatedRouteMock.testParams = { firstChild: { snapshot: {} } };
        eventsSubject.next(new NavigationEnd(0, 'http://localhost:4200/login', 'http://localhost:4200/login'));
        expect(titleService.setTitle).toHaveBeenCalledOnceWith('HEAD.TITLE.' + expectedTitle);
      });

      it('should return current title when child route snapshot data is falsy', () => {
        const expectedTitle = '123';
        spyOn(titleService, 'getTitle').and.returnValue(expectedTitle);
        spyOn(titleService, 'setTitle');

        fixture.detectChanges();

        activatedRouteMock.testParams = { firstChild: { snapshot: { data: {} } } };
        eventsSubject.next(new NavigationEnd(0, 'http://localhost:4200/login', 'http://localhost:4200/login'));
        expect(titleService.setTitle).toHaveBeenCalledOnceWith('HEAD.TITLE.' + expectedTitle);
      });
    });
  });

  // ------------------------------------------------------------------- recoverPreferredLang()
  describe('setAppLanguage()', () => {
    it('should set en and fr as supported languages', () => {
      spyOn(translateService, 'addLangs');

      component.ngOnInit();

      expect(translateService.addLangs).toHaveBeenCalledTimes(2); // setDefaultLang calls it again.
      expect(translateService.addLangs).toHaveBeenCalledWith([SupportedLanguage.en, SupportedLanguage.fr]);
    });

    it('should set default language', () => {
      spyOn(translateService, 'addLangs');
      spyOn(translateService, 'setDefaultLang');

      component.ngOnInit();

      expect(translateService.setDefaultLang).toHaveBeenCalledOnceWith(SupportedLanguage.default);
    });
  }); // describe - recoverPreferredLang()

  describe('startMainFlow', () => {
    it('should call GTMSetUserId with user session id', () => {
      component.ngOnInit();

      expect(loggingService.GTMSetUserID).toHaveBeenCalledOnceWith(userId, userEmail);
    });
  });
});
