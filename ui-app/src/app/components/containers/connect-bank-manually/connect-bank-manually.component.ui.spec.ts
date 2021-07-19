import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorService } from 'app/services/error.service';

import { ConnectBankManuallyComponent } from './connect-bank-manually.component';


import { BankingFlowService } from 'app/services/banking-flow.service';
import { CookieService } from 'ngx-cookie-service';

describe('ConnectBankManuallyComponent-UI', () => {
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ADD MANUALLY BTN', () => {
    const addManuallyBtnSelector = 'button[data-ng-id=show-manual-bank-entry]';
    const addManuallyBtnDebugEl = (): DebugElement => fixture.debugElement.query(By.css(addManuallyBtnSelector));
    const addManuallyBtnEnabled = (): boolean => addManuallyBtnDebugEl().nativeElement.disabled === false;

    it('should be initially enabled', () => {
      expect(addManuallyBtnEnabled()).toBe(true);
    });

    it('should call connectBankManually when clicked', () => {
      spyOn(component, 'connectBankManually');

      addManuallyBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
      fixture.detectChanges();

      expect(component.connectBankManually).toHaveBeenCalledTimes(1);
    });
  }); // describe - connectBankManually

}); // describe - ConnectBankManuallyComponent-UI
