import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OfferGaugeComponent } from 'app/offer/offer-gauge/offer-gauge.component';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import { BankAccountService } from 'app/services/bank-account.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';

describe('OfferGaugeComponent', () => {
  let component: OfferGaugeComponent;
  let fixture: ComponentFixture<OfferGaugeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot()
      ],
      declarations: [
        OfferGaugeComponent,
        ZttCurrencyPipe
      ],
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
    fixture = TestBed.createComponent(OfferGaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
