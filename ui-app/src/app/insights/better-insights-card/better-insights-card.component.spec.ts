import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { InsightsService } from 'app/services/insights.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantService } from 'app/services/merchant.service';
import { merchantDataResponseFactory } from 'app/test-stubs/factories/merchant';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { bankAccountDetailsFactory } from 'app/test-stubs/factories/bank-account-details';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BankAccountService } from 'app/services/bank-account.service';
import { BetterInsightsCardComponent } from './better-insights-card.component';
import { SharedFormsModule } from 'app/shared/shared-forms.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { conflictFactory, internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { ErrorResponse } from 'app/models/error-response';
import {
  ALL_BANK_ACCOUNTS,
  bankAccountFactory,
} from 'app/test-stubs/factories/bank-account';
import Bugsnag from '@bugsnag/js';

describe('BetterInsightsCardComponent', () => {
  let component: BetterInsightsCardComponent;
  let fixture: ComponentFixture<BetterInsightsCardComponent>;
  let bankAccountService: BankAccountService;

  let insightsService: InsightsService;
  let setSelectedInsightsBankAccountsSpy: jasmine.Spy;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BetterInsightsCardComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        SharedFormsModule,
        NgSelectModule,
        TranslateModule.forRoot()
      ],
      providers: [
        InsightsService,
        MerchantService,
        UtilityService,
        BankAccountService,
        FormBuilder
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BetterInsightsCardComponent);
    bankAccountService = TestBed.inject(BankAccountService);
    insightsService = TestBed.inject(InsightsService);
    component = fixture.componentInstance;
    setSelectedInsightsBankAccountsSpy = spyOn(bankAccountService, 'setSelectedInsightsBankAccounts').and.returnValue(of(merchantDataResponseFactory.build()));
    spyOn(insightsService, 'fetchGraphData');
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('ngOnInit()', () => {
    describe('loadBankAccount - success', () => {
      beforeEach(() => {
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
      });

      it('sets bankAccounts', () => {
        bankAccountService.setBankAccountOwner(merchantDataFactory.build());
        bankAccountService.bankAccounts = ALL_BANK_ACCOUNTS;
        expect(component.bankAccounts).toEqual([]);
        component.ngOnInit();

        expect(component.bankAccounts).toEqual(ALL_BANK_ACCOUNTS);
      });

      it('sets selectedAccounts', () => {
        const ids = ALL_BANK_ACCOUNTS.map(({ id }) => id);
        bankAccountService.setBankAccountOwner(merchantDataFactory.build({ selected_insights_bank_accounts: ids }));
        expect(component.selectedAccounts).toEqual([]);
        component.ngOnInit();

        expect(component.selectedAccounts).toEqual(ids);
      });

      it('selectedAccounts is empty array if merchant has no selected_insights_bank_accounts', () => {
        bankAccountService.setBankAccountOwner(merchantDataFactory.build({ selected_insights_bank_accounts: null }));
        expect(component.selectedAccounts).toEqual([]);
        component.ngOnInit();

        expect(component.selectedAccounts).toEqual([]);
      });
    });

    describe('loadBankAccount - error', () => {
      it('triggers Bugsnag', () => {
        const err = new ErrorResponse(internalServerErrorFactory.build());
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(throwError(err));
        spyOn(Bugsnag, 'notify');
        component.ngOnInit();

        expect(Bugsnag.notify).toHaveBeenCalledOnceWith(err);
      });
    });
  });

  describe('onSubmitSelectedAccounts()', () => {
    it('calls setSelectedInsightsBankAccounts in bankService + fetches graph data on selection', () => {
      const bankAccounts = [
        bankAccountDetailsFactory.build({
          flinks_account_uuid: 'uuid1',
          id: 'ba_123'
        }),
        bankAccountDetailsFactory.build({
          flinks_account_uuid: 'uuid2',
          id: 'ba_234'
        })
      ];
      const owner = merchantDataFactory.build({ selected_insights_bank_accounts_details: bankAccounts })
      bankAccountService.setBankAccountOwner(owner);
      bankAccountService.insightsBankAccounts = ALL_BANK_ACCOUNTS;
      component.bankAccounts = [bankAccountFactory.build()];
      component.selectedAccounts = [component.bankAccounts[0].id];

      component.onSubmitSelectedAccounts();

      expect(setSelectedInsightsBankAccountsSpy).toHaveBeenCalledTimes(1);
      expect(insightsService.fetchGraphData).toHaveBeenCalledOnceWith(['uuid1', 'uuid2']);
    });

    it('does not call setSelectedInsightsBankAccounts in bankService on selection if saving is true and selected accounts is 0', () => {
      bankAccountService.insightsBankAccounts = ALL_BANK_ACCOUNTS;
      spyOn(component, 'invalidSubmission').and.returnValue(true);
      component.bankAccounts = [bankAccountFactory.build()];
      component.selectedAccounts = [component.bankAccounts[0].id]

      component.onSubmitSelectedAccounts();

      expect(setSelectedInsightsBankAccountsSpy).not.toHaveBeenCalled();
    });

    it('sets saving to false and error to true if call to selectInsightsBankAccounts fails', () => {
      setSelectedInsightsBankAccountsSpy.and.callThrough();
      bankAccountService.setBankAccountOwner(merchantDataFactory.build());
      const errors = [internalServerErrorFactory.build()];
      errors.forEach(error => {
        setSelectedInsightsBankAccountsSpy.and.returnValue(throwError(new ErrorResponse(error)));
        component.bankAccounts = [bankAccountFactory.build()];
        component.selectedAccounts = [component.bankAccounts[0].id];

        component.onSubmitSelectedAccounts();

        expect(component.saving).toEqual(false);
        expect(component.error).toEqual(true);
      });
    });

    it('sets processing to false and error to true if call to setSelectInsightsBankAccounts fails with 409 conflict', () => {
      setSelectedInsightsBankAccountsSpy.and.returnValue(throwError(new ErrorResponse(conflictFactory.build())));
      bankAccountService.setBankAccountOwner(merchantDataFactory.build());
      component.bankAccounts = [bankAccountFactory.build()];
      component.selectedAccounts = [component.bankAccounts[0].id];

      component.onSubmitSelectedAccounts();

      expect(component.saving).toEqual(false);
      expect(component.error).toEqual(true);
    });
  });

  describe('invalidSubmission', () => {
    it('should return true when saving', () => {
      component.saving = true;
      component.selectedAccounts = ['ba_123'];
      expect(component.invalidSubmission()).toBeTrue();
    });

    it('should return true when there are no selected bank accounts', () => {
      component.saving = false;
      component.selectedAccounts = [];
      expect(component.invalidSubmission()).toBeTrue();
    });

    it('should return true when selected bank accounts are falsy', () => {
      component.saving = false;
      component.selectedAccounts = null;
      expect(component.invalidSubmission()).toBeTrue();
    });

    it('should return false when not saving and when selected bank accounts are selected', () => {
      component.saving = false;
      component.selectedAccounts = ['ba_123'];
      expect(component.invalidSubmission()).toBeFalse();
    });
  });
});
