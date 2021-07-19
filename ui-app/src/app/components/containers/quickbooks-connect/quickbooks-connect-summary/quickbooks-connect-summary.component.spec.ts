import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { QuickbooksConnectSummaryComponent } from './quickbooks-connect-summary.component';
import { TranslateModule } from '@ngx-translate/core';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { DefaultPipe } from 'app/pipes/default.pipe';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';

describe('QuickbooksConnectSummaryComponent', () => {
  let component: QuickbooksConnectSummaryComponent;
  let fixture: ComponentFixture<QuickbooksConnectSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuickbooksConnectSummaryComponent,
        DefaultPipe
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        UtilityService,
        CookieService,
        LoggingService,
        MerchantService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickbooksConnectSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isQuickBooksConnected', () => {
    it('should proxy to merchant service for true value ', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
        spyOn(merchantService, 'isQuickBooksConnected').and.returnValue(true);
        expect(component.isQuickBooksConnected()).toBeTruthy();
      }));

    it('should proxy to merchant service for false value', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
        spyOn(merchantService, 'isQuickBooksConnected').and.returnValue(false);
        expect(component.isQuickBooksConnected()).toBeFalsy();
      }));

  });

  describe('getMerchant', () => {
    it('returns merchant ', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
        spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
        expect(component.merchant).toEqual(merchantDataFactory.build());
      }));

  });
});
