import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SmallBusinessGradeComponent } from 'app/components/containers/small-business-grade/small-business-grade.component';
import {
  SmallBusinessGrade,
  VALID_TOOLTIPS,
  VALID_GRADES,
  NO_SCORE_ASSET_PATH,
  CERT_GRADE_ASSET_PATH
} from 'app/models/api-entities/offer';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { offer } from 'app/test-stubs/factories/lending/offers';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';
import { SupportedLanguage } from 'app/models/languages';
import { offers$, noOffers$ } from 'app/test-stubs/factories/lending/offer-stubs';

describe('SmallBusinessGradeComponent', () => {
  let component: SmallBusinessGradeComponent;
  let fixture: ComponentFixture<SmallBusinessGradeComponent>;

  let merchantService: MerchantService;
  let translateService: TranslateService;
  let userSessionService: UserSessionService;
  let offerService: OfferService;

  let msIsAuthFailedSpy: jasmine.Spy;
  let tsCurrentLangSpy: jasmine.Spy;
  let offersSpy: jasmine.Spy;

  const applicantId = 'a_123';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot()
      ],
      declarations: [ SmallBusinessGradeComponent ],
      providers: [
        CookieService,
        OfferService,
        LoggingService,
        MerchantService,
        UserSessionService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmallBusinessGradeComponent);
    component = fixture.componentInstance;

    merchantService = TestBed.inject(MerchantService);
    translateService = TestBed.inject(TranslateService);
    userSessionService = TestBed.inject(UserSessionService);
    msIsAuthFailedSpy = spyOn(merchantService, 'isAuthenticationFailed').and.returnValue(false);
    tsCurrentLangSpy = spyOnProperty(translateService, 'currentLang', 'get').and.returnValue('en');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    let locOfferSpy: jasmine.Spy;

    beforeEach(() => {
      offerService = TestBed.inject(OfferService);
      offersSpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
      locOfferSpy = spyOnProperty(offerService, 'locOffer').and.returnValue(offer);
    });

    describe('@private initOffersSubscription()', () => {
      it('should setup using @private updateSmallBusinessGrade()', () => {
        spyOn(offerService, 'offersExist').and.returnValue(true);

        component.ngOnInit();

        expect(offerService.offersExist).toHaveBeenCalledOnceWith();
      });

      it('should call renderBusinessGradeImage() and set isLoadingGrade to false', () => {
        component.ngOnInit();

        expect(component.grade).toBe(offer.small_business_grade);
        expect(component.isLoadingGrade).toBeFalse();
      });

      it('should render no-grade image if no offers were retrieved', () => {
        offersSpy.and.returnValue(noOffers$);

        component.ngOnInit();

        expect(component.cert_grade_image_src).toEqual(NO_SCORE_ASSET_PATH(translateService.currentLang));
      });

      it('should render no-grade image if no offers were retrieved', () => {
        offersSpy.and.returnValue(noOffers$);

        const selectedLang = SupportedLanguage.fr;
        tsCurrentLangSpy.and.returnValue(selectedLang);

        component.ngOnInit();

        expect(component.cert_grade_image_src).toEqual(NO_SCORE_ASSET_PATH(selectedLang));
      });

      it('should render no-grade image if no LoC offer was retrieved', () => {
        locOfferSpy.and.returnValue(undefined);

        component.ngOnInit();

        expect(component.cert_grade_image_src).toEqual(NO_SCORE_ASSET_PATH(translateService.currentLang));
      });
    }); // describe - initOffersSubscription()

    it('should set grade if passed in as @Input', () => {
      component.grade = VALID_GRADES[0];
      component.ngOnInit();

      expect(component.grade).toBe(VALID_GRADES[0]);
      expect(component.cert_grade_image_src).toBeTruthy();
      expect(component.isLoadingGrade).toBeFalse();
    });
  }); // describe - ngOnInit()

  describe('ngOnDestroy()', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()

  // ------------------------------------------------------------------- renderBusinessGradeImage()
  describe('renderBusinessGradeImage()', () => {
    beforeEach(() => {
      msIsAuthFailedSpy.and.returnValue(false);
    });

    it('should set small business grade asset path properly depending on the grade', () => {
      VALID_GRADES.forEach((grade) => {
        component.grade = grade;
        fixture.detectChanges();
        expect(component.cert_grade_image_src).toEqual(CERT_GRADE_ASSET_PATH(component.grade, translateService.currentLang));
      });
    });

    it('should set locales business grade images if french is selected', () => {
      tsCurrentLangSpy.and.returnValue('fr');

      VALID_GRADES.forEach((grade) => {
        component.grade = grade;
        fixture.detectChanges();
        expect(component.cert_grade_image_src).toEqual(CERT_GRADE_ASSET_PATH(component.grade, translateService.currentLang));
      });
    });
  }); // describe - renderBusinessGradeImage()

  // ------------------------------------------------------------------- Tooltip Content
  describe('Tooltip content', () => {
    beforeEach(() => {
      msIsAuthFailedSpy.and.returnValue(false);
    });

    it('should set tooltip local depending on grade - english', () => {
      msIsAuthFailedSpy.and.returnValue(false);

      VALID_GRADES.forEach((grade, index) => {
        component.grade = grade;
        fixture.detectChanges();
        expect(component.tooltipTitle).toEqual(VALID_TOOLTIPS[index].title);
        expect(component.tooltipBody).toEqual(VALID_TOOLTIPS[index].body);
      });
    });

    it('should set tooltip local depending on grade - french', () => {
      tsCurrentLangSpy.and.returnValue('fr');

      VALID_GRADES.forEach((grade) => {
        component.grade = grade;
        const tooltip = { title: `SMALL_BUSINESS_GRADE.TOOLTIP_TITLE_${component.grade}`, body: `SMALL_BUSINESS_GRADE.TOOLTIP_BODY_${component.grade}` };

        fixture.detectChanges();
        expect(component.tooltipTitle).toEqual(tooltip.title);
        expect(component.tooltipBody).toEqual(tooltip.body);
      });
    });

    it('should set tooltip with information verification trouble, for any grade', () => {
      VALID_GRADES.forEach((grade) => {
        component.grade = grade;
        const tooltip = { title: `SMALL_BUSINESS_GRADE.TOOLTIP_TITLE_${component.grade}`, body: `SMALL_BUSINESS_GRADE.TOOLTIP_BODY_${component.grade}` };

        fixture.detectChanges();
        expect(component.tooltipTitle).toEqual(tooltip.title);
        expect(component.tooltipBody).toEqual(tooltip.body);
      });
    });

    it('should set tooltip with information verification trouble if there is no grade', () => {
      const noGradeValues = [undefined, null];

      noGradeValues.forEach((grade) => {
        component.grade = grade;
        const tooltip = { title: `SMALL_BUSINESS_GRADE.TOOLTIP_TITLE_${component.grade}`, body: `SMALL_BUSINESS_GRADE.TOOLTIP_BODY_${component.grade}` };

        fixture.detectChanges();
        expect(component.tooltipTitle).toEqual(tooltip.title);
        expect(component.tooltipBody).toEqual(tooltip.body);
      });
    });
  }); // describe - Tooltip Content

  // ------------------------------------------------------------------------ isLoadingGrade
  describe('isLoadingGrade', () => {
    it('should initially be true', () => {
      expect(component.isLoadingGrade).toBeTrue();
    });
  }); // describe - isLoadingGrade

  // ------------------------------------------------------------------------ eidFailedOrNoGrade()
  describe('eidFailedOrNoGrade()', () => {
    it('should return true if no grade', () => {
      expect(component.eidFailedOrNoGrade(SmallBusinessGrade.none)).toBeTrue();
    });

    it('should return true if eid failed', () => {
      msIsAuthFailedSpy.and.returnValue(true);
      VALID_GRADES.forEach((grade) => {
        expect(component.eidFailedOrNoGrade(grade)).toBeTrue();
      });
    });

    it('should return false if eid passed and grade different than "-"', () => {
      msIsAuthFailedSpy.and.returnValue(false);
      const goodGrades = VALID_GRADES.filter(item => item !== SmallBusinessGrade.none);
      goodGrades.forEach((grade) => {
        expect(component.eidFailedOrNoGrade(grade)).toBeFalse();
      });
    });

    it('should return true if eid failed and no grade', () => {
      expect(component.eidFailedOrNoGrade(SmallBusinessGrade.none)).toBeTrue();
    });

    it('should call merchantService with userSessionService applicant', () => {
      msIsAuthFailedSpy.and.returnValue(false);
      spyOnProperty(userSessionService, 'applicantId').and.returnValue(applicantId);
      fixture.detectChanges();

      const goodGrades = VALID_GRADES.filter(item => item !== SmallBusinessGrade.none);
      goodGrades.forEach((grade) => {
        expect(component.eidFailedOrNoGrade(grade)).toBeFalse();
        expect(merchantService.isAuthenticationFailed).toHaveBeenCalledWith(applicantId);
      });
    });

  }); // describe - eidFailedOrNoGrade()

  // ---------------------------------------------------------------------------- get grade()
  describe('grade()', () => {
    it('should get applicantId from userSessionService', () => {
      component.grade = SmallBusinessGrade.A;
      expect(component.grade).toEqual(SmallBusinessGrade.A);
    });
  }); // describe - get grade()

  // ---------------------------------------------------------------------------- toGrade()
  describe('toGrade()', () => {
    it('should return proper SmallBusinessGrade when proper value is passed in', () => {
      const acceptedValues = Object.keys(SmallBusinessGrade);

      acceptedValues.forEach((value: string) => {
        expect(component.toGrade(value)).toBe(SmallBusinessGrade[value]);
      });
    });

    it('should return SmallBusinessGrade.none when bad value is passed in', () => {
      expect(component.toGrade('')).toBe(SmallBusinessGrade.none);
    });
  }); // describe - toGrade()

  // ---------------------------------------------------------------------------- isMyBusinessGrade
  describe('isMyBusinessGrade', () => {
    it('should return isMyBusinessGrade as true if initOffersSubscription() is called', () => {
      expect(component.isMyBusinessGrade).toEqual(false);
      fixture.detectChanges();
      expect(component.isMyBusinessGrade).toEqual(true);
    });

    it('should return isMyBusinessGrade as false if only a grade is set', () => {
      expect(component.isMyBusinessGrade).toEqual(false);
      component.grade = SmallBusinessGrade.A;
      expect(component.isMyBusinessGrade).toEqual(false);
    });
  }); // describe - isMyBusinessGrade
});
