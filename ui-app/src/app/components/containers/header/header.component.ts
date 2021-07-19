import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LOADER } from 'app/constants';
import { BusinessPartnerApplication, BusinessPartnerApplicationState } from 'app/models/api-entities/business-partner-application';
import { Merchant } from 'app/models/api-entities/merchant';
import { AppRoutes } from 'app/models/routes';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { HeaderService } from 'app/services/header.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserProfile } from 'app/models/user-entities/user-profile';
import { NavToggleService } from 'app/services/nav-toggle.service';

@Component({
  selector: 'ztt-header',
  templateUrl: './header.component.html'
})

export class HeaderComponent implements OnInit, OnDestroy {
  isPartnerDashboardLinkVisible = false;
  isMyBusinessLinkVisible = false;
  mainLoader = LOADER.MAIN_LOADER;

  private _partnerDashboardLinkEnabled = false;
  private _showBecomeBusinessPartner = false;
  private _canBecomeBusinessPartner = false;

  private _partnerDashboardLinkSub$: Subscription;

  @HostListener('window:beforeunload', ['$event'])
  logOut(): void {
    if (this.isDelegatedAccessMode()) this.merchantService.logOutDelegated();
  }

  constructor(private businessPartnerService: BusinessPartnerService,
              private configurationService: ConfigurationService,
              private headerService: HeaderService,
              private merchantService: MerchantService,
              private navToggleService: NavToggleService,
              private translateService: TranslateService,
              private userSessionService: UserSessionService,
              private utilityService: UtilityService) {
  }

  ngOnInit(): void {
    this.isMyBusinessLinkVisible = this.userSessionService.isMyBusinessLinkVisible;
    this.partnerDashboardLinkSub$ = this.headerService.partnerDashboardLinkEnabled.subscribe((enable: boolean) => this.partnerDashboardLinkEnabled = enable);
    this.getBusinessPartnerApplication();
  }

  ngOnDestroy(): void {
    if (this.partnerDashboardLinkSub$ && !this.partnerDashboardLinkSub$.closed) {
      this.partnerDashboardLinkSub$.unsubscribe();
    }
  }

  isDelegatedAccessMode(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  get logoutUrlString(): string {
    return this.utilityService.localizeUrl(this.merchantService.logoutUrl, this.translateService.currentLang);
  }

  get accountInfoUrlString(): string {
    return this.utilityService.localizeUrl(this.merchantService.accountInfoUrl, this.translateService.currentLang);
  }

  private getBusinessPartnerApplication(): void {
    if (!this.configurationService.businessPartnerEnabled) return;

    this.businessPartnerService.getBusinessPartnerApplication()
      .pipe(take(1))
      .subscribe((businessPartnerApplication: BusinessPartnerApplication) => {
        this.isPartnerDashboardLinkVisible = businessPartnerApplication?.state === BusinessPartnerApplicationState.complete;
        this.showBecomeBusinessPartner = this.businessPartnerService.hasPendingApplication(businessPartnerApplication);
        this.canBecomeBusinessPartner = this.partnerSupportsBusinessPartnerRegistration();
      });
  }

  get showProfilePicker(): boolean {
    return this.userProfiles.length >= 1;
  }

  get userProfiles(): UserProfile[] {
    return this.userSessionService.userProfiles || [];
  }

  get partnerDashboardRouterLink(): string {
    return AppRoutes.partner_dashboard.root_link;
  }

  get partnerDashboardLinkEnabled(): boolean {
    return this._partnerDashboardLinkEnabled;
  }

  set partnerDashboardLinkEnabled(value: boolean) {
    this._partnerDashboardLinkEnabled = value;
  }

  get partnerDashboardLinkSub$(): Subscription {
    return this._partnerDashboardLinkSub$;
  }

  set partnerDashboardLinkSub$(value: Subscription) {
    this._partnerDashboardLinkSub$ = value;
  }

  get merchant(): Merchant {
    return this.merchantService.getMerchant();
  }

  get isBecomeAPartnerLinkVisible(): boolean {
    if (!this.configurationService.businessPartnerEnabled) return false;

    return this.canBecomeBusinessPartner && this.showBecomeBusinessPartner;
  }

  get isMarketingLinkVisible(): boolean {
    return this.configurationService.marketingEnabled && this.isPartnerDashboardLinkVisible;
  }

  get isPartnerDashboardLinkEnabled(): boolean {
    return this.partnerDashboardLinkEnabled;
  }

  get isDocumentsLinkVisible(): boolean {
    return this.userSessionService.hasMerchant;
  }

  get businessRouterLink(): string {
    return this.isRoutingToDashboard ? AppRoutes.dashboard.root_link : AppRoutes.onboarding.root_link;
  }

  get insightsRouterLink(): string {
    return AppRoutes.insights.root_link;
  }

  get marketingRouterLink(): string {
    return AppRoutes.marketing.root_link;
  }

  set showBecomeBusinessPartner(shouldShow: boolean) {
    this._showBecomeBusinessPartner = shouldShow;
  }

  get showBecomeBusinessPartner(): boolean {
    return this._showBecomeBusinessPartner;
  }

  set canBecomeBusinessPartner(allowed: boolean) {
    this._canBecomeBusinessPartner = allowed;
  }

  get canBecomeBusinessPartner(): boolean {
    return this._canBecomeBusinessPartner;
  }

  get partnerOnboardingRouterLink(): string {
    return AppRoutes.partner_onboarding.root_link;
  }

  get documentsRouterLink(): string {
    return AppRoutes.documents.root_link;
  }

  get hasCompletedApplicantAuthentication(): boolean {
    return this.merchantService.authenticationCheckComplete(this.userSessionService.applicantId);
  }

  get isInsightsVisible(): boolean {
    return this.hasCompletedApplicantAuthentication || this.userSessionService.isCfaCustomer;
  }

  toggleCollapse(): void {
    this.navToggleService.toggleCollapse();
  }

  get isCollapsed(): boolean {
    return this.navToggleService.isCollapsed;
  }

  switchProfile(profile_uid: string): string | null {
    return profile_uid?.includes('prof_') ? `/switch_account?profile_uid=${profile_uid}` : null
  }

  private get isRoutingToDashboard(): boolean {
    return this.hasCompletedApplicantAuthentication
           || (this.merchantService.isKycProfilePresent() && this.merchantService.isKycFailed());
  }

  private partnerSupportsBusinessPartnerRegistration(): boolean {
    if (this.merchant?.endorsing_partner_id) {
      return !this.configurationService.businessPartnerRegistrationBlacklist.split(',').includes(this.merchant.endorsing_partner_id);
    }
    return false;
  }
}
