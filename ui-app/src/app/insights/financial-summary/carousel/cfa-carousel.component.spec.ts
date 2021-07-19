import { OfferService } from 'app/services/offer.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CfaCarouselComponent } from './cfa-carousel.component';
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ConfigurationService } from "app/services/configuration.service";
import { ErrorService } from "app/services/error.service";
import { LoggingService } from "app/services/logging.service";
import { MerchantService } from "app/services/merchant.service";
import { UblService } from "app/services/ubl.service";
import { UtilityService } from "app/services/utility.service";
import { CookieService } from "ngx-cookie-service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BankAccountService } from 'app/services/bank-account.service';

describe('CfaCarouselComponent', () => {
  let component: CfaCarouselComponent;
  let fixture: ComponentFixture<CfaCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CfaCarouselComponent],
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
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfaCarouselComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
