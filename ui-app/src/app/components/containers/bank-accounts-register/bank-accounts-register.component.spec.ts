import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorService } from 'app/services/error.service';

import { BankAccountsRegisterComponent } from './bank-accounts-register.component';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { LoadingService } from 'app/services/loading.service';
import { UtilityService } from 'app/services/utility.service';
import { By } from '@angular/platform-browser';


import { CookieService } from 'ngx-cookie-service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { bankAccountDetailsFactory } from "app/test-stubs/factories/bank-account-details";
import { merchantDataFactory } from "app/test-stubs/factories/merchant";

describe('BankAccountsRegisterComponent', () => {
  let component: BankAccountsRegisterComponent;
  let fixture: ComponentFixture<BankAccountsRegisterComponent>;
  let bankAccountsRegBodyEl: DebugElement;

  let delegatedAccessSpy: jasmine.Spy;
  let merchantSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule
      ],
      declarations: [
        BankAccountsRegisterComponent
      ],
      providers: [
        CookieService,
        LoggingService,
        MerchantService,
        LoadingService,
        UtilityService,
        TranslateService,
        ErrorService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(inject([ MerchantService ], (merchantService: MerchantService) => {
    fixture = TestBed.createComponent(BankAccountsRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    delegatedAccessSpy = spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
    merchantSpy = spyOn(merchantService, 'getMerchant');

    bankAccountsRegBodyEl = fixture.debugElement.query(By.css('div[data-ng-id="bank-accounts-register-body"]'));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('skippable', () => {
    it('returns true when it is true in BankingFlowService',
      inject([ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOnProperty(bankingFlowService, 'skippable').and.returnValue(true);
        expect(component.skippable).toEqual(true);
      }));

    it('returns false when it is false in BankingFlowService',
      inject([ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOnProperty(bankingFlowService, 'skippable').and.returnValue(false);
        expect(component.skippable).toEqual(false);
      }));
  });

  describe('description', () => {
    it('returns true whatever is set in BankingFlowService',
      inject([ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        const expectedValue = 'MY_VALUE';
        spyOnProperty(bankingFlowService, 'registerDescription').and.returnValue(expectedValue);
        expect(component.description).toEqual(expectedValue);
      }));
  });

  describe('allowManualInput', () => {
    it('returns true whatever is set in BankingFlowService',
      inject([ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        const expectedValue = true;
        spyOnProperty(bankingFlowService, 'allowManualInput').and.returnValue(expectedValue);
        expect(component.allowManualInput).toEqual(expectedValue);
      }));
  });

  // -------------------------------------------------------------------------- cancel()
  describe('cancel()', () => {
    it('should call triggerCancelEvent in BankingFlowService',
      inject([BankingFlowService], (bankingFlowService: BankingFlowService) => {
        spyOn(bankingFlowService, 'triggerCancelEvent');

        component.cancel();

        expect(bankingFlowService.triggerCancelEvent).toHaveBeenCalledTimes(1);
      }));
  }); // describe - cancel()

  // -------------------------------------------------------------------------- skip()
  describe('skip()', () => {
    it('should call triggerSkipEvent in BankingFlowService',
      inject([BankingFlowService], (bankingFlowService: BankingFlowService) => {
      spyOn(bankingFlowService, 'triggerSkipEvent');

      component.skip();

      expect(bankingFlowService.triggerSkipEvent).toHaveBeenCalledTimes(1);
    }));
  }); // describe - skip()

  // --------------------------------------------------------------- isDelegatedAccess()
  describe('isDelegatedAccess()', () => {
    it('should return delegated access state from merchant service', () => {
      delegatedAccessSpy.and.returnValues(true, false);
      expect(component.delegatedAccess).toEqual(true);
      expect(component.delegatedAccess).toEqual(false);
    });

    it('should contain delegate-warn div element if true', () => {
      delegatedAccessSpy.and.returnValue(true);

      fixture.detectChanges();

      const delegateWarn = bankAccountsRegBodyEl.query(By.css('alert[data-ng-id="delegate-warn"]'));
      const flinksFrame = bankAccountsRegBodyEl.query(By.css('div[data-ng-id="flinks-frame"]'));

      expect(bankAccountsRegBodyEl.nativeElement).toBeTruthy();
      expect(delegateWarn.nativeElement).toBeTruthy();
      expect(flinksFrame).toBeFalsy();
    });

    it('should contain flinks-frame div element if false', () => {
      delegatedAccessSpy.and.returnValue(false);

      fixture.detectChanges();

      const delegateWarn = bankAccountsRegBodyEl.query(By.css('alert[data-ng-id="delegate-warn"]'));
      const flinksFrame = bankAccountsRegBodyEl.query(By.css('div[data-ng-id="flinks-frame"]'));

      expect(bankAccountsRegBodyEl.nativeElement).toBeTruthy();
      expect(delegateWarn).toBeFalsy();
      expect(flinksFrame.nativeElement).toBeTruthy();
    });
  }); // describe - isDelegatedAccess()

  // --------------------------------------------------------------- getInstitutionName()
  describe('getInstitutionName()', () => {
    it('should return institution name from the merchant service when account present', () => {
      const bankAccountDetails = bankAccountDetailsFactory.build({ institution_name: 'ABC Bank', masked_account_number: '****5678' });
      merchantSpy.and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: bankAccountDetails }));
      expect(component.institutionName).toEqual('ABC Bank');
    });

    it('should return Unknown when account not present', () => {
      merchantSpy.and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: undefined }));
      expect(component.institutionName).toEqual('SET_BANK_INSTRUCTIONS.UNKNOWN');
    });
  }); // describe - getInstitutionName()

  // --------------------------------------------------------------- getMaskedAccountNumber()
  describe('getMaskedAccountNumber()', () => {
    it('should return masked account number from the merchant service when account present', () => {
      const bankAccountDetails = bankAccountDetailsFactory.build({ institution_name: 'ABC Bank', masked_account_number: '****5678' });
      merchantSpy.and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: bankAccountDetails }));
      expect(component.maskedAccountNumber).toEqual('****5678');
    });

    it('should return Unknown when account not present', () => {
      merchantSpy.and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: undefined }));
      expect(component.maskedAccountNumber).toEqual('SET_BANK_INSTRUCTIONS.UNKNOWN');
    });
  }); // describe - getInstitutionName()

  describe('isUserLangFr()', () => {
    it('should return true if user lang is fr-FR', () => {
      spyOnProperty(navigator, 'language').and.returnValue('fr-FR');
      expect(component.isUserLangFr()).toEqual(true);
    });

    it('should return true if user lang is fr-CA', () => {
      spyOnProperty(navigator, 'language').and.returnValue('fr-CA');
      expect(component.isUserLangFr()).toEqual(true);
    });

    it('should return false if user lang is en-US', () => {
      spyOnProperty(navigator, 'language').and.returnValue('en-US');
      expect(component.isUserLangFr()).toEqual(false);
    });

    it('should return false if user lang is en-CA', () => {
      spyOnProperty(navigator, 'language').and.returnValue('en-CA');
      expect(component.isUserLangFr()).toEqual(false);
    });
  });

  describe('isSafariDesktop()', () => {
    it('should return true userAgent contains Safari, userAgent does not contain Mobi/Android, vendor contains Apple Computer', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15');
      spyOnProperty(navigator, 'vendor').and.returnValue('Apple Computer, Inc.');
      expect(component.isSafariDesktop()).toEqual(true);
    });

    it('should return false if userAgent does not contain Safari', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1');
      spyOnProperty(navigator, 'vendor').and.returnValue('Apple Computer, Inc.');
      expect(component.isSafariDesktop()).toEqual(false);
    });

    it('should return false if userAgent contains Mobi/Android', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Mobile/15E148 Safari/604.1');
      spyOnProperty(navigator, 'vendor').and.returnValue('Apple Computer, Inc.');
      expect(component.isSafariDesktop()).toEqual(false);
    });

    it('should return false if vendor does not contain Apple Computer', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36');
      spyOnProperty(navigator, 'vendor').and.returnValue('Google Inc.');
      expect(component.isSafariDesktop()).toEqual(false);
    });
  });
});
