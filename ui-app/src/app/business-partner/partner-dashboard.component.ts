import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { BusinessPartnerApplication, BusinessPartnerApplicationState } from 'app/models/api-entities/business-partner-application';
import { LogSeverity } from 'app/models/api-entities/log';
import { AppRoutes } from 'app/models/routes';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { LoadingService } from 'app/services/loading.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { LoggingService } from 'app/services/logging.service';

@Component({
  selector: 'ztt-partner-dashboard',
  templateUrl: './partner-dashboard.component.html'
})
export class PartnerDashboardComponent implements OnDestroy, OnInit {
  private _businessPartnerApplicationSubscription$: Subscription;
  private _mainLoader: string;
  private _loaded: boolean;

  constructor(private businessPartnerService: BusinessPartnerService,
              private loadingService: LoadingService,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private stateRoutingService: StateRoutingService) {
    this.mainLoader = loadingService.getMainLoader();
  }

  ngOnDestroy(): void {
    if (this.businessPartnerApplicationSubscription$ && !this.businessPartnerApplicationSubscription$.closed) {
      this.businessPartnerApplicationSubscription$.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.checkMerchant();
    this.loadingService.showMainLoader();
  }

  private checkMerchant(): void {
    if (!this.merchantService.getMerchant()) {
      this.merchantService.loadMerchant().subscribe(
        () => this.getBusinessPartnerApplicationStatus(),
        (err) => this.loggingService.log({ message: err.message, severity: LogSeverity.error }));
    } else {
      this.getBusinessPartnerApplicationStatus();
    }
  }


  private getBusinessPartnerApplicationStatus(): void {
    this.businessPartnerService.fetchBusinessPartnerApplication(this.merchantService.getMerchant().id, false).pipe(take(1))
      .subscribe(
        () => {
          this.setBusinessPartnerApplicationSubscription();
        },
        () => {
          this.accessDenied();
        });
  }

  private setBusinessPartnerApplicationSubscription(): void {
    this.businessPartnerApplicationSubscription$ = this.businessPartnerService.getBusinessPartnerApplication()
      .subscribe((businessPartnerApplication: BusinessPartnerApplication) => {
        if (businessPartnerApplication.state !== BusinessPartnerApplicationState.complete) {
          this.accessDenied();
          return;
        }

        this.redirect();
      });
  }

  private redirect(): void {
    this.loaded = true;
    this.stateRoutingService.navigate(AppRoutes.partner_dashboard.business_partner_dashboard, true);
  }

  private accessDenied(): void {
    // If business partner application is not complete, or we cannot load application, go to borrower dashboard
    this.stateRoutingService.navigate(AppRoutes.dashboard.root);
  }

  get businessPartnerApplicationSubscription$(): Subscription {
    return this._businessPartnerApplicationSubscription$;
  }

  set businessPartnerApplicationSubscription$(applicationSubscription: Subscription) {
    this._businessPartnerApplicationSubscription$ = applicationSubscription;
  }

  get mainLoader(): string {
    return this._mainLoader;
  }

  set mainLoader(loader: string) {
    this._mainLoader = loader;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(loaded: boolean) {
    this._loaded = loaded;
  }
}
