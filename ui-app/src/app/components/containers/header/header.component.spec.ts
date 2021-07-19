import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessPartnerApplicationState } from 'app/models/api-entities/business-partner-application';
import { ApplicationConfiguration } from 'app/models/application-configuration';
import { SupportedLanguage } from 'app/models/languages';
import { AppRoutes } from 'app/models/routes';
import { UserProfile } from 'app/models/user-entities/user-profile';
import { UserSession } from 'app/models/user-entities/user-session';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { HeaderService } from 'app/services/header.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { NavToggleService } from 'app/services/nav-toggle.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { applicationConfigurationFactory } from 'app/test-stubs/factories/application-configuration';
import { businessPartnerApplicationFactory } from 'app/test-stubs/factories/business-partner';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import {
  merchantAddProfile,
  merchantNewProfile,
  merchantOnboardingProfile,
  userProfileFactory,
  userSessionFactory
} from 'app/test-stubs/factories/user-session';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  let businessPartnerService: BusinessPartnerService;
  let configurationService: ConfigurationService;
  let merchantService: MerchantService;
  let navToggleService: NavToggleService;
  let translateService: TranslateService;
  let userSessionService: UserSessionService;
  let utilityService: UtilityService;

  let bpsGetBusinessPartnerApplicationSpy: jasmine.Spy;
  let msMerchantSpy: jasmine.Spy;

  let applicationConfiguration: ApplicationConfiguration;


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      declarations: [HeaderComponent],
      providers: [
        BusinessPartnerService,
        CookieService,
        MerchantService,
        HeaderService,
        LoggingService,
        NavToggleService,
        ConfigurationService,
        UserSessionService,
        UtilityService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;

    businessPartnerService = TestBed.inject(BusinessPartnerService);
    configurationService = TestBed.inject(ConfigurationService);
    merchantService = TestBed.inject(MerchantService);
    navToggleService = TestBed.inject(NavToggleService);
    translateService = TestBed.inject(TranslateService);
    userSessionService = TestBed.inject(UserSessionService);
    utilityService = TestBed.inject(UtilityService);
    msMerchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

    bpsGetBusinessPartnerApplicationSpy = spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(new BehaviorSubject(null));

    applicationConfiguration = applicationConfigurationFactory.build();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ------------------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    it('should subscribe to dashboard link visibility', () => {
      const completeApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.complete });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(completeApplication));
      spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(applicationConfiguration.business_partner_id_blacklist);
      component.ngOnInit();

      expect(component.partnerDashboardLinkSub$.closed).toBe(false);
    });

    it('should show business partner dashboard link if application is complete', () => {
      const completeApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.complete });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(completeApplication));
      component.ngOnInit();

      expect(component.isPartnerDashboardLinkVisible).toBe(true);
    });

    it('should not show business partner dashboard link if application is not complete', () => {
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationFactory.build()));
      component.ngOnInit();

      expect(component.isPartnerDashboardLinkVisible).toBe(false);
    });


    describe('Become a business partner link', () => {
      it('should be shown if business partner application state is pending', () => {
        bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationFactory.build()));
        spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(applicationConfiguration.business_partner_id_blacklist);
        component.ngOnInit();

        expect(component.showBecomeBusinessPartner).toBeTrue();
      });

      it('should not be shown if business partner application state is not pending', () => {
        const verifyingApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.kyc_verifying });
        bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(verifyingApplication));
        spyOn(businessPartnerService, 'hasActiveApplication').and.returnValue(true);
        spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(applicationConfiguration.business_partner_id_blacklist);

        component.ngOnInit();
        expect(component.showBecomeBusinessPartner).toBeFalse();
      });
    });

    it('should be allowed to sign up as a business partner if partner ID is not blacklisted', () => {
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationFactory.build()));
      spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(applicationConfiguration.business_partner_id_blacklist);

      component.ngOnInit();

      expect(component.canBecomeBusinessPartner).toBeTrue();
    });

    it('should not be allowed to sign up as a business partner if partner ID is blacklisted', () => {
      const blacklistConfiguration = applicationConfigurationFactory.build({ business_partner_id_blacklist: merchantDataFactory.build().endorsing_partner_id });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationFactory.build()));
      spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(blacklistConfiguration.business_partner_id_blacklist);

      component.ngOnInit();

      expect(component.canBecomeBusinessPartner).toBeFalse();
    });

    it('should not be allowed to sign up as a business partner if partner ID is blacklisted amongst others', () => {
      const blacklistConfiguration = applicationConfigurationFactory.build({ business_partner_id_blacklist: merchantDataFactory.build().endorsing_partner_id });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationFactory.build()));
      spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(blacklistConfiguration.business_partner_id_blacklist + ',p_987654321,p_zyxwuvt');

      component.ngOnInit();

      expect(component.canBecomeBusinessPartner).toBeFalse();
    });

    it('should not be allowed to sign up as a business partner if merchant is falsy', () => {
      msMerchantSpy.and.returnValue(null);
      component.ngOnInit();

      expect(component.canBecomeBusinessPartner).toBeFalse();
    });
  }); // describe - ngOnInit()

  // ---------------------------------------------------------------------------- ngOnDestroy()
  describe('ngOnDestroy()', () => {
    beforeEach(() => {
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationFactory.build()));
    });

    it('should unsubscribe from link subscriptions', () => {
      component.ngOnInit();
      expect(component.partnerDashboardLinkSub$.closed).toBe(false);

      component.ngOnDestroy();
      expect(component.partnerDashboardLinkSub$.closed).toBe(true);
    });
  }); // describe - ngOnDestroy()

  describe('isCollapsed', () => {
    beforeEach(() => {
      spyOn(component, 'toggleCollapse').and.callThrough();
      spyOnProperty(component, 'isCollapsed').and.callThrough();
      spyOn(navToggleService, 'toggleCollapse').and.callThrough();
    });

    it('should retrieve the correct isCollapse value from the service', () => {
      expect(component.isCollapsed).toBeTrue();
      expect(navToggleService.isCollapsed).toBeTrue();
    });

    it('should set the correct isCollapse value in the service', () => {
      component.toggleCollapse();

      expect(component.isCollapsed).toBeFalse();
      expect(navToggleService.toggleCollapse).toHaveBeenCalledTimes(1);
      expect(navToggleService.isCollapsed).toBeFalse();
    });
  });

  describe('logOut', () => {
    it('should call logOutDelegated if in delegated access mode', () => {
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(true);
      spyOn(merchantService, 'logOutDelegated');

      component.logOut();

      expect(merchantService.logOutDelegated).toHaveBeenCalledTimes(1);
    });

    it('should not call logOutDelegated if not in delegated access mode', () => {
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
      spyOn(merchantService, 'logOutDelegated');

      component.logOut();

      expect(merchantService.logOutDelegated).not.toHaveBeenCalled();
    });
  });

  describe('logoutUrl', () => {
    it('Should call localizeUrl with logoutUrl and the current language', () => {
      spyOnProperty(translateService, 'currentLang', 'get').and.returnValue(SupportedLanguage.fr);
      spyOn(utilityService, 'localizeUrl');

      expect(component.logoutUrlString).toBeUndefined();
      expect(utilityService.localizeUrl).toHaveBeenCalledOnceWith(merchantService.logoutUrl, SupportedLanguage.fr);
    });
  });

  describe('accountInfoUrl', () => {
    it('Should call localizeUrl with accountInfoUrl and the current language', () => {
      spyOnProperty(translateService, 'currentLang', 'get').and.returnValue(SupportedLanguage.en);
      spyOn(utilityService, 'localizeUrl');

      expect(component.accountInfoUrlString).toBeUndefined();
      expect(utilityService.localizeUrl).toHaveBeenCalledOnceWith(merchantService.accountInfoUrl, SupportedLanguage.en);
    });
  });

  describe('merchant', () => {
    it('should return what is set', () => {
      expect(component.merchant).toEqual(merchantDataFactory.build());

      msMerchantSpy.and.returnValue(null);
      expect(component.merchant).toBeNull();
    });
  });

  describe('isMarketingLinkVisible', () => {
    beforeEach(() => {
      component.isPartnerDashboardLinkVisible = false;
    });

    it('should return true when config is enabled and business partner application is complete', () => {
      const completeApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.complete });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(completeApplication));
      spyOnProperty(configurationService, 'marketingEnabled').and.returnValue(true);
      component.ngOnInit();

      expect(component.isMarketingLinkVisible).toBe(true);
    });

    it('should return false when config is disabled', () => {
      spyOnProperty(configurationService, 'marketingEnabled').and.returnValue(false);
      expect(component.isMarketingLinkVisible).toBe(false);
    });

    it('should return false when business partner application is not complete', () => {
      const pendingApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.pending });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(pendingApplication));
      spyOnProperty(configurationService, 'marketingEnabled').and.returnValue(true);
      component.ngOnInit();

      expect(component.isMarketingLinkVisible).toBe(false);
    });
  });

  describe('isPartnerDashboardLinkVisible', () => {
    it('should return true when business partner application is complete', () => {
      const completeApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.complete });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(completeApplication));
      component.ngOnInit();

      expect(component.isPartnerDashboardLinkVisible).toBeTrue();
    });

    it('should return false when business partner application is not complete', () => {
      const pendingApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.pending });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(pendingApplication));
      component.ngOnInit();

      expect(component.isPartnerDashboardLinkVisible).toBeFalse();
    });

    it('should return false when business partner application is falsy', () => {
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(null));
      component.ngOnInit();

      expect(component.isPartnerDashboardLinkVisible).toBeFalse();
    });
  });

  describe('isMyBusinessLinkVisible', () => {
    it('should return false initially', () => {
      expect(component.isMyBusinessLinkVisible).toBeFalse();
    });

    it('should return true when UserSessionService returns true', () => {
      spyOnProperty(userSessionService, 'isMyBusinessLinkVisible').and.returnValue(true);
      component.ngOnInit();
      expect(component.isMyBusinessLinkVisible).toBeTrue();
    });

    it('should return false when UserSessionService returns false', () => {
      spyOnProperty(userSessionService, 'isMyBusinessLinkVisible').and.returnValue(false);
      component.ngOnInit();
      expect(component.isMyBusinessLinkVisible).toBeFalse();
    });
  });

  describe('showProfilePicker', () => {
    let userSession: UserSession;
    let merchantNew: UserProfile;

    beforeEach(() => {
      merchantNew = merchantNewProfile.build();
      userSession = userSessionFactory.build({
        merchant: merchantNew.properties.merchant,
        selected_profile: merchantNew
      });
    });

    it('does not show the picker, when no profiles are present', () => {
      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSession);
      spyOnProperty(userSessionService, 'userProfiles').and.returnValue(userSession.profiles);

      expect(component.userProfiles.length).toEqual(0);
      expect(component.showProfilePicker).toBeFalse();
    });

    it('does show the picker, when profiles are present', () => {
      const merchantAdd: UserProfile = merchantAddProfile.build();
      const merchantOnboarding: UserProfile = merchantOnboardingProfile.build();
      userSession.profiles = [merchantAdd, merchantOnboarding];

      spyOnProperty(userSessionService, 'userSession').and.returnValue(userSession);
      spyOnProperty(userSessionService, 'userProfiles').and.returnValue(userSession.profiles);

      expect(component.userProfiles.length).toEqual(2);
      expect(component.showProfilePicker).toBeTrue();
    });
  });

  describe('userProfiles', () => {
    let userSessionProfilesSpy: jasmine.Spy;

    beforeEach(() => {
      userSessionProfilesSpy = spyOnProperty(userSessionService, 'userProfiles');
    });

    it('should return the profiles on a user', () => {
      const profiles = userProfileFactory.buildList(2);
      userSessionProfilesSpy.and.returnValue(profiles);

      expect(component.userProfiles).toEqual(profiles);
    });
  });

  describe('switchProfile', () => {
    it('should return the correct URL with a valid profile_uid', () => {
      const profile_uid = userProfileFactory.build().uid;
      const switch_account_url = `/switch_account?profile_uid=${profile_uid}`;

      expect(component.switchProfile(profile_uid)).toEqual(switch_account_url);
    });

    it('should return null when not using a valid profile_uid', () => {
      let profile_uid = '';

      expect(component.switchProfile(profile_uid)).toBeNull();

      profile_uid = 'some_invalid_string';

      expect(component.switchProfile(profile_uid)).toBeNull();

      profile_uid = null;

      expect(component.switchProfile(profile_uid)).toBeNull();
    });
  });

  describe('enablePartnerDashboardLink', () => {
    beforeEach(() => {
      component.partnerDashboardLinkEnabled = false;
    });

    it('should return what it is set to', () => {
      expect(component.isPartnerDashboardLinkEnabled).toBe(false);
      component.partnerDashboardLinkEnabled = true;
      expect(component.isPartnerDashboardLinkEnabled).toBe(true);
    });
  });

  describe('enableUploadDocumentsLink', () => {
    it('should return true when userSessionService hasMerchant is truthy', () => {
      spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(true);
      expect(component.isDocumentsLinkVisible).toBe(true);
    });

    it('should return false when userSessionService hasMerchant is falsy', () => {
      spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(false);
      expect(component.isDocumentsLinkVisible).toBe(false);
    });
  });

  describe('businessRouterLink', () => {
    it('should return "/onboarding" when authenticationCheckComplete returns false and KYC has not failed', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);
      spyOn(merchantService, 'isKycFailed').and.returnValue(false);
      expect(component.businessRouterLink).toBe(AppRoutes.onboarding.root_link);
    });

    it('should return "/dashboard" when authenticationCheckComplete returns true and KYC has not failed', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);
      spyOn(merchantService, 'isKycFailed').and.returnValue(false);
      expect(component.businessRouterLink).toBe(AppRoutes.dashboard.root_link);
    });

    it('should return "/dashboard" when merchant has failed KYC', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);
      spyOn(merchantService, 'isKycFailed').and.returnValue(true);
      expect(component.businessRouterLink).toBe(AppRoutes.dashboard.root_link);
    });
  });

  describe('Router Links', () => {
    describe('insightsRouterLink', () => {
      it('should return "/insights"', () => {
        expect(component.insightsRouterLink).toBe(AppRoutes.insights.root_link);
      });
    });

    describe('marketingLink', () => {
      it('should return "/marketing"', () => {
        expect(component.marketingRouterLink).toBe(AppRoutes.marketing.root_link);
      });
    });

    describe('partnerDashboardLink', () => {
      it('should return "/partner_dashboard"', () => {
        expect(component.partnerDashboardRouterLink).toBe(AppRoutes.partner_dashboard.root_link);
      });
    });

    describe('partnerOnboardingRouterLink', () => {
      it('should return "/partner_onboarding"', () => {
        expect(component.partnerOnboardingRouterLink).toBe(AppRoutes.partner_onboarding.root_link);
      });
    });

    describe('uploadRouterLink', () => {
      it('should return "/documents"', () => {
        expect(component.documentsRouterLink).toBe(AppRoutes.documents.root_link);
      });
    });
  });

  describe('isBecomeAPartnerLinkVisible', () => {
    it('should be true when businessPartnerService.hasPendingApplication returns true + not blacklisted', () => {
      const pendingApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.pending });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(pendingApplication));

      component.ngOnInit();

      expect(component.isBecomeAPartnerLinkVisible).toBeTrue();
    });

    it('should be false when disabled by feature flag', () => {
      const pendingApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.pending });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(pendingApplication));
      spyOnProperty(configurationService, 'businessPartnerEnabled').and.returnValue(false);
      component.ngOnInit();

      expect(component.isBecomeAPartnerLinkVisible).toBeFalse();
    });

    it('should be false when businessPartnerService.hasPendingApplication returns false', () => {
      const completeApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.complete });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(completeApplication));
      component.ngOnInit();

      expect(component.isBecomeAPartnerLinkVisible).toBeFalse();
    });

    it('should be false when endorsing partner is blacklisted', () => {
      const endorsingPartnerId = merchantDataFactory.build().endorsing_partner_id;
      const pendingApplication = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.pending });
      bpsGetBusinessPartnerApplicationSpy.and.returnValue(new BehaviorSubject(pendingApplication));
      spyOnProperty(configurationService, 'businessPartnerRegistrationBlacklist').and.returnValue(endorsingPartnerId);
      component.ngOnInit();

      expect(component.isBecomeAPartnerLinkVisible).toBeFalse();
    });
  });

  describe('isInsightsVisible', () =>{
    it('should be false when applicant authentication is incomplete and is not a CFA customer', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);
      spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(false);

      expect(component.isInsightsVisible).toBeFalse();
    });

    it('should be true when completed applicant authentication', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);
      spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(false);

      expect(component.isInsightsVisible).toBeTrue();
    });

    it('should be true when user is CFA customer', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);
      spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(true);

      expect(component.isInsightsVisible).toBeTrue();
    });
  });
});
