import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

// Modules
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Entities
import { ApplicationState, OfferType } from 'app/models/api-entities/utility';
import { OfferWcaComponent } from 'app/offer/offer-wca/offer-wca.component';
import { BankAccountService } from 'app/services/bank-account.service';
// --- inherited
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';

// Services
import { OfferService } from 'app/services/offer.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { applicationSummaryFactory } from 'app/test-stubs/factories/application-summary';
import { loadOffer$, offers$ } from 'app/test-stubs/factories/lending/offer-stubs';

// Helpers
import { offerWca, offerWcaFactory } from 'app/test-stubs/factories/lending/offers';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';

describe('OfferWcaComponent', () => {
  let component: OfferWcaComponent;
  let fixture: ComponentFixture<OfferWcaComponent>;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot()
      ],
      declarations: [OfferWcaComponent],
      providers: [
        BankAccountService,
        TranslateService,
        OfferService,
        LoggingService,
        ConfigurationService,
        UblService,
        MerchantService,
        // --- inherited
        CookieService,
        UtilityService,
        ErrorService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferWcaComponent);
    component = fixture.componentInstance;

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have OfferType defined as WCA', () => {
    expect(component.offerType).toEqual(OfferType.WorkingCapitalAdvance);
  });

  it('should not have offerState defined upon creation', () => {
    expect(component.offerApplicationState).toBeUndefined();
  });

  describe('updateOffer()', () => {
    it('should set the local Offer to WCA', () => {
      const locOfferSpy = spyOnProperty(offerService, 'locOffer');
      spyOn(offerService, 'checkOfferTypeValid').and.callThrough();
      spyOn(offerService, 'checkOfferValid');

      component.ngOnInit();

      expect(offerService.checkOfferTypeValid).toHaveBeenCalledWith(OfferType.WorkingCapitalAdvance);
      expect(locOfferSpy).not.toHaveBeenCalled();
      expect(offerService.checkOfferValid).toHaveBeenCalledOnceWith(offerWca);
    });

    it('should update offerState', () => {
      const appSummary = applicationSummaryFactory.build({state: ApplicationState.approved});
      const testOffer = offerWcaFactory.build({applications_in_progress: [appSummary]});
      spyOnProperty(offerService, 'wcaOffer').and.returnValue(testOffer);

      component.ngOnInit();

      expect(component.offerApplicationState).toEqual('APPROVED');
    });
  }); // describe - updateOffer()

  describe('setOfferMetrics()', () => {
    it('should call getOfferWCAAvailableAmount for offerAvailableAmount', () => {
      spyOn(offerService, 'getOfferWcaAvailableAmount').and.callThrough();

      component.ngOnInit();

      expect(offerService.getOfferWcaAvailableAmount).toHaveBeenCalledOnceWith(offerWca);
      expect(component.offerAvailableAmount).toEqual(offerWca.max_principal_amount);
    });
  });
});
