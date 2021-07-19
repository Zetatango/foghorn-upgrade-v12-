import { ComponentFixture, fakeAsync, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MaskPipe} from 'app/pipes/mask.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { OfferService } from 'app/services/offer.service';
import { BankAccountsPickerComponent } from './bank-accounts-picker.component';
import { BankAccountService } from 'app/services/bank-account.service';
import { ErrorService } from 'app/services/error.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { verifiedBankAccount } from 'app/test-stubs/factories/bank-account';
import { CookieService } from 'ngx-cookie-service';
import { RouterTestingModule } from '@angular/router/testing';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppLoadService } from 'app/services/app-load.service';
import { MockProvider } from 'ng-mocks';

describe('BankAccountsPickerComponent-UI', () => {
  let component: BankAccountsPickerComponent;
  let fixture: ComponentFixture<BankAccountsPickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FormsModule, HttpClientTestingModule, RouterTestingModule],
      declarations: [BankAccountsPickerComponent, MaskPipe],
      providers: [
        MockProvider(AppLoadService),
        CookieService,
        MerchantService,
        ErrorService,
        BankAccountService,
        OfferService,
        LoggingService,
        UtilityService,
        UserSessionService,
        StateRoutingService
      ]
    })
    .compileComponents();
  }));

  beforeEach(inject([MerchantService], (merchantService: MerchantService) => {
    fixture = TestBed.createComponent(BankAccountsPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
  }));

  describe('step navigation buttons (add and submit)', () => {
    it('disable upon submission', fakeAsync(() => {
      const addBankBtn = fixture.debugElement.query(By.css('button[data-ng-id="add-bank-btn"]'));
      const submitBtn = fixture.debugElement.query(By.css('button[id="bank-accounts-picker-btn"]'));
      component.accountSelector.control.setValue(verifiedBankAccount);
      component.accountSelector.control.markAllAsTouched();
      fixture.detectChanges();

      expect(addBankBtn.nativeElement.disabled).toBe(false);
      expect(submitBtn.nativeElement.disabled).toBe(false);
      submitBtn.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(addBankBtn.nativeElement.disabled).toBe(true);
      expect(submitBtn.nativeElement.disabled).toBe(true);
    }));
  });
});
