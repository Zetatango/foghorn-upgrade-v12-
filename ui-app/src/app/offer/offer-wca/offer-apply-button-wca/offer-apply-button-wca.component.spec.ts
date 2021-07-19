import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OfferApplyButtonWcaComponent } from 'app/offer/offer-wca/offer-apply-button-wca/offer-apply-button-wca.component';
import { BankAccountService } from 'app/services/bank-account.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';

// Note: [Graham] this whole component is going shortly anyways.
describe('OfferApplyButtonWcaComponent', () => {
  let component: OfferApplyButtonWcaComponent;
  let fixture: ComponentFixture<OfferApplyButtonWcaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TooltipModule.forRoot(),
        TranslateModule.forRoot()
      ],
      declarations: [OfferApplyButtonWcaComponent],
      providers: [
        BankAccountService,
        ConfigurationService,
        LoggingService,
        MerchantService,
        OfferService,
        StateRoutingService,
        TranslateService,
        UblService,
        // --- inherited
        CookieService,
        UtilityService,
        ErrorService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferApplyButtonWcaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
