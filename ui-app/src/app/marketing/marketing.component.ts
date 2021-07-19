import { Component, OnDestroy, OnInit } from '@angular/core';
import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { Merchant } from 'app/models/api-entities/merchant';
import { CalendlyEvent } from 'app/models/calendly_event';
import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-marketing',
  templateUrl: './marketing.component.html'
})

export class MarketingComponent implements OnDestroy, OnInit {
  private _merchant: Merchant;
  private _alerts: UiAlert[] = [];
  unsubscribe$ = new Subject<void>();
  private _partnerMarketingScheduledSubject$: Subject<boolean> = new Subject<boolean>();
  private _businessPartnerProfile: BusinessPartnerProfile = null;

  constructor(private _configurationService: ConfigurationService,
              private _loggingService: LoggingService,
              private _userSessionService: UserSessionService,
              private _merchantService: MerchantService,
              private _businessPartnerService: BusinessPartnerService,
              private _errorService: ErrorService,
              public translateService: TranslateService) {}

  ngOnInit(): void {
    this.loadMerchant();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  GTMUpdate(event): void { // eslint-disable-line
    const label = event.target.innerText;
    if (label) this._loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, label);
  }

  get marketingSampleBlogUrl(): string {
    return this._configurationService.marketingSampleBlogUrl;
  }

  get merchant(): Merchant {
    return this._merchant;
  }

  set merchant(merchant: Merchant) {
    this._merchant = merchant;
  }

  get partnerMarketingScheduledSubject$(): Subject<boolean> {
    return this._partnerMarketingScheduledSubject$;
  }

  schedulePartnerMarketingWithCalendly(): void {
    this._loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Schedule marketing meeting');
    let prefill = {
      email: '',
      name: ''
    };

    if (this._userSessionService.userSession) {
      prefill = {
        email: this._userSessionService.userSession.email,
        name: this._userSessionService.userSession.name
      };
    }

    window['Calendly'].initPopupWidget({
      url: this._configurationService.marketingCalendlyUrl,
      prefill: prefill
    });

    this.setupCalendlyEventListeners();
  }

  private setupCalendlyEventListeners(): void {
    this.partnerMarketingScheduledSubject$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.setPartnerMarketingScheduledCompleted();
      });

    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data.event === CalendlyEvent.scheduled) {
        this.partnerMarketingScheduledSubject$.next(true);

        this.alerts.push({
          type: UiAlertStatus.success,
          msg: 'MARKETING.SCHEDULE_MEETING_SUCCESS',
          timeout: 5000
        });
      }
    });
  }

  private setPartnerMarketingScheduledCompleted(): void {
    const params: BusinessPartnerProfileRequestParams = {
      ario_marketing_requested: true
    };

    this.updateProfile(params);
  }

  private updateProfile(params: BusinessPartnerProfileRequestParams): void {
    this._businessPartnerService.updateProfile(this.getMerchantId(), params)
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this._errorService.show(UiError.putBusinessPartnerProfileError);
        }
      });
  }

  private loadBusinessPartnerProfile(): void {
    this._businessPartnerService.getProfile(this.getMerchantId()).pipe(take(1)).subscribe(
      () => {
        this.setBusinessPartnerProfileSubscription();
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);

        this._errorService.show(UiError.getBusinessPartnerProfileError);
      }
    );
  }

  private setBusinessPartnerProfileSubscription(): void {
    this._businessPartnerService.getBusinessPartnerProfile().pipe(takeUntil(this.unsubscribe$)).subscribe((businessPartnerProfile: BusinessPartnerProfile) => {
      this.businessPartnerProfile = businessPartnerProfile;
    });
  }

  set businessPartnerProfile(value: BusinessPartnerProfile) {
    this._businessPartnerProfile = value;
  }

  get businessPartnerProfile(): BusinessPartnerProfile {
    return this._businessPartnerProfile;
  }

  private loadMerchant(): void {
    if (!this._merchantService.getMerchant()) {
      this._merchantService.loadMerchant()
        .pipe(take(1))
        .subscribe(
        () => this.setMerchantAndPartnerProfile(),
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this._errorService.show(UiError.getMerchant);
        }
      );
    } else {
      this.setMerchantAndPartnerProfile();
    }
  }

  private setMerchantAndPartnerProfile(): void {
    this.merchant = this._merchantService.getMerchant();
    this.loadBusinessPartnerProfile();
  }

  set alerts(value: UiAlert[]) {
    this._alerts = value;
  }

  get alerts(): UiAlert[] {
    return this._alerts;
  }

  onClosed(dismissedAlert: UiAlert): void {
    this.alerts = (this.alerts || []).filter(alert => alert !== dismissedAlert);
  }

  get requestMeetingDisabled(): boolean {
    return !this.merchant || !this.businessPartnerProfile || !!this.businessPartnerProfile.ario_marketing_requested_at;
  }

  get scheduleMarketingCampaignEnabled(): boolean {
    return this._configurationService.scheduleMarketingCampaignEnabled === true;
  }

  private getMerchantId(): string {
    return this.merchant ? this.merchant.id : undefined;
  }
}
