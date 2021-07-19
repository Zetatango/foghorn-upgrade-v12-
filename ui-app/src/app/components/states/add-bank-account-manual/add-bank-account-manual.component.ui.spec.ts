import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { AddBankAccountManualComponent } from './add-bank-account-manual.component';
import { MerchantService } from 'app/services/merchant.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { ExcludeEmojiDirective } from 'app/directives/exclude-emoji.directive';
import { stubValidBankingInfoForm } from './add-bank-account-manual.helper';
import { ALL_EMOJIS, ALPHA_CHARS, DIGIT_CHARS, ALL_CHARS, getInput, sendInput } from 'app/test-utilities/forms';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';
import { of, throwError } from 'rxjs';
import { ErrorResponse } from 'app/models/error-response';



describe('AddBankAccountManualComponent-UI', () => {
  let component: AddBankAccountManualComponent;
  let fixture: ComponentFixture<AddBankAccountManualComponent>;

  let createBankAccountSpy: jasmine.Spy;
  let bankCancelSpy: jasmine.Spy;
  let bankCompleteSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddBankAccountManualComponent,
        ExcludeEmojiDirective
      ],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        MerchantService,
        BankAccountService,
        BankingFlowService,
        ErrorService,
        UtilityService,
        LoggingService,
        CookieService,
        FormBuilder,
        TranslateService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });

    fixture = TestBed.createComponent(AddBankAccountManualComponent);
    component = fixture.componentInstance;

    const merchantService: MerchantService = TestBed.inject(MerchantService);
    const bankAccountService: BankAccountService = TestBed.inject(BankAccountService);
    const bankFlowService: BankingFlowService = TestBed.inject(BankingFlowService);
    const errorService: ErrorService = TestBed.inject(ErrorService);

    fixture.detectChanges();

    spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
    createBankAccountSpy = spyOn(bankAccountService, 'createBankAccount');
    bankCancelSpy = spyOn(bankFlowService, 'triggerCancelEvent');
    bankCompleteSpy = spyOn(bankFlowService, 'triggerCompleteEvent');
    spyOn(Bugsnag, 'notify');
    spyOn(errorService, 'show');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ------------------------------------------------------------------------------------- FORM
  describe('FORM', () => {
    const ACCEPTED_CHARS = DIGIT_CHARS;
    const REJECTED_CHARS = ALL_CHARS.filter(c => !ACCEPTED_CHARS.includes(c));
    const aValidChar = ACCEPTED_CHARS[0];

    describe('transit number', () => {
      const transitNumberSelector = 'input#transit_number';
      const transitNumberErrorSelector = '*[data-ng-id=transit-validation-error] span';
      const transitNumberErrorLabel = 'ADD_BANK_ACCOUNT_MANUAL.TRANSIT_NUMBER.INVALID';
      const sendTransitInput = (value: string) => sendInput(fixture, transitNumberSelector, value);
      const getTransitInput = () => getInput(fixture, transitNumberSelector);
      const transitMinLen = 5;
      const transitMaxLen = 5;

      it(`should reject less than ${transitMinLen} characters`, fakeAsync(() => {
        for ( let i = 0 ; i < transitMinLen ; i++ ) {
          const inputValue = aValidChar.repeat(i);
          sendTransitInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getTransitInput()).toEqual(inputValue);
          expect(component.isTransitNumberInvalid).toBe(true);
        }
      }));

      it(`should reject more than ${transitMaxLen} characters`, fakeAsync(() => {
        for ( let i = transitMaxLen + 1 ; i < transitMaxLen * 2 ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendTransitInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getTransitInput()).toEqual(inputValue);
          expect(component.isTransitNumberInvalid).toBe(true);
        }
      }));

      it(`should accept from ${transitMinLen} to ${transitMaxLen} digits`, fakeAsync(() => {
        for ( let i = transitMinLen ; i <= transitMaxLen ; i++ ) {
          const inputValue = aValidChar.repeat(i);
          sendTransitInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getTransitInput()).toEqual(inputValue);
          expect(component.isTransitNumberValid).toBe(true);
        }
      }));

      xit(`should discard any ${transitMinLen + 1}th & more characters inputted`, fakeAsync(() => {
        for ( let i = transitMinLen + 1 ; i < transitMinLen * 2 ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendTransitInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(component.isTransitNumberValid).toBe(true);
        }
      }));

      it('should accept leading & trailing zeros', fakeAsync(() => {
        const zerosInput = '0'.repeat(transitMinLen);
        sendTransitInput(zerosInput);
        tick();

        expect(getTransitInput()).toBe(zerosInput);
        expect(component.isTransitNumberValid).toBe(true);
      }));

      it('should allow any of the expected characters', fakeAsync(() => {
        ACCEPTED_CHARS.forEach(acceptedChar => {
          const validInput = acceptedChar.repeat(transitMinLen);
          sendTransitInput(validInput);
          tick();

          expect(getTransitInput()).toBe(validInput);
          expect(component.isTransitNumberValid).toBe(true);
        });
      }));

      it('should reject any of the unexpected characters', fakeAsync(() => {
        REJECTED_CHARS.forEach(rejectedChar => {
          const invalidInput = rejectedChar.repeat(transitMinLen);
          sendTransitInput(invalidInput);
          tick();

          expect(component.isTransitNumberInvalid).toBe(true);
        });
      }));

      it('should display validation error somewhere when transit number is invalid', fakeAsync(() => {
        const invalidInput = REJECTED_CHARS[0];
        sendTransitInput(invalidInput);
        tick();

        const validationErrorElement = fixture.debugElement.query(By.css(transitNumberErrorSelector)).nativeElement;

        expect(validationErrorElement).toBeTruthy();
        expect(validationErrorElement.innerText).toEqual(transitNumberErrorLabel);
      }));

      it('should reject (~and discard) alphabetic characters', fakeAsync(() => {
        ALPHA_CHARS.forEach(alphaChar => {
          const uncleanInput = alphaChar + aValidChar + alphaChar;
          sendTransitInput(uncleanInput);
          tick();

          expect(component.isTransitNumberInvalid).toBe(true);
        });
      }));

      it('should reject (~and discard) emojis characters', fakeAsync(() => {
        ALL_EMOJIS.forEach(emoji => {
          const uncleanInput = emoji + aValidChar + emoji;
          sendTransitInput(uncleanInput);
          tick();

          expect(component.isTransitNumberInvalid).toBe(true);
        });
      }));

      it('should accept and not discard any of the expected characters', fakeAsync(() => {
        ACCEPTED_CHARS.forEach(acceptedChar => {
          const validInput = acceptedChar.repeat(transitMinLen);
          sendTransitInput(validInput);
          tick();

          expect(getTransitInput()).toBe(validInput);
          expect(component.isTransitNumberValid).toBe(true);
        });
      }));

      it('should reject (~and discard) any of the unexpected characters', fakeAsync(() => {
        REJECTED_CHARS.forEach(rejectedChar => {
          sendTransitInput(rejectedChar.repeat(transitMinLen));
          tick();

          expect(component.isTransitNumberInvalid).toBe(true);
        });
      }));
    }); // descrine - transit number

    describe('institution number', () => {
      const institutionNumberSelector = 'input#institution_number';
      const institutionNumberErrorSelector = '*[data-ng-id=institution-validation-error] span';
      const institutionNumberErrorLabel = 'ADD_BANK_ACCOUNT_MANUAL.INSTITUTION_NUMBER.INVALID';
      const sendInstitutionInput = (value: string) => sendInput(fixture, institutionNumberSelector, value);
      const getInstitutionInput = () => getInput(fixture, institutionNumberSelector);
      const institutionMinLen = 3;
      const institutionMaxLen = 3;

      it(`should reject less than ${institutionMinLen} characters`, fakeAsync(() => {
        for ( let i = 0 ; i < institutionMinLen ; i++ ) {
          const inputValue = aValidChar.repeat(i);
          sendInstitutionInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getInstitutionInput()).toEqual(inputValue);
          expect(component.isInstitutionNumberInvalid).toBe(true);
        }
      }));

      it(`should reject more than ${institutionMaxLen} characters`, fakeAsync(() => {
        for ( let i = institutionMaxLen + 1 ; i < institutionMaxLen * 2 ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendInstitutionInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getInstitutionInput()).toEqual(inputValue);
          expect(component.isInstitutionNumberInvalid).toBe(true);
        }
      }));

      it(`should accept from ${institutionMinLen} to ${institutionMaxLen} digits`, fakeAsync(() => {
        for ( let i = institutionMinLen ; i <= institutionMaxLen ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendInstitutionInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getInstitutionInput()).toEqual(inputValue);
          expect(component.isInstitutionNumberValid).toBe(true);
        }
      }));

      xit(`should discard any ${institutionMinLen + 1}th & more characters inputted`, fakeAsync(() => {
        for ( let i = institutionMinLen + 1 ; i < institutionMinLen * 2 ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendInstitutionInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(component.isInstitutionNumberValid).toBe(true);
        }
      }));

      it('should accept leading & trailing zeros', fakeAsync(() => {
        const zerosInput = '0'.repeat(institutionMinLen);
        sendInstitutionInput(zerosInput);
        tick();

        expect(getInstitutionInput()).toBe(zerosInput);
        expect(component.isInstitutionNumberValid).toBe(true);
      }));

      it('should allow any of the expected characters', fakeAsync(() => {
        ACCEPTED_CHARS.forEach(acceptedChar => {
          const validInput = acceptedChar.repeat(institutionMinLen);
          sendInstitutionInput(validInput);
          tick();

          expect(getInstitutionInput()).toBe(validInput);
          expect(component.isInstitutionNumberValid).toBe(true);
        });
      }));

      it('should reject any of the unexpected characters', fakeAsync(() => {
        REJECTED_CHARS.forEach(rejectedChar => {
          const invalidInput = rejectedChar.repeat(institutionMinLen);
          sendInstitutionInput(invalidInput);
          tick();

          expect(component.isInstitutionNumberInvalid).toBe(true);
        });
      }));

      it('should display validation error somewhere when institution number is invalid', fakeAsync(() => {
        const invalidInput = REJECTED_CHARS[0];
        sendInstitutionInput(invalidInput);
        tick();

        const validationErrorElement = fixture.debugElement.query(By.css(institutionNumberErrorSelector)).nativeElement;

        expect(validationErrorElement).toBeTruthy();
        expect(validationErrorElement.innerText).toEqual(institutionNumberErrorLabel);
      }));

      it('should reject (~and discard) alphabetic characters', fakeAsync(() => {
        ALPHA_CHARS.forEach(alphaChar => {
          const uncleanInput = alphaChar + aValidChar + alphaChar;
          sendInstitutionInput(uncleanInput);
          tick();

          expect(component.isInstitutionNumberInvalid).toBe(true);
        });
      }));

      it('should reject (~and discard) emojis characters', fakeAsync(() => {
        ALL_EMOJIS.forEach(emoji => {
          const uncleanInput = emoji + aValidChar + emoji;
          sendInstitutionInput(uncleanInput);
          tick();

          expect(component.isInstitutionNumberInvalid).toBe(true);
        });
      }));

      it('should accept and not discard any of the expected characters', fakeAsync(() => {
        ACCEPTED_CHARS.forEach(acceptedChar => {
          const validInput = acceptedChar.repeat(institutionMinLen);
          sendInstitutionInput(validInput);
          tick();

          expect(getInstitutionInput()).toBe(validInput);
          expect(component.isInstitutionNumberValid).toBe(true);
        });
      }));

      it('should reject (~and discard) any of the unexpected characters', fakeAsync(() => {
        REJECTED_CHARS.forEach(rejectedChar => {
          sendInstitutionInput(rejectedChar.repeat(institutionMinLen));
          tick();

          expect(component.isTransitNumberInvalid).toBe(true);
        });
      }));
    }); // describe - institution number

    describe('account number', () => {
      const accountNumberSelector = 'input#account_number';
      const accountNumberErrorSelector = '*[data-ng-id=account-validation-error] span';
      const accountNumberErrorLabel = 'ADD_BANK_ACCOUNT_MANUAL.ACCOUNT_NUMBER.INVALID';
      const sendAccountInput = (value: string) => sendInput(fixture, accountNumberSelector, value);
      const getAccountInput = () => getInput(fixture, accountNumberSelector);
      const accountMinLen = 5;
      const accountMaxLen = 12;

      it(`should reject less than ${accountMinLen} characters`, fakeAsync(() => {
        for ( let i = 0 ; i < accountMinLen ; i++ ) {
          const inputValue = aValidChar.repeat(i);
          sendAccountInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getAccountInput()).toEqual(inputValue);
          expect(component.isAccountNumberInvalid).toBe(true);
        }
      }));

      it(`should reject more than ${accountMaxLen} characters`, fakeAsync(() => {
        for ( let i = accountMaxLen + 1 ; i < accountMaxLen * 2 ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendAccountInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getAccountInput()).toEqual(inputValue);
          expect(component.isAccountNumberInvalid).toBe(true);
        }
      }));

      it(`should accept from ${accountMinLen} to ${accountMaxLen} digits`, fakeAsync(() => {
        for ( let i = accountMinLen ; i <= accountMaxLen ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendAccountInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(getAccountInput()).toEqual(inputValue);
          expect(component.isAccountNumberValid).toBe(true);
        }
      }));

      xit(`should discard any ${accountMaxLen + 1}th & more characters inputted`, fakeAsync(() => {
        for ( let i = accountMaxLen + 1 ; i < accountMaxLen * 2 ; i++ ) { // High bound arbitrary
          const inputValue = aValidChar.repeat(i);
          sendAccountInput(inputValue);
          tick();
          fixture.detectChanges();

          expect(component.isAccountNumberValid).toBe(true);
        }
      }));

      it('should accept leading & trailing zeros', fakeAsync(() => {
        const zerosInput = '0'.repeat(accountMinLen);
        sendAccountInput(zerosInput);
        tick();

        expect(getAccountInput()).toBe(zerosInput);
        expect(component.isAccountNumberValid).toBe(true);
      }));

      it('should allow any of the expected characters', fakeAsync(() => {
        ACCEPTED_CHARS.forEach(acceptedChar => {
          const validInput = acceptedChar.repeat(accountMinLen);
          sendAccountInput(validInput);
          tick();

          expect(getAccountInput()).toBe(validInput);
          expect(component.isAccountNumberValid).toBe(true);
        });
      }));

      it('should reject any of the unexpected characters', fakeAsync(() => {
        REJECTED_CHARS.forEach(rejectedChar => {
          const invalidInput = rejectedChar.repeat(accountMinLen);
          sendAccountInput(invalidInput);
          tick();

          expect(component.isAccountNumberInvalid).toBe(true);
        });
      }));

      it('should display validation error somewhere when account number is invalid', fakeAsync(() => {
        const invalidInput = REJECTED_CHARS[0];
        sendAccountInput(invalidInput);
        tick();

        const validationErrorElement = fixture.debugElement.query(By.css(accountNumberErrorSelector)).nativeElement;

        expect(validationErrorElement).toBeTruthy();
        expect(validationErrorElement.innerText).toEqual(accountNumberErrorLabel);
      }));

      it('should reject (~and discard) alphabetic characters', fakeAsync(() => {
        ALPHA_CHARS.forEach(alphaChar => {
          const uncleanInput = alphaChar + aValidChar + alphaChar;
          sendAccountInput(uncleanInput);
          tick();

          expect(component.isAccountNumberInvalid).toBe(true);
        });
      }));

      it('should reject (~and discard) emojis characters', fakeAsync(() => {
        ALL_EMOJIS.forEach(emoji => {
          const uncleanInput = emoji + aValidChar + emoji;
          sendAccountInput(uncleanInput);
          tick();

          expect(component.isAccountNumberInvalid).toBe(true);
        });
      }));

      it('should accept and not discard any of the expected characters', fakeAsync(() => {
        ACCEPTED_CHARS.forEach(acceptedChar => {
          const validInput = acceptedChar.repeat(accountMinLen);
          sendAccountInput(validInput);
          tick();

          expect(getAccountInput()).toBe(validInput);
          expect(component.isAccountNumberValid).toBe(true);
        });
      }));

      it('should reject (~and discard) any of the unexpected characters', fakeAsync(() => {
        REJECTED_CHARS.forEach(rejectedChar => {
          sendAccountInput(rejectedChar.repeat(accountMinLen));
          tick();

          expect(component.isTransitNumberInvalid).toBe(true);
        });
      }));
    }); // describe - account number
  }); // describe - FORM

  // ------------------------------------------------------------------------------- NAVIGATION
  describe('NAVIGATION', () => {
    const cancelBtnSelector = 'button[data-ng-id=cancel-add-bank-account-manual]';
    const cancelBtnDebugEl = (): DebugElement => fixture.debugElement.query(By.css(cancelBtnSelector));
    const cancelBtnEnabled = (): boolean => cancelBtnDebugEl().nativeElement.disabled === false;
    const cancelBtnDisabled = (): boolean => !cancelBtnEnabled();

    const nextBtnSelector = 'button[data-ng-id=next-add-bank-account-manual]';
    const nextBtnDebugEl = (): DebugElement => fixture.debugElement.query(By.css(nextBtnSelector));
    const nextBtnEnabled = (): boolean => nextBtnDebugEl().nativeElement.disabled === false;
    const nextBtnDisabled = (): boolean => !nextBtnEnabled();

    describe('BACK BTN', () => {
      beforeEach(() => {
        expect(cancelBtnDebugEl()).toBeTruthy();
        expect(cancelBtnEnabled()).toBeTruthy();
      });

      it('should disabled back button', () => {
        cancelBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(cancelBtnDisabled()).toBeTruthy();
      });

      it('should call cancel()', () => {
        cancelBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(bankCancelSpy).toHaveBeenCalledTimes(1);
      });
    }); // describe - BACK BTN

    describe('NEXT BTN', () => {
      beforeEach(() => {
        expect(nextBtnDebugEl()).toBeTruthy();
        expect(nextBtnDisabled()).toBeTruthy();

        stubValidBankingInfoForm(component);
        createBankAccountSpy.and.returnValue(of(null));
        fixture.detectChanges();

        expect(nextBtnEnabled()).toBeTruthy();
      });

      it('should disable the next button', () => {
        nextBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(nextBtnDisabled()).toBeTruthy();
      });

      it('should also disable back button', () => {
        nextBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(cancelBtnDisabled()).toBeTruthy();
      });

      it('should call create()', () => {
        nextBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(createBankAccountSpy).toHaveBeenCalledTimes(1);
      });

      it('should not re-enable next button after successfully creating bank account', fakeAsync(() => {
        nextBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(nextBtnDisabled()).toBeTruthy();

        tick();
        fixture.detectChanges();

        expect(nextBtnDisabled()).toBeTruthy();
        expect(bankCompleteSpy).toHaveBeenCalledTimes(1);
      }));

      describe('when failing to create bank account', () => {
        it('should re-enable next button after failing to create bank account', fakeAsync(() => {
          createBankAccountSpy.and.returnValue(throwError(new ErrorResponse(internalServerErrorFactory.build())));

          nextBtnDebugEl().nativeElement.dispatchEvent(new MouseEvent('click'));
          fixture.detectChanges();

          expect(nextBtnEnabled()).toBeTruthy();
          expect(bankCompleteSpy).not.toHaveBeenCalled();
        }));
      }); // describe - 'when failing to create bank account'
    }); // describe - NEXT BTN
  }); // describe - NAVIGATION
}); // describe - AddBankAccountManualComponent-UI
