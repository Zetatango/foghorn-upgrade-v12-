import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { TranslateModule } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

import { BankAccountsErrorComponent } from './bank-accounts-error.component';

import { BankAccountService, BankAccountLoadingState } from 'app/services/bank-account.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';

describe('BankAccountsErrorComponent', () => {
  let component: BankAccountsErrorComponent;
  let fixture: ComponentFixture<BankAccountsErrorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule ],
      declarations: [ BankAccountsErrorComponent ],
      providers: [
        BankAccountService,
        MerchantService,
        UtilityService,
        CookieService,
        LoggingService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankAccountsErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('restart()', () => {
    it('should set BankAccountLoadingState to READY', inject([ BankAccountService ], (bankService: BankAccountService) => {
      spyOn(bankService, 'setBankAccountLoadingState');

      component.restart();

      expect(bankService.setBankAccountLoadingState).toHaveBeenCalledOnceWith(BankAccountLoadingState.READY);
    }));
  });
});
