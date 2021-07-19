import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';

import { ConnectBankComponent } from './connect-bank.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { CookieService } from 'ngx-cookie-service';

import { ErrorService } from 'app/services/error.service';

describe('ConnectBankComponent', () => {
  let component: ConnectBankComponent;
  let fixture: ComponentFixture<ConnectBankComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ ConnectBankComponent ],
      providers: [
        BankingFlowService,
        CookieService,
        TranslateService,
        ErrorService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectBankComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('connectBank()', () => {
    it('should call triggerStartEvent in BankingFlowService', inject([ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
      spyOn(bankingFlowService, 'triggerStartEvent');

      component.connectBank();
      expect(bankingFlowService.triggerStartEvent).toHaveBeenCalledTimes(1);
    }));
  });
});
