import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OfferType } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { OfferApplyButtonComponent } from 'app/offer/offer-apply-button/offer-apply-button.component';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingStatus } from 'app/services/banking-flow.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { applicationSummaryFactory } from 'app/test-stubs/factories/application-summary';
import { loadOffer$, offers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { offer, offerFactory } from 'app/test-stubs/factories/lending/offers';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

describe('OfferApplyButtonComponent', () => {
  let component: OfferApplyButtonComponent;
  let fixture: ComponentFixture<OfferApplyButtonComponent>;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;
  let ublService: UblService;
  let stateRoutingService: StateRoutingService;

  let isOfferAvailableSpy: jasmine.Spy;
  let getOfferFundsAccessibleSpy: jasmine.Spy;

  /**
   * Configure: MerchantService
   */

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [OfferApplyButtonComponent],
      providers: [
        BankAccountService,
        TranslateService,
        OfferService,
        LoggingService,
        ConfigurationService,
        UblService,
        MerchantService,
        StateRoutingService,
        // --- inherited
        CookieService,
        UtilityService,
        ErrorService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferApplyButtonComponent);
    component = fixture.componentInstance;

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);
    ublService = TestBed.inject(UblService);
    stateRoutingService = TestBed.inject(StateRoutingService);

    // Set spies:
    spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
    isOfferAvailableSpy = spyOn(offerService, 'isOfferAvailable').and.returnValue(true);
    getOfferFundsAccessibleSpy = spyOn(offerService, 'getOfferFundsAccessible').and.returnValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('applyForOffer()', () => {
    beforeEach(() => {
      const bankingFlowService = TestBed.inject(BankingFlowService);
      spyOnProperty(bankingFlowService, 'status').and.returnValue(BankingStatus.bank_status_optimal);

      spyOn(offerService, 'setOffer').and.callThrough();
      spyOn(stateRoutingService, 'navigate');

      component.offerType = OfferType.LineOfCredit;
    });

    describe('requestedAmount', () => {
      it('should store the requested amount in offerService if set', () => {
        component.requestedAmount = 500;
        component.ngOnInit();
        component.applyForOffer();

        expect(offerService.requestedAmount).toEqual(component.requestedAmount);
      });

      it('should not store the requested amount in offerService if not set', () => {
        component.ngOnInit();
        component.applyForOffer();

        expect(component.requestedAmount).toBeUndefined();
        expect(offerService.requestedAmount).toBeUndefined();
      });
    }); // describe - requestedAmount

    it('should call setOffer() and navigate in service with local Offer', () => {
      component.ngOnInit();
      component.applyForOffer();

      expect(offerService.setOffer).toHaveBeenCalledWith(offer);
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.root);
    });

    it('should not call setOffer() or navigate in service if isOfferDisabled returns true', () => {
      component.ngOnInit();
      component.isOfferDisabled = true;
      component.applyForOffer();

      expect(offerService.setOffer).not.toHaveBeenCalled();
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });
  }); // describe - applyForOffer()

  describe('reasons', () => {
    it('should add reason when no offer is available', () => {
      isOfferAvailableSpy.and.returnValue(false);

      component.ngOnInit();

      expect(component.reasons.length).toBe(1);
    });

    it('should add reason when no funds are accessible and has no in-progress applications', () => {
      getOfferFundsAccessibleSpy.and.returnValue(false);
      component.ngOnInit();

      expect(component.reasons.length).toBe(1);
    });

    it('should add reason when user is on payment plan', () => {
      spyOnProperty(ublService, 'hasPaymentPlan$').and.returnValue(new BehaviorSubject(true));

      component.ngOnInit();

      expect(component.reasons.length).toBe(1);
    });

    it('should add reason when user has an in-progress application', () => {
      const appSummary = applicationSummaryFactory.build();
      const testOffer = offerFactory.build({applications_in_progress: [appSummary]});
      spyOnProperty(offerService, 'locOffer').and.returnValue(testOffer);

      component.ngOnInit();

      expect(component.reasons.length).toBe(1);
    });
  });

  describe('hasReasons', () => {
    it('should initially be set to false', () => {
      component.ngOnInit();
      expect(component.hasReasons).toBe(false);
    });
  });
});
