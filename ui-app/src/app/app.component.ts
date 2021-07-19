import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { SupportedLanguage } from './models/languages';
import { TranslateService } from '@ngx-translate/core';
import { BorrowerInvoiceService } from './services/borrower-invoice.service';
import { StateRoutingService } from './services/state-routing.service';
import { LoggingService } from './services/logging.service';
import { UserSessionService } from 'app/services/user-session.service';
import { Subject } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { AppRoutes } from './models/routes';
import { REAUTH } from './constants';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage } from "./models/error-response";

@Component({
  selector: 'ztt-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  // component variables:
  private _flow: string;

  constructor(
    public translateService: TranslateService,
    private activatedRoute: ActivatedRoute,
    private borrowerInvoiceService: BorrowerInvoiceService,
    private elementRef: ElementRef,
    private loggingService: LoggingService,
    private router: Router,
    private stateRouter: StateRoutingService,
    private titleService: Title,
    private userSessionService: UserSessionService,
  ) {
  }

  /* istanbul ignore next */
  ngOnInit(): void {
    this._flow = this.elementRef.nativeElement.getAttribute('flow');
    this.setupReauthWindowCloseListener();
    this.setAppLanguage();
    this.setPageTitle();
    this.startMainFlow();
    this.stateRouter.initScrollResetWatch();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private setAppLanguage(): void {
    // Set translation
    this.translateService.addLangs([SupportedLanguage.en, SupportedLanguage.fr]);
    this.translateService.setDefaultLang(SupportedLanguage.default);
  }

  private setupReauthWindowCloseListener(): void {
    if (this._flow === AppRoutes.quickbooks.root) return;

    /* istanbul ignore if */
    if (window.opener) {
      try {
        // Note: This will be block by chrome cross-origin policy if the current window has been opened from an other domain.
        //       This would not occure in normal setting: Forghorn opens the reauth window itself.
        window.opener.postMessage({type: 'reauth', message: REAUTH.SUCCESS}, window.location.origin);
      } catch (e) {
        Bugsnag.notify(new ErrorMessage(`Didn\'t setup reauth listener due to: ${e.message}`));
      }
    }
  }

  private setPageTitle(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;

          while (child?.firstChild) {
            child = child.firstChild;
          }

          return this.generateTitle(child);
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (key: string) => {
          this.translateService.stream(`HEAD.TITLE.${key}`)
            .pipe(
              takeUntil(this.unsubscribe$)
            )
            .subscribe(
              (title: string) => {
                this.titleService.setTitle(title);
              }
            );
        }
      );
  }

  private generateTitle(child: ActivatedRoute): string {
    return child?.snapshot?.data?.['title_key'] || this.titleService.getTitle();
  }

  private startMainFlow(): void {
    // Set main flow route
    const invoiceId = this.elementRef.nativeElement.getAttribute('invoice_id');
    this.borrowerInvoiceService.saveActiveInvoiceId(invoiceId);
    this.loggingService.GTMSetUserID(this.userSessionService.userId, this.userSessionService.userEmail);
    this.stateRouter.navigate(this._flow);
  }
}
