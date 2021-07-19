import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HeaderComponent } from './header.component';
import { MerchantService } from 'app/services/merchant.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CookieService } from 'ngx-cookie-service';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { HeaderService } from 'app/services/header.service';
import { UserSessionService } from 'app/services/user-session.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { BehaviorSubject } from 'rxjs';
import { businessPartnerApplicationComplete, businessPartnerApplicationKycVerifying } from 'app/test-stubs/factories/business-partner';
import {
  merchantAddProfile,
  merchantNewProfile,
  merchantOnboardingProfile,
  userSessionFactory
} from 'app/test-stubs/factories/user-session';
import { UserProfile } from 'app/models/user-entities/user-profile';
import { UserSession } from 'app/models/user-entities/user-session';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { AppRoutes } from 'app/models/routes';

describe('HeaderComponent-UI', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  let businessPartnerService: BusinessPartnerService;
  let configService: ConfigurationService;
  let merchantService: MerchantService;
  let userSessionService: UserSessionService;

  let bpApplicationSpy: jasmine.Spy;
  let msIsKycFailedSpy: jasmine.Spy;
  let msIsKycProfilePresent: jasmine.Spy;

  const getElements = (query: string): Array<DebugElement['nativeElement']> => fixture.debugElement.queryAll(By.css(query)).map(a => a.nativeElement);
  const allAnchors = (): Array<DebugElement['nativeElement']> => fixture.debugElement.queryAll(By.css('a')).map(a => a.nativeElement);
  const visibleLinks = {
    myBusiness: (): Array<DebugElement['nativeElement']> => getElements('a[data-ng-id=dash-link]'),
    insights: (): Array<DebugElement['nativeElement']> => getElements('a#insights-link'),
    myPartner: (): Array<DebugElement['nativeElement']> => getElements('a[data-ng-id=partner-dashboard-link]'),
    becomePartner: (): Array<DebugElement['nativeElement']> => getElements('a[data-ng-id=become-partner-dashboard-link]'),
    marketing: (): Array<DebugElement['nativeElement']> => getElements('a#marketing-dashboard-link'),
    uploadDocuments: (): Array<DebugElement['nativeElement']> => getElements('a#documents-dropdown-item'),
    switchProfiles: (): Array<DebugElement['nativeElement']> => getElements('a[data-ng-id=profile-link]')
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HeaderComponent ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BusinessPartnerService,
        HeaderService,
        CookieService,
        LoggingService,
        MerchantService,
        TranslateService,
        UserSessionService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    businessPartnerService = TestBed.inject(BusinessPartnerService);
    configService = TestBed.inject(ConfigurationService);
    merchantService = TestBed.inject(MerchantService);
    userSessionService = TestBed.inject(UserSessionService);

    spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
    bpApplicationSpy = spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(new BehaviorSubject(businessPartnerApplicationComplete));
    msIsKycFailedSpy = spyOn(merchantService, 'isKycFailed').and.returnValue(false);
    msIsKycProfilePresent = spyOn(merchantService, 'isKycProfilePresent').and.returnValue(false);
  });

  describe('Switch Profiles Links', () => {
    let userSession: UserSession;

    let userSessionSpy: jasmine.Spy;
    let userProfilesSpy: jasmine.Spy;

    beforeEach(() => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);
    });

    describe('when conf_allow_multiple_businesses is enabled', () => {
      let merchantNew: UserProfile;

      beforeEach(() => {
        merchantNew = merchantNewProfile.build();
        userSession = userSessionFactory.build({
          partner: { conf_allow_multiple_businesses: true },
          merchant: merchantNew.properties.merchant,
          selected_profile: merchantNew
        });
      });

      describe('and the user has one or no profile(s)', () => {
        beforeEach(() => {
          userSessionSpy = spyOnProperty(userSessionService, 'userSession').and.returnValue(userSession);
          userProfilesSpy = spyOnProperty(userSessionService, 'userProfiles').and.returnValue(userSession.profiles);
        });

        it('has no profiles listed', () => {
          fixture.detectChanges();

          expect(visibleLinks.switchProfiles().length).toEqual(0);
        });
      });

      describe('and the user has multiple profiles', () => {
        let merchantAdd: UserProfile;
        let merchantOnboarding: UserProfile;

        beforeEach(() => {
          merchantAdd = merchantAddProfile.build();
          merchantOnboarding = merchantOnboardingProfile.build();
          userSession.profiles = [merchantAdd, merchantOnboarding];

          userSessionSpy = spyOnProperty(userSessionService, 'userSession').and.returnValue(userSession);
          userProfilesSpy = spyOnProperty(userSessionService, 'userProfiles').and.returnValue(userSession.profiles);
        });

        it('should have the correct number of profile links', () => {
          fixture.detectChanges();

          expect(visibleLinks.switchProfiles().length).toEqual(userSession.profiles.length);
        });

        it('should not have a link to the currently selected profile', () => {
          fixture.detectChanges();

          visibleLinks.switchProfiles().forEach((link) => {
            expect(link.href.endsWith(merchantNew.uid)).toBeFalse();
          });
        });

        it('should have the proper add profile link when a profile has a merchant_add role', () => {
          fixture.detectChanges();

          expect(visibleLinks.switchProfiles()[0].href.endsWith(merchantAdd.uid)).toBeTrue();
          expect(visibleLinks.switchProfiles()[0].innerText).toContain('NAV.ACCOUNT_ADD');
        });

        it('should not have the add new business link when a user is adding a brand new merchant', () => {
          userSession.merchant = null;
          userSession.profiles = [merchantNew, merchantOnboarding];
          userSession.selected_profile = merchantAdd;

          userSessionSpy.and.returnValue(userSession);
          userProfilesSpy.and.returnValue(userSession.profiles);

          fixture.detectChanges();

          visibleLinks.switchProfiles().forEach((link) => {
            expect(link.href.endsWith(merchantAdd.uid)).toBeFalse();
            expect(link.innerText).not.toEqual('NAV.ACCOUNT_ADD');
          });
        });

        it('should have the proper merchant link for an onboarding merchant_new', () => {
          fixture.detectChanges();

          expect(visibleLinks.switchProfiles()[1].href.endsWith(merchantOnboarding.uid)).toBeTrue();
          expect(visibleLinks.switchProfiles()[1].innerText).toEqual(merchantOnboarding.properties.merchant.name);
        });
      });
    });
  });

  describe('Anchor Tags with target="_blank"', () => {
    it('should have no unsafe attributes', () => {
      const isUnsafeAnchor = ((a: DebugElement['nativeElement']): boolean => {
        return !!a && a.target === '_blank' && a.rel !== 'noopener' && a.rel !== 'noreferrer';
      });
      const unsafeAnchors = allAnchors().filter(isUnsafeAnchor);

      expect(unsafeAnchors.length).toBe(0);
    });
  });

  describe('My Business Link"', () => {
    beforeEach(() => {
      spyOnProperty(userSessionService, 'isMyBusinessLinkVisible').and.returnValue(true);
    });

    afterEach(() => {
      expect(visibleLinks.myBusiness().length).toBe(1);
    });

    it('should have /onboarding as routerLink when authenticationCheckComplete is false', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);

      fixture.detectChanges();
      expect(visibleLinks.myBusiness()[0].routerLink.endsWith(AppRoutes.onboarding.root_link)).toBe(true);
    });

    it('should have /dashboard as routerLink when authenticationCheckComplete is true', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);

      fixture.detectChanges();
      expect(visibleLinks.myBusiness()[0].routerLink.endsWith(AppRoutes.dashboard.root_link)).toBe(true);
    });

    it('should have /onboarding as routerLink when merchant has incomplete KYC profile', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);
      msIsKycFailedSpy.and.returnValue(true);

      fixture.detectChanges();
      expect(visibleLinks.myBusiness()[0].routerLink.endsWith(AppRoutes.onboarding.root_link)).toBe(true);
    });

    it('should have /dashboard as routerLink when merchant has failed KYC', () => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(false);
      msIsKycFailedSpy.and.returnValue(true);
      msIsKycProfilePresent.and.returnValue(true);

      fixture.detectChanges();
      expect(visibleLinks.myBusiness()[0].routerLink.endsWith(AppRoutes.dashboard.root_link)).toBe(true);
    });
  });

  describe('My Partner Link"', () => {
    beforeEach(() => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);
    });

    it('should be visible when partnerDashboardLinkVisible is truthy', () => {
      fixture.detectChanges();
      expect(visibleLinks.myPartner().length).toBe(1);
    });

    it('should NOT be visible when partnerDashboardLinkVisible is falsy', () => {
      bpApplicationSpy.and.returnValue(new BehaviorSubject(businessPartnerApplicationKycVerifying));

      fixture.detectChanges();
      expect(visibleLinks.myPartner().length).toBe(0);
    });
  });

  describe('Marketing Link"', () => {
    beforeEach(() => {
      spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);
    });

    it('should be visible when enableMarketingLink is truthy', () => {
      spyOnProperty(configService, 'marketingEnabled').and.returnValue(true);

      fixture.detectChanges();
      expect(visibleLinks.marketing().length).toBe(1);
    });

    it('should NOT be visible when enableMarketingLink is falsy', () => {
      spyOnProperty(configService, 'marketingEnabled').and.returnValue(false);

      fixture.detectChanges();
      expect(visibleLinks.marketing().length).toBe(0);
    });
  });

  describe('My Documents Link"', () => {
    it('should be visible when enableUploadDocumentsLink is truthy', () => {
      spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(true);
      fixture.detectChanges();
      expect(visibleLinks.uploadDocuments().length).toBe(1);
    });

    it('should NOT be visible when enableUploadDocumentsLink is falsy', () => {
      spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(false);
      fixture.detectChanges();
      expect(visibleLinks.uploadDocuments().length).toBe(0);
    });
  });

  describe('Has not completed onboarding', () => {
    it('should not show any partner or insights links', () => {
      expect(visibleLinks.becomePartner().length).toBe(0);
      expect(visibleLinks.myPartner().length).toBe(0);
      expect(visibleLinks.insights().length).toBe(0);
      expect(visibleLinks.marketing().length).toBe(0);
    });
  });
});
