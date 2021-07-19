import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { AddBankAccountManualComponent } from './add-bank-account-manual.component';
import { MerchantService } from 'app/services/merchant.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { ExcludeEmojiDirective } from 'app/directives/exclude-emoji.directive';
import { UiError } from 'app/models/ui-error';
import { validFormStub, stubValidBankingInfoForm, stubInvalidBankingInfoForm } from './add-bank-account-manual.helper';
import Bugsnag from '@bugsnag/js';
import { conflictFactory } from 'app/test-stubs/factories/response';
import { ErrorResponse } from "app/models/error-response";
import { of, throwError } from 'rxjs';

describe('AddBankAccountManualComponent', () => {
  let component: AddBankAccountManualComponent;
  let fixture: ComponentFixture<AddBankAccountManualComponent>;

  let createBankAccountSpy: jasmine.Spy;
  let bankCancelSpy: jasmine.Spy;
  let bankCompleteSpy: jasmine.Spy;
  let errorShowSpy: jasmine.Spy;

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
        TranslateService,
        FormBuilder
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });

    fixture = TestBed.createComponent(AddBankAccountManualComponent);
    component = fixture.componentInstance;

    const merchantService: MerchantService = TestBed.inject(MerchantService);
    const bankAccountService: BankAccountService = TestBed.inject(BankAccountService);
    const bankFlowService: BankingFlowService = TestBed.inject(BankingFlowService);
    const errorService: ErrorService = TestBed.inject(ErrorService);

    spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
    createBankAccountSpy = spyOn(bankAccountService, 'createBankAccount');
    bankCancelSpy = spyOn(bankFlowService, 'triggerCancelEvent');
    bankCompleteSpy = spyOn(bankFlowService, 'triggerCompleteEvent');
    spyOn(Bugsnag, 'notify');
    errorShowSpy = spyOn(errorService, 'show');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------------- cancel()
  describe('cancel()', () => {
    it('should set cancelling to true', () => {
      expect(component.cancelling).toBe(false);
      component.cancel();

      expect(component.cancelling).toBe(true);
    });

    it('should call triggerCancelEvent from BankingFlowService', () => {
      component.cancel();

      expect(bankCancelSpy).toHaveBeenCalledTimes(1);
    });
  }); // describe - cancel()

  // -------------------------------------------------------------------------------- create()
  describe('create()', () => {

    describe('when the form is valid', () => {
      beforeEach(() => {
        fixture.detectChanges();
        stubValidBankingInfoForm(component);
        fixture.detectChanges();
        expect(component.isFormInvalid).toBe(false);
      });

      it('should set creatingBankAccount to true', () => {
        createBankAccountSpy.and.returnValue(of(null));

        expect(component.creatingBankAccount).toBe(false);
        component.create();
        expect(component.creatingBankAccount).toBe(true);
      });

      it('should call createBankAccount from BankAccountService', () => {
        createBankAccountSpy.and.returnValue(of(null));

        component.create();

        expect(createBankAccountSpy).toHaveBeenCalledOnceWith(validFormStub);
      });

      describe('when succeeded to create the bank account', () => {
        beforeEach(() => {
          createBankAccountSpy.and.returnValue(of(null));
        });

        it('should call triggerCompleteEvent from BankingFlowService', fakeAsync(() => {
          component.create();
          tick();

          expect(createBankAccountSpy).toHaveBeenCalledTimes(1);
          expect(bankCompleteSpy).toHaveBeenCalledTimes(1);
        }));

        it('should keep creatingBankAccount set to true', fakeAsync(() => {
          component.create();
          tick();

          expect(component.creatingBankAccount).toBe(true);
        }));
      }); // describe - when succeeded to create the bank account

      describe('when failed to create the bank account', () => {

        describe('with an HTTP_ERROR:409 (Conflict),', () => {

          beforeEach(() => {
            createBankAccountSpy.and.returnValue(throwError(new ErrorResponse(conflictFactory.build())));
          });

          it('should show an error modal', fakeAsync(() => {
            fixture.detectChanges();
            component.create();
            tick();

            expect(errorShowSpy).toHaveBeenCalledOnceWith(UiError.createBankAccount);
          }));

          it('should trigger a bugsnag', fakeAsync(() => {
            fixture.detectChanges();
            component.create();
            tick();

            expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
          }));

          it('should still call triggerCompleteEvent', fakeAsync(() => {
            fixture.detectChanges();
            component.create();
            tick();

            expect(bankCompleteSpy).toHaveBeenCalledTimes(1);
          }));
        }); // describe - 'with an HTTP_ERROR:409 (Conflict),'

        describe('with any other HTTP_ERROR,', () => {
          beforeEach(() => {
            createBankAccountSpy.and.returnValue(throwError(new ErrorResponse(new HttpErrorResponse({}))));
          });

          it('should show an error modal', fakeAsync(() => {
            fixture.detectChanges();
            component.create();
            tick();

            expect(errorShowSpy).toHaveBeenCalledOnceWith(UiError.createBankAccount);
          }));

          it('should trigger a bugsnag', fakeAsync(() => {
            fixture.detectChanges();
            component.create();
            tick();

            expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
          }));

          it('should not triggerCompleteEvent', fakeAsync(() => {
            fixture.detectChanges();
            component.create();
            tick();

            expect(bankCompleteSpy).not.toHaveBeenCalled();
          }));

          it('should then set creatingBankAccount to false', fakeAsync(() => {
            expect(component.creatingBankAccount).toBe(false);
            component.create();
            tick();

            expect(component.creatingBankAccount).toBe(false);
          }));
        }); // describe - 'with any other HTTP_ERROR,'
      }); // describe - when failed to create the bank account
    }); // when the form is valid

    describe('when the form is invalid', () => {
      beforeEach(() => {
        fixture.detectChanges();
        stubInvalidBankingInfoForm(component);
        fixture.detectChanges();
        expect(component.isFormInvalid).toBe(true);
      });

      it('should not set creatingBankAccount to true', () => {
        expect(component.creatingBankAccount).toBe(false);
        component.create();
        expect(component.creatingBankAccount).toBe(false);
      });

      it('should not attempt to create the bank account', () => {
        component.create();

        expect(createBankAccountSpy).toHaveBeenCalledTimes(0);
        expect(bankCompleteSpy).toHaveBeenCalledTimes(0);
      });
    }); // when the form is invalid
  }); // describe - create()

  // SETTERS & GETTERS

  describe('bankInformationFormGroup', () => {
    const expectedForm = new FormBuilder().group({
      transit_number: [ '1' ],
      institution_number: [ '2' ],
      account_number: [ '3' ]
    });

    it('should be able to get & set the form', () => {
      expect(component.bankInformationFormGroup).toBeUndefined();
      component.bankInformationFormGroup = expectedForm;
      expect(component.bankInformationFormGroup).toEqual(expectedForm);
    });
  }); // describe - bankInformationFormGroup

}); // describe - AddBankAccountManualComponent
