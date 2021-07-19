import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BankAccountOwner } from 'app/models/bank-account';
import { BankAccountService } from 'app/services/bank-account.service';
import { InsightsService } from 'app/services/insights.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { leadFactory } from 'app/test-stubs/factories/lead';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { of, throwError } from 'rxjs';
import { CashBufferComponent } from './cash-buffer.component';

describe('CashBufferComponent', () => {
  let component: CashBufferComponent;
  let fixture: ComponentFixture<CashBufferComponent>;

  let bankAccountService: BankAccountService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CashBufferComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BankAccountService,
        InsightsService,
        MerchantService,
        LoggingService,
        UtilityService,
        FormBuilder
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashBufferComponent);
    component = fixture.componentInstance;

    bankAccountService = TestBed.inject(BankAccountService);
    bankAccountService.owner = new BankAccountOwner(leadFactory.build({ desired_bank_account_balance: 100 }));
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('ngOnInit', () => {
    it('should default the threshold input to 0 if owner does not have a desired bank account balance', () => {
      bankAccountService.owner = new BankAccountOwner(leadFactory.build({ desired_bank_account_balance: null }));
      component.ngOnInit();

      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const amountInput = htmlElement.querySelector('input[formControlName="amount"]');

      expect(amountInput.value).toBe('0');
    });

    it('should initialize the threshold input value to the owner\'s desired bank account balance', () => {
      component.ngOnInit();

      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const amountInput = htmlElement.querySelector('input[formControlName="amount"]');

      expect(amountInput.value).toBe('100');
    });
  });

  describe('saveThreshold', () => {
    it('should request an update the desired bank account balance on the merchant', () => {
      spyOn(bankAccountService, 'updateDesiredBankBalance').and.returnValue(of(null));

      fixture.detectChanges();
      component.cashBufferForm.patchValue({ amount: 200 });
      fixture.detectChanges();

      component.saveThreshold();

      expect(bankAccountService.updateDesiredBankBalance).toHaveBeenCalledOnceWith(200);
    });

    it('should set a success message on successful threshold update', () => {
      spyOn(bankAccountService, 'updateDesiredBankBalance').and.returnValue(of(null));

      fixture.detectChanges();
      component.cashBufferForm.patchValue({ amount: 200 });
      fixture.detectChanges();

      component.saveThreshold();
      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const successMessage = htmlElement.querySelector('div.text-success');
      const errorMessage = htmlElement.querySelector('div.text-danger');
      expect(successMessage).toBeTruthy();
      expect(errorMessage).toBeFalsy();
    });

    it('should set an error message on failed threshold update', () => {
      spyOn(bankAccountService, 'updateDesiredBankBalance').and.returnValue(throwError(internalServerErrorFactory.build()));

      fixture.detectChanges();
      component.cashBufferForm.patchValue({ amount: 200 });
      fixture.detectChanges();

      component.saveThreshold();
      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const successMessage = htmlElement.querySelector('div.text-success');
      const errorMessage = htmlElement.querySelector('div.text-danger');
      expect(successMessage).toBeFalsy();
      expect(errorMessage).toBeTruthy();
    });

    it('should reset error and success messages', () => {
      spyOn(bankAccountService, 'updateDesiredBankBalance').and.returnValue(of());

      fixture.detectChanges();
      component.cashBufferForm.patchValue({ amount: 200 });
      fixture.detectChanges();

      component.saveThreshold();
      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const successMessage = htmlElement.querySelector('div.text-success');
      const errorMessage = htmlElement.querySelector('div.text-danger');
      expect(successMessage).toBeFalsy();
      expect(errorMessage).toBeFalsy();
    });
  });
});
