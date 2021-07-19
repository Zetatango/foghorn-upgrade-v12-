import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CashFlowStartComponent } from './cash-flow-start.component';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { CookieService } from 'ngx-cookie-service';
import { OfferService } from 'app/services/offer.service';
import { UtilityService } from 'app/services/utility.service';
import { ErrorService } from 'app/services/error.service';

describe('CashFlowStartComponent', () => {
  let component: CashFlowStartComponent;
  let fixture: ComponentFixture<CashFlowStartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(),  HttpClientTestingModule],
      declarations: [ CashFlowStartComponent ],
      providers: [
        BankingFlowService,
        OfferService,
        UtilityService,
        CookieService,
        TranslateService,
        ErrorService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashFlowStartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have bank_src', () => {
    expect(component.bank_src).toBeTruthy();
  });

  describe('cancel()', () => {
    it('should call triggerCancelEvent form BankingFlowService', inject(
      [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOn(bankingFlowService, 'triggerCancelEvent');

        component.cancel();

        expect(bankingFlowService.triggerCancelEvent).toHaveBeenCalledTimes(1);
      }));
  });

  describe('next()', () => {
    it('should call triggerStartEvent form BankingFlowService', inject(
      [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOn(bankingFlowService, 'triggerStartEvent');

        component.next();

        expect(bankingFlowService.triggerStartEvent).toHaveBeenCalledTimes(1);
      }));
  });
});
