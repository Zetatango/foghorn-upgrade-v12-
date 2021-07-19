import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConnectBankManuallyComponent } from './connect-bank-manually.component';


import { BankingFlowService } from 'app/services/banking-flow.service';
import { CookieService } from 'ngx-cookie-service';
import { ErrorService } from 'app/services/error.service';

describe('ConnectBankManuallyComponent', () => {
  let component: ConnectBankManuallyComponent;
  let fixture: ComponentFixture<ConnectBankManuallyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectBankManuallyComponent ],
      imports: [ TranslateModule.forRoot() ],
      providers: [ BankingFlowService, CookieService, TranslateService, ErrorService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectBankManuallyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('connectBankManually()', () => {
    it('should call triggerDisplayManualFormEvent from BankingFlowService',
      inject([ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOn(bankingFlowService, 'triggerDisplayManualFormEvent');

        component.connectBankManually();

        expect(bankingFlowService.triggerDisplayManualFormEvent).toHaveBeenCalledTimes(1);
      }));
  }); // describe - connectBankManually

}); // describe - ConnectBankManuallyComponent
