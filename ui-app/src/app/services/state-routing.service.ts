import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Event, NavigationEnd, Router, Scroll } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { LoggingService } from 'app/services/logging.service';
import { delay, filter } from 'rxjs/operators';
import { AppRoutes } from 'app/models/routes';
import { Observable } from 'rxjs';

@Injectable()
export class StateRoutingService {

  get url(): string {
    return this.router.url;
  }

  constructor(
    private readonly router: Router,
    private loggingService: LoggingService,
    private viewportScroller: ViewportScroller
  ) {}

  /**
   * window.location.href is not accessible to spyOn, so for unit testing purposes we will make the redirect call from a separate method that just performs
   * the redirect. Then we will verify that the below method is called when a redirect should be performed.
   *
   * Note, the redirect line (window.location.href = ...) is being ignored for code coverage as performing a `callThrough` and actually performing this
   * action will cause the tests to hang and crash.
   */

  /* istanbul ignore next */
  static performRedirect(redirectLocation: string): void {
    window.location.href = redirectLocation;
  }

  /**
   * The window.location.href is not accessible to spyOn, so for unit testing purposes we will
   * make the redirect call from a separate method that just performs the redirect.
   * Then we will verify that the below method is called when a redirect should be performed.
   *
   * Note: The redirect line (window.location.href = ...) is being ignored for code coverage as performing
   *       a `callThrough` and actually performing this action will cause the tests to hang and crash.
   */
  /* istanbul ignore next */
  public performRedirect(redirectLocation: string): void {
    window.location.href = redirectLocation;
  }
  
  // TODO: Tests needed
  /* istanbul ignore next */
  public initScrollResetWatch(): void {
    // listen to routing events, and scroll to top when navigation ends.
    this.router.events
      .pipe(
        filter((e: Event): e is Scroll => e instanceof Scroll),
        delay(0),
      )
      .subscribe(() => {
        // default behaviour.
        this.viewportScroller.scrollToPosition([0, 0]);
        const zttMain = document.getElementById('ztt-main');

        /* istanbul ignore next */
        if (zttMain) {
          zttMain.scrollTop = 0;
        }
      });
  }

  /**
   * Navigate to route with or without URL change.
   * Only root routes should used. ex. `onboarding`, `application`, `dashboard`, etc.
   * When skip is true: e.g. `navigateAndSkip('onboarding/about_business')` or `navigateAndSkip('/onboarding/abou_you')` while on `/onboarding`
   * All routes are treated as absolute URLs.
   */
  navigate(route: string, skip = false): void {
    this.router.navigateByUrl(route, { skipLocationChange: skip });
    if (skip) this.loggingService.logCurrentPage(route);
  }

  rootRoute(snapshot: ActivatedRouteSnapshot): string {
    return snapshot.data?.flinks_route || AppRoutes.unknown;
  }

  ignoreRootEvents(route: string): Observable<Event> {
    return this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter((event: NavigationEnd) => [ this.router.url, event.url ].every(url => url === `/${route}`)),
      );
  }
}
