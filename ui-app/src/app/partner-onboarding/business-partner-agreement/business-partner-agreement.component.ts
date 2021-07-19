import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ErrorService } from 'app/services/error.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ReauthService } from 'app/services/reauth.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-business-partner-agreement',
  templateUrl: './business-partner-agreement.component.html'
})
export class BusinessPartnerAgreementComponent implements OnDestroy, OnInit {
  private _acceptingAgreement = false;
  private _signingAgreement = false;
  private _becomeBusinessPartnerFailed = false;
  private _businessPartnerApplication: BusinessPartnerApplication;
  private _loaded = false;
  unsubscribe$ = new Subject<void>();

  constructor(private businessPartnerService: BusinessPartnerService,
              private errorService: ErrorService,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private ngZone: NgZone,
              private reauthService: ReauthService,
              private stateRoutingService: StateRoutingService,
              private translateService: TranslateService) {}

  ngOnInit(): void {
    this.getBusinessPartnerApplication();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  signBusinessPartnerAgreement(): void {
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Sign Business Partner Agreement');
    if (!this.signingAgreement) {
      const locale: string = this.translateService.currentLang;
      this.signingAgreement = true;
      this.reauthService.open(locale)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((data: any) => { // eslint-disable-line
            this.signingAgreement = false;
            if (data.status === this.reauthService.SUCCESS) {
              this.acceptBusinessPartnerApplication();
            }
          },
          () => {
            this.errorService.show(UiError.signByReauth);
            this.signingAgreement = false;
          });
    }
  }

  back(): void {
    this.stateRoutingService.navigate(AppRoutes.partner_onboarding.business_partner_branding, true);
  }

  merchantName(): string {
    // We will use the legal business name instead of the doing business as since this is used for a legal contract agreement
    return this.merchantService.getMerchant().name;
  }

  /**
   * ngZone.run required due to reauth window being outside of Angular zone when attempting to navigate
   */
  private acceptBusinessPartnerApplication(): void {
    if (!this.acceptingAgreement) {
      this.acceptingAgreement = true;
      this.merchantService.becomeBusinessPartner().pipe(takeUntil(this.unsubscribe$)).subscribe(
        () => {
          this.ngZone.run(() =>{
            this.stateRoutingService.navigate(AppRoutes.dashboard.root, true);
          });
        },
        () => {
          this.acceptingAgreement = false;
          this.becomeBusinessPartnerFailed = true;
          this.errorService.show(UiError.newBusinessPartnerError);
        }
      );
    }
  }

  private getBusinessPartnerApplication(): void {
    this.businessPartnerService.fetchBusinessPartnerApplication(this.merchantService.getMerchant().id, true).pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.setBusinessPartnerApplicationSubscription();
        },
        () => {
          this.errorService.show(UiError.getBusinessPartnerApplicationError);
        });
  }

  private setBusinessPartnerApplicationSubscription(): void {
    this.businessPartnerService.getBusinessPartnerApplication()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((businessPartnerApplication: BusinessPartnerApplication) => {
        this.businessPartnerApplication = businessPartnerApplication;
        this.loaded = true;
      });
  }

  set signingAgreement(signing: boolean) {
    this._signingAgreement = signing;
  }

  get signingAgreement(): boolean {
    return this._signingAgreement;
  }

  set acceptingAgreement(accepting: boolean) {
    this._acceptingAgreement = accepting;
  }

  get acceptingAgreement(): boolean {
    return this._acceptingAgreement;
  }

  get businessPartnerApplication(): BusinessPartnerApplication {
    return this._businessPartnerApplication;
  }

  set businessPartnerApplication(value: BusinessPartnerApplication) {
    this._businessPartnerApplication = value;
  }

  get becomeBusinessPartnerFailed(): boolean {
    return this._becomeBusinessPartnerFailed;
  }

  set becomeBusinessPartnerFailed(failed: boolean) {
    this._becomeBusinessPartnerFailed = failed;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(value: boolean) {
    this._loaded = value;
  }
}
