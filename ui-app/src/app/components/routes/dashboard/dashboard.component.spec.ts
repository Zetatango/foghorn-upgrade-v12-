import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { UiError } from 'app/models/ui-error';
import { AgreementService } from 'app/services/agreement.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { ErrorService } from 'app/services/error.service';
import { OfferService } from 'app/services/offer.service';
import { LoadingService } from 'app/services/loading.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { DIRECT_DEBIT_POST_KEY, SUPPLIER_INFORMATION_KEY } from 'app/constants';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import { offers$, loadOffers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { BankAccountService } from 'app/services/bank-account.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let bankAccountService: BankAccountService;
  let bankingFlowService: BankingFlowService;
  let errorService: ErrorService;
  let loadingService: LoadingService;
  let merchantService: MerchantService;
  let stateRoutingService: StateRoutingService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let loadOffersSpy: jasmine.Spy;
  let offersSpy: jasmine.Spy;

  let loadMerchantSpy: jasmine.Spy;
  let isBankFlowInProgressSpy: jasmine.Spy;

  function routeToDashboard(): void {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [
        DashboardComponent
      ],
      providers: [
        AgreementService,
        BankAccountService,
        BankingFlowService,
        CookieService,
        DirectPaymentService,
        ErrorService,
        OfferService,
        LoadingService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        UtilityService
      ]
    });
    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'navigate');
    spyOn(stateRoutingService, 'ignoreRootEvents').and.returnValue(of(null));

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    bankAccountService = TestBed.inject(BankAccountService);
    spyOn(bankAccountService, 'getBankingStatus').and.callThrough();

    bankingFlowService = TestBed.inject(BankingFlowService);
    isBankFlowInProgressSpy = spyOn(bankingFlowService, 'isBankFlowInProgress').and.returnValue(false);

    errorService = TestBed.inject(ErrorService);
    spyOn(errorService, 'show');

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    loadOffersSpy = spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
    offersSpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    loadingService = TestBed.inject(LoadingService);
    spyOn(loadingService, 'hideMainLoader');

    merchantService = TestBed.inject(MerchantService);
    loadMerchantSpy = spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
    spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('listenForRouteEvents()', () => {
    it('should listen to ignoreRootEvents from StateRoutingService', () => {
      expect(stateRoutingService.ignoreRootEvents).toHaveBeenCalledTimes(1);
    });
  });

  describe('startNavigation()', () => {
    it('should hideMainLoader', () => {
      routeToDashboard();

      expect(loadingService.hideMainLoader).toHaveBeenCalledTimes(1);
    });

    it('should clean offer and offer fee', () => {
      spyOn(offerService, 'clearCurrentOffer');
      spyOn(offerService, 'clearOfferFee');

      routeToDashboard();

      expect(offerService.clearCurrentOffer).toHaveBeenCalledTimes(1);
      expect(offerService.clearOfferFee).toHaveBeenCalledTimes(1);
    });

    it('should call loadOffers()', () => {
      routeToDashboard();

      expect(loadOffersSpy).toHaveBeenCalledTimes(1);
    });

    it('should display getOffers modal when loadOffers fails', () => {
      loadOffersSpy.and.returnValue(throwError(null));

      routeToDashboard();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOffers);
    });

    it('should clear active direct debit and supplier information', () => {
      localStorage.setItem(DIRECT_DEBIT_POST_KEY, 'dp_1234');
      localStorage.setItem(SUPPLIER_INFORMATION_KEY, 'dp_1234');

      routeToDashboard();

      expect(localStorage.getItem(DIRECT_DEBIT_POST_KEY)).toBeNull();
      expect(localStorage.getItem(SUPPLIER_INFORMATION_KEY)).toBeNull();
    });

    it('should reload the merchant banking status', () => {
      routeToDashboard();

      expect(bankingFlowService.skippable).toEqual(false);
      expect(bankAccountService.getBankingStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('When isBankFlowInProgress returns true', () => {
    it('should load SetUpBankComponent', () => {
      isBankFlowInProgressSpy.and.returnValue(true);

      routeToDashboard();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.set_up_bank, true);
    });
  });

  describe('When there are offers', () => {
    beforeEach(() => {
      loadMerchantSpy.and.returnValue(of(null));
      loadOffersSpy.and.returnValue(of(null));
      merchantService.setMerchant(merchantDataFactory.build());
    });

    it('should navigate to lending dashboard', () => {
      routeToDashboard();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.active_ubls, true);
    });
  });

  describe('When there are neither lending nor financing offers', () => {
    beforeEach(() => {
      offersSpy.and.returnValue(new BehaviorSubject([]));
      merchantService.setMerchant(merchantDataFactory.build());
    });

    it('should show an error modal', () => {
      routeToDashboard();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.routing);
    });
  });

  describe('Banking flow parameters', () => {
    describe('BankingFlowService events handling', () => {
      beforeEach(() => {
        component.ngOnInit();
      });

      it('should navigate to dashboard.root when cancel event is trigger', () => {
        bankingFlowService.triggerCancelEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });

      it('should clear Flinks cookies and navigate to dashboard.root when complete event is trigger', () => {
        bankingFlowService.triggerCompleteEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });

      it('should load SetUpBankComponent when start event is trigger', () => {
        bankingFlowService.triggerStartEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.set_up_bank, true);
      });
    });
  });

  describe('ngOnDestroy()', () => {
    it('should clearAttributes in BankingFlowService', () => {
      spyOn(bankingFlowService, 'clearAttributes');

      fixture.destroy();

      expect(bankingFlowService.clearAttributes).toHaveBeenCalledOnceWith();
    });
  });
}); // describe - DashboardComponent
