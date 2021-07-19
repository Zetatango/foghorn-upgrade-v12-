import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CreditAvailableComponent } from './credit-available.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { UblService } from 'app/services/ubl.service';
import { MerchantService } from 'app/services/merchant.service';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from 'app/services/utility.service';
import { ErrorService } from 'app/services/error.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { loadOffer$, offers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { BankAccountService } from 'app/services/bank-account.service';

describe('CreditAvailableComponent', () => {
  let component: CreditAvailableComponent;
  let fixture: ComponentFixture<CreditAvailableComponent>;
  let offerService: OfferService;
  let merchantService: MerchantService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [CreditAvailableComponent],
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
    fixture = TestBed.createComponent(CreditAvailableComponent);
    component = fixture.componentInstance;

    offerService = TestBed.inject(OfferService);

    spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    merchantService = TestBed.inject(MerchantService);

    // Set spies:
    spyOn(merchantService, 'getMerchantOutstandingBalance').and.returnValue(0);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('existingOffer', () => {
    it('should return existing offer', () => {
      component.ngOnInit();
      expect(component.offer.available_amount).toEqual(5000);
    });
  });
});
