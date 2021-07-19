import { LoggingService } from 'app/services/logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ReviewLendingApplicationComponent } from './review-lending-application.component';
import { UiError } from 'app/models/ui-error';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { OfferType, RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { ErrorService } from 'app/services/error.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { SupplierService } from 'app/services/supplier.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantService } from 'app/services/merchant.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { UiAssetService } from 'app/services/ui-asset.service';
import {
  lendingApplicationApproved,
  lendingApplicationFactory
} from 'app/test-stubs/factories/lending-application';

import {
  offer,
  offerFactory,
} from 'app/test-stubs/factories/lending/offers';
import {
  lendingPayoutFactory,
  lendingPayoutCra,
  lendingPayoutLandlord
} from 'app/test-stubs/factories/lending-offline-payout';

import { CookieService } from 'ngx-cookie-service';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import Bugsnag from '@bugsnag/js';

describe('ReviewLendingApplicationComponent', () => {
  let component: ReviewLendingApplicationComponent;
  let fixture: ComponentFixture<ReviewLendingApplicationComponent>;
  let offersSubSpy: jasmine.Spy;
  let getLendingApplicationSpy: jasmine.Spy;
  let delegatedAccessSpy: jasmine.Spy;
  let stateRoutingService: StateRoutingService;
  let lendingApplicationsService: LendingApplicationsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        CollapseModule.forRoot(),
        BrowserAnimationsModule,
        RouterTestingModule
      ],
      declarations: [
        ReviewLendingApplicationComponent,
        ZttCurrencyPipe
      ],
      providers: [
        CookieService,
        UtilityService,
        SupplierService,
        LendingApplicationsService,
        ErrorService,
        MerchantService,
        OfferService,
        UiAssetService,
        BankingFlowService,
        LoggingService,
        StateRoutingService,
        { provide: ErrorService,
          useClass: class {
            show = jasmine.createSpy('show');
          }
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(inject(
    [ OfferService, MerchantService ],(offerService: OfferService,merchantService: MerchantService) => {
      fixture = TestBed.createComponent(ReviewLendingApplicationComponent);
      component = fixture.componentInstance;

      stateRoutingService = TestBed.inject(StateRoutingService);
      spyOn(stateRoutingService, 'navigate');
      const applicationSignatureRequired = lendingApplicationFactory.build({ terms_signature_required: true });

      // Set default entity subscriptions in component
      lendingApplicationsService = TestBed.inject(LendingApplicationsService);
      getLendingApplicationSpy = spyOnProperty(lendingApplicationsService, 'lendingApplication$')
        .and.returnValue(new BehaviorSubject<LendingApplication>(applicationSignatureRequired));


      offersSubSpy = spyOnProperty(offerService, 'offers$')
        .and.returnValue(new BehaviorSubject([ offer ]));
      spyOn(Bugsnag, 'notify');

      // Stub delegated access
      delegatedAccessSpy = spyOn(merchantService, 'isDelegatedAccessMode')
        .and.returnValue(false);
    }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    it('should set lending application', () => {
      fixture.detectChanges();

      expect(component.lendingApplication).toEqual(lendingApplicationApproved);
    });

    it('should initially set isCollapsed to true so that payouts are not listed', () => {
      fixture.detectChanges();

      expect(component.isCollapsed).toEqual(true);
    });

    it('should set correct lending offer based on id from application', () => {
      const offer1 = offerFactory.build({ id: 'lo_1' });
      const offer2 = offerFactory.build({ id: 'lo_2' });
      const offer3 = offerFactory.build({ id: 'lo_3' });
      const application = lendingApplicationFactory.build({ offer_id: offer1.id });

      getLendingApplicationSpy.and.returnValue(new BehaviorSubject(application));
      offersSubSpy.and.returnValue(new BehaviorSubject([ offer1, offer2, offer3 ]));

      fixture.detectChanges();

      expect(component.offer).toEqual(offer1);
    });

    it('should not set lending offer if passed application is null', () => {
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(null));

        fixture.detectChanges();

        expect(component.lendingApplication).toBeFalsy();
        expect(component.offer).toBeFalsy();
      });

    it('should eventually set loaded flag to true', () => {
      expect(component.loaded).toEqual(false);

      fixture.detectChanges();

      expect(component.loaded).toEqual(true);
    });

    describe('WCA offer flag', () => {
      it('should set the correct flag when offer is a WCA offer', () => {
        const offer = offerFactory.build({ application_prerequisites: { offer_type: OfferType.WorkingCapitalAdvance } });
        const application = lendingApplicationFactory.build({ offer_id: offer.id });
        offersSubSpy.and.returnValue(new BehaviorSubject([ offer ]));
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();
        expect(component.isWcaOffer).toEqual(true);
      });

      it('should set the correct flag when offer is a LOC offer', () => {
        const offer = offerFactory.build({ application_prerequisites: { offer_type: OfferType.LineOfCredit } });
        const application = lendingApplicationFactory.build({ offer_id: offer.id });
        offersSubSpy.and.returnValue(new BehaviorSubject([ offer ]));
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();
        expect(component.isWcaOffer).toEqual(false);
      });
    });

    describe('Payout attributes + flag', () => {
      it('should set hasPayouts to true and set payouts + totalPayouts from lending application when there are payouts', () => {
        const application = lendingApplicationFactory.build({ offline_payouts: [ lendingPayoutCra, lendingPayoutLandlord ] });
        const expectedTotalPayouts = lendingPayoutCra.amount + lendingPayoutLandlord.amount;
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.lendingApplication).toEqual(application);
        expect(component.payouts).toEqual(application.offline_payouts);
        expect(component.totalPayouts).toEqual(expectedTotalPayouts);
      });

      it('should set hasPayouts to false and set payouts to [] and totalPayouts to 0 when there are no payouts', () => {
        const application = lendingApplicationFactory.build({ offline_payouts: [] });
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.lendingApplication).toEqual(application);
        expect(component.payouts).toEqual([]);
        expect(component.totalPayouts).toEqual(0);
      });
    });

    describe('delegatedAccess flag', () => {
      it('should be set to false if not in delegated access', () => {
        delegatedAccessSpy.and.returnValue(false);

        fixture.detectChanges();

        expect(component.delegatedAccess).toEqual(false);
      });

      it('should be set to true if in delegated access', () => {
        delegatedAccessSpy.and.returnValue(true);

        fixture.detectChanges();

        expect(component.delegatedAccess).toBeTrue();
      });
    });

    describe('displayRequested flag', () => {
      it('should be set to true if offer is WCA offer and requested_amount is truthy', () => {
        const offer = offerFactory.build({ application_prerequisites: { offer_type: OfferType.WorkingCapitalAdvance } });
        const application = lendingApplicationFactory.build({ offer_id: offer.id, requested_amount: 10000 });
        offersSubSpy.and.returnValue(new BehaviorSubject([ offer ]));
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.displayRequested).toBeTrue();
      });

      it('should be set to false if offer is WCA offer and requested_amount is falsy', () => {
        const offer = offerFactory.build({ application_prerequisites: { offer_type: OfferType.WorkingCapitalAdvance } });
        const application = lendingApplicationFactory.build({ offer_id: offer.id, requested_amount: 0 });
        offersSubSpy.and.returnValue(new BehaviorSubject([ offer ]));
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.displayRequested).toBeFalse();
      });

      it('should be set to false if offer is not a WCA offer', () => {
        const offer = offerFactory.build({ application_prerequisites: { offer_type: OfferType.LineOfCredit } });
        const application = lendingApplicationFactory.build({ offer_id: offer.id });
        offersSubSpy.and.returnValue(new BehaviorSubject([ offer ]));
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.displayRequested).toBeFalse();
      });
    });

    describe('approvedLower flag', () => {
      it('should be set to true when approved amount is strictly lower than requested amount', () => {
        const application = lendingApplicationFactory.build({ max_principal_amount: 10000, requested_amount: 20000 });
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.approvedLower).toEqual(true);
      });

      it('should be set to false when approved amount is equal to requested amount', () => {
        const application = lendingApplicationFactory.build({ max_principal_amount: 10000, requested_amount: 10000 });
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.approvedLower).toEqual(false);
      });

      it('should be set to false when approved amount is strictly higher than requested amount', () => {
        const application = lendingApplicationFactory.build({ max_principal_amount: 30000, requested_amount: 20000 });
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));

        fixture.detectChanges();

        expect(component.approvedLower).toEqual(false);
      });
    });
  }); // describe - ngOnInit()

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  // SERVICE CALLS

  // ------------------------------------------------------------------- next()
  describe('next()', () => {
    it('should not emit next event + trigger delegated mode modal if in delegated access mode', inject(
      [ ErrorService ], (errorService: ErrorService) => {
        delegatedAccessSpy.and.returnValue(true);
        spyOn(component.nextEvent, 'emit');
        fixture.detectChanges();
        component.next();

        expect(component.nextEvent.emit).not.toHaveBeenCalled();
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
    }));

    it('should emit next event when user not in delegated access mode', () => {
          spyOn(component.nextEvent, 'emit');
          fixture.detectChanges();
          component.next();

          expect(component.nextEvent.emit).toHaveBeenCalledTimes(1);
    });
   }); // describe - next()

  // ------------------------------------------------------------------- modify()
  describe('modify()', () => {
    it('should navigate to select_lending_offer on modify()', () => {
      component.modify();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
    });
  }); // describe - modify()

  // -------------------------------------------------------------------------- cancel()
  describe('cancel()', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancelEvent, 'emit');

      component.cancel();

      expect(component.cancelEvent.emit).toHaveBeenCalledTimes(1);
    });
  }); // describe - cancel()

  // ---------------------------------------------------------------------------- getPayoutPayeeLabel()
  describe('getPayoutPayeeLabel()', () => {
    it('should return value returned by UiAssetService when payout value is defined', inject([UiAssetService], (uiAssetService: UiAssetService) => {
      const mockValue = 'mock';
      const mockPayout = lendingPayoutFactory.build();
      spyOn(uiAssetService, 'getPayoutPayeeLabel').and.returnValue(mockValue);
      expect(component.getPayoutLabel(mockPayout)).toEqual(mockValue);
    }));

    it('should return null when payout value is null or undefined', () => {
      expect(component.getPayoutLabel(null)).toBeNull();
    });
  }); // describe - getPayoutPayeeLabel()

  // --------------------------------------------------------------------- repaymentScheduleLocalizationKey()
  describe('repaymentScheduleLocalizationKey()', () => {

    describe('when there is a lending application', () => {
      it('should return appropriate translation key for each repayment schedule', () => {

        Object.values(RepaymentSchedule)
          .filter((repSched: RepaymentSchedule) => repSched !== RepaymentSchedule.none)
          .forEach((repSched: RepaymentSchedule) => {
          const app = lendingApplicationFactory.build({ repayment_schedule: repSched });
          component.lendingApplication = app;

          const localizationKey = component.repaymentScheduleLocalizationKey;

          switch (repSched) {
            case (RepaymentSchedule.daily): expect(localizationKey).toBe('PAY_REVIEW.DAILY'); break;
            case (RepaymentSchedule.weekly): expect(localizationKey).toBe('PAY_REVIEW.WEEKLY'); break;
            case (RepaymentSchedule.bi_weekly): expect(localizationKey).toBe('PAY_REVIEW.BI_WEEKLY'); break;
            case (RepaymentSchedule.monthly): expect(localizationKey).toBe('PAY_REVIEW.MONTHLY'); break;
            default: fail('Unexpected `repSched` value: ' + repSched);
          }
        });
      });
    }); // describe -when there is a lending application'

    describe('when there is no lending application', () => {
      it('should return an empty string', () => {
          const NO_APPS: LendingApplication[] = [ null, undefined ];

          NO_APPS.forEach((invalidApp: LendingApplication) => {
            component.lendingApplication = invalidApp;

            const localizationKey = component.repaymentScheduleLocalizationKey;
            expect(localizationKey).toEqual('');
          });
      });
    }); // describe - 'when there is no lending application'

  }); // describe - repaymentScheduleLocalizationKey()

  // ---------------------------------------------------------------------- payReviewFormulaLocalizationKey()
  describe('payReviewFormulaLocalizationKey()', () => {

    describe('when there is a lending application', () => {
      it('should return appropriate translation key for each repayment schedule', () => {

        Object.values(RepaymentSchedule)
          .filter((repSched: RepaymentSchedule) => repSched !== RepaymentSchedule.none)
          .forEach((repSched: RepaymentSchedule) => {
            const app = lendingApplicationFactory.build({ repayment_schedule: repSched });
            component.lendingApplication = app;

            const localizationKey = component.payReviewFormulaLocalizationKey;

            switch (repSched) {
              case (RepaymentSchedule.daily): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.DAILY'); break;
              case (RepaymentSchedule.weekly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.WEEKLY'); break;
              case (RepaymentSchedule.bi_weekly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.BI_WEEKLY'); break;
              case (RepaymentSchedule.monthly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.MONTHLY'); break;
              default: fail('Unexpected `repSched` value: ' + repSched);
            }
          }); // forEach
      });
    }); // describe -when there is a lending application'

    describe('when there is no lending application', () => {
      it('should return an empty string', () => {
          const NO_APPS: LendingApplication[] = [ null, undefined ];

          NO_APPS.forEach((invalidApp: LendingApplication) => {
            component.lendingApplication = invalidApp;

            const localizationKey = component.payReviewFormulaLocalizationKey;
            expect(localizationKey).toEqual('');
          });
      });
    }); // describe - 'when there is no lending application'
  }); // describe - payReviewFormulaLocalizationKey()


  // --------------------------------------------------------------------- localizedLoanTermUnit()
  describe('localizedLoanTermUnit()', () => {

    describe('when there is an application', () => {

      it('should return expected singular translation key', () => {
        Object.values(TermUnit).forEach(termUnit => {
          const app = lendingApplicationFactory.build({ term_unit: termUnit, term_duration: 1 });
          component.lendingApplication = app;
          const label = component.localizedLoanTermUnit;

          switch (termUnit) {
            case (TermUnit.one_time): expect(label).toBe('PAY_TERMS.LABEL_ONE_TIME'); break;
            case (TermUnit.days): expect(label).toBe('PAY_TERMS.LABEL_DAYS'); break;
            case (TermUnit.weeks): expect(label).toBe('PAY_TERMS.LABEL_WEEKS'); break;
            case (TermUnit.months): expect(label).toBe('PAY_TERMS.LABEL_MONTHS'); break;
            default: fail('Unexpected `termUnit` value: ' + termUnit);
          }
        });
      });

      it('should return expected plural translation key', () => {
        Object.values(TermUnit).forEach(termUnit => {
          const app = lendingApplicationFactory.build({ term_unit: termUnit, term_duration: 2 });
          component.lendingApplication = app;
          const label = component.localizedLoanTermUnit;

          switch (termUnit) {
            case (TermUnit.one_time): expect(label).toBe('PAY_TERMS.LABEL_ONE_TIME'); break;
            case (TermUnit.days): expect(label).toBe('PAY_TERMS.LABEL_DAYS'); break;
            case (TermUnit.weeks): expect(label).toBe('PAY_TERMS.LABEL_WEEKS'); break;
            case (TermUnit.months): expect(label).toBe('PAY_TERMS.LABEL_MONTHS'); break;
            default: fail('Unexpected `termUnit` value: ' + termUnit);
          }
        });

      }); // describe - 'when there is an application'
    }); // describe - 'when there is an application'


    describe('when there is no lending application', () => {
      it('should return appropriate label for each repayment schedule in english', () => {
          const NO_APPS: LendingApplication[] = [ null, undefined ];

          NO_APPS.forEach((invalidApp: LendingApplication) => {
            component.lendingApplication = invalidApp;

            const label = component.localizedLoanTermUnit;
            expect(label).toEqual('~');
          });
      });
    }); // describe - 'when there is no lending application'

  }); // describe - localizedLoanTermUnit()


}); // describe - ReviewLendingApplicationComponent
