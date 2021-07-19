import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { LogSeverity } from 'app/models/api-entities/log';
import { ErrorResponse } from 'app/models/error-response';
import { UiError } from 'app/models/ui-error';
import { MaskPipe } from 'app/pipes/mask.pipe';
import { BankAccountLoadingState, BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingContext } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { ALL_BANK_ACCOUNTS, verifiedBankAccount } from 'app/test-stubs/factories/bank-account';
import { merchantDataFactory, merchantDataResponseFactory } from 'app/test-stubs/factories/merchant';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { BankAccountsPickerComponent } from './bank-accounts-picker.component';
import { conflictFactory, internalServerErrorFactory, voidResponseFactory } from 'app/test-stubs/factories/response';
import { bankAccountFactory } from 'app/test-stubs/factories/bank-account';
import { AppRoutes } from 'app/models/routes';
import { Router } from '@angular/router';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { CONSTANTS } from 'app/constants';
import Bugsnag from '@bugsnag/js';

describe('BankAccountsPickerComponent', () => {
  let component: BankAccountsPickerComponent;
  let fixture: ComponentFixture<BankAccountsPickerComponent>;
  let descriptionTextEl: DebugElement;
  let bankAccountService: BankAccountService;
  let bankingFlowService: BankingFlowService;
  let errorService: ErrorService;
  let offerService: OfferService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let userSessionService: UserSessionService;
  let stateRoutingService: StateRoutingService;

  let bfsContext: jasmine.Spy;
  let increaseLimitSpy: jasmine.Spy;
  let postIncreaseLimitSpy: jasmine.Spy;
  let setSelectedBankAccountSpy: jasmine.Spy;
  let setSelectedInsightsBankAccountsSpy: jasmine.Spy;
  let loadOfferSpy: jasmine.Spy;
  let currentOfferIdSpy: jasmine.Spy;
  let delegatedAccessSpy: jasmine.Spy;
  let notifyBugsnagSpy: jasmine.Spy;
  let showErrorSpy: jasmine.Spy;
  let updateInsightsPreferenceSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [BankAccountsPickerComponent, MaskPipe],
      providers: [
        BankAccountService,
        CookieService,
        ErrorService,
        MerchantService,
        OfferService,
        LoggingService,
        UtilityService,
        UserSessionService,
        StateRoutingService,
        {
          provide: Router,
          useValue:
          {
            url: AppRoutes.dashboard.set_up_bank,
            navigate: jasmine.createSpy('navigate')
          }
        },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    bankAccountService = TestBed.inject(BankAccountService);
    bankingFlowService = TestBed.inject(BankingFlowService);
    errorService = TestBed.inject(ErrorService);
    offerService = TestBed.inject(OfferService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    userSessionService = TestBed.inject(UserSessionService);
    stateRoutingService = TestBed.inject(StateRoutingService);

    fixture = TestBed.createComponent(BankAccountsPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Properties
    increaseLimitSpy = spyOnProperty(bankAccountService, 'increaseLimit').and.returnValue(false);
    currentOfferIdSpy = spyOnProperty(offerService, 'currentOfferId').and.returnValue('id');
    bfsContext = spyOnProperty(bankingFlowService, 'context').and.returnValue(BankingContext.dashboard);

    // Methods
    postIncreaseLimitSpy = spyOn(bankAccountService, 'postIncreaseLimit').and.returnValue(of(null));

    loadOfferSpy = spyOn(offerService, 'loadOffer$').and.returnValue(of(null));
    setSelectedBankAccountSpy = spyOn(bankAccountService, 'setSelectedBankAccount').and.returnValue(of(merchantDataResponseFactory.build()));
    setSelectedInsightsBankAccountsSpy = spyOn(bankAccountService, 'setSelectedInsightsBankAccounts').and.returnValue(of(merchantDataResponseFactory.build()));
    spyOnProperty(merchantService, 'merchantId').and.returnValue(merchantDataFactory.build().id);
    delegatedAccessSpy = spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
    notifyBugsnagSpy = spyOn(Bugsnag, 'notify');
    showErrorSpy = spyOn(errorService, 'show');
    updateInsightsPreferenceSpy = spyOn(userSessionService, 'updateInsightsPreference').and.returnValue(Promise.resolve(voidResponseFactory.build()));
    spyOn(loggingService, 'logCurrentPage');
    spyOn(loggingService, 'log');
    spyOn(stateRoutingService, 'performRedirect');

    descriptionTextEl = fixture.debugElement.query(By.css('p[data-ng-id="description-text"]'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should set allowMultipleSelection to true if context is insights', () => {
      bfsContext.and.returnValue(BankingContext.insights);
      component.ngOnInit();
      expect(component.allowMultipleSelection).toEqual(true);
    });

    it('should set bankAccounts', () => {
      bankAccountService.bankAccounts = ALL_BANK_ACCOUNTS;
      expect(component.bankAccounts).toEqual([]);
      component.ngOnInit();
      expect(component.bankAccounts).toEqual(ALL_BANK_ACCOUNTS);
    });
  });

  describe('bank account rendering', () => {
    it('should render multiple bank account selector if in insights context', () => {
      bfsContext.and.returnValue(BankingContext.insights);
      fixture.detectChanges();

      const multipleBankAccountSelector = fixture.debugElement.query(By.css('select#multiple-bank-accounts-selector'));
      const singleBankAccountSelector = fixture.debugElement.query(By.css('select#single-bank-account-selector'));

      expect(multipleBankAccountSelector).toBeTruthy();
      expect(singleBankAccountSelector).toBeFalsy();
    });

    it('should render single bank account selector if NOT in insights context', () => {
      fixture.detectChanges();

      const multipleBankAccountSelector = fixture.debugElement.query(By.css('select#multiple-bank-accounts-selector'));
      const singleBankAccountSelector = fixture.debugElement.query(By.css('select#single-bank-account-selector'));

      expect(singleBankAccountSelector).toBeTruthy();
      expect(multipleBankAccountSelector).toBeFalsy();
    });
  });

  describe('choose()', () => {
    describe('in delegated access mode', () => {
      beforeEach(() => {
        delegatedAccessSpy.and.returnValue(true);
      });

      it('should not set selected bank account if user is in delegated access mode', () => {
        component.choose();

        expect(setSelectedBankAccountSpy).not.toHaveBeenCalled();
      });

      it('should trigger delegated mode modal if user is in delegated access mode', () => {
        component.choose();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
      });
    });

    describe('not in delegated access mode', () => {
      it('should set processingAccount to true after choose() is called', fakeAsync(() => {
        expect(component.processingAccount).toBeFalsy();

        component.choose();
        tick();

        expect(component.processingAccount).toBeTruthy();
      }));

      describe('selectInsightsBankAccounts', () => {
        beforeEach(() => {
          bfsContext.and.returnValue(BankingContext.insights);
        });

        it('should call setSelectedInsightsBankAccounts in service on selection when context is insights', fakeAsync(() => {
          component.selectedBankAccounts = [bankAccountFactory.build()];
          component.choose();
          tick();

          expect(setSelectedInsightsBankAccountsSpy).toHaveBeenCalledTimes(1);
        }));

        it('should call setSelectedInsightsBankAccounts in service on selection', fakeAsync(() => {
          component.selectedBankAccounts = [bankAccountFactory.build()];
          component.choose();
          tick();

          expect(setSelectedInsightsBankAccountsSpy).toHaveBeenCalledTimes(1);
        }));

        it('should trigger complete event if all calls are successful', fakeAsync(() => {
          spyOn(bankingFlowService, 'triggerCompleteEvent');
          component.selectedBankAccounts = [bankAccountFactory.build()];

          component.choose();
          tick();

          expect(bankingFlowService.triggerCompleteEvent).toHaveBeenCalledTimes(1);
        }));

        it('should trigger error modal, throw bugsnag, and set processing to false if call to selectInsightsBankAccounts fails', fakeAsync(() => {
          setSelectedInsightsBankAccountsSpy.and.callThrough();
          const errors = [internalServerErrorFactory.build()];
          errors.forEach(error => {
            setSelectedInsightsBankAccountsSpy.and.returnValue(throwError(new ErrorResponse(error)));
            component.selectedBankAccounts = [bankAccountFactory.build()];

            component.choose();
            tick();

            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postSelectBankAccount);
            expect(component.processingAccount).toEqual(false);
          });
        }));

        it('should load data, trigger error modal with specific context, and set processing to false if call to setSelectInsightsBankAccounts fails with 409 conflict', fakeAsync(() => {
          setSelectedInsightsBankAccountsSpy.and.returnValue(throwError(new ErrorResponse(conflictFactory.build())));

          component.selectedBankAccounts = [ verifiedBankAccount ];

          component.choose();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postSelectBankAccount, new ErrorModalContext('CHOOSE_BANKACCT_ERROR_HEADING', [ 'CHOOSE_BANKACCT_ERROR_TEXT' ], AppRoutes.dashboard.root));
          expect(component.processingAccount).toEqual(false);
        }));
      });

      describe('selectBankAccount', () => {
        it('should call setSelectBankAccount in service on selection', fakeAsync(() => {
          component.selectedBankAccount = verifiedBankAccount;
          component.choose();
          tick();

          expect(setSelectedBankAccountSpy).toHaveBeenCalledTimes(1);
        }));

        it('should call GTMUpdate in service on selection', fakeAsync(() => {
          component.selectedBankAccount = verifiedBankAccount;
          component.choose();
          tick();

          expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(AppRoutes.dashboard.set_up_bank, 'selectBankAccount');
        }));

        it('should call loadOffer in service on selection if offer id is set in service', fakeAsync(() => {
          currentOfferIdSpy.and.returnValue('id');
          component.selectedBankAccount = verifiedBankAccount;

          component.choose();
          tick();

          expect(loadOfferSpy).toHaveBeenCalledTimes(1);
        }));

        it('should call postLimitIncrease if increaseLimit flag is set to true', fakeAsync(() => {
          increaseLimitSpy.and.returnValue(true);
          component.selectedBankAccount = verifiedBankAccount;

          component.choose();
          tick();

          expect(postIncreaseLimitSpy).toHaveBeenCalledTimes(1);
        }));

        it('should call updateInsightsPreference in service on selection when preference is not set (opt in)', fakeAsync(() => {
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);

          component.selectedBankAccount = verifiedBankAccount;
          component.insightsOptIn = true;
          component.choose();

          tick();

          expect(userSessionService.updateInsightsPreference).toHaveBeenCalledOnceWith(true);
        }));

        it('should call updateInsightsPreference in service on selection when preference is not set (opt out)', fakeAsync(() => {
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);

          component.selectedBankAccount = verifiedBankAccount;
          component.insightsOptIn = false;
          component.choose();

          tick();

          expect(userSessionService.updateInsightsPreference).toHaveBeenCalledOnceWith(false);
        }));

        it('should redirect the user agent after successfully updating the insights preference', fakeAsync(() => {
          spyOn(bankingFlowService, 'triggerCompleteEvent');
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);

          component.selectedBankAccount = verifiedBankAccount;
          component.insightsOptIn = true;
          component.choose();

          tick();

          expect(stateRoutingService.performRedirect).toHaveBeenCalledOnceWith(CONSTANTS.AUTO_LOGIN_URL);
        }));

        it('should call next after error updating the insights preference', fakeAsync(() => {
          spyOn(bankingFlowService, 'triggerCompleteEvent');
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);
          updateInsightsPreferenceSpy.and.returnValue(Promise.reject(internalServerErrorFactory.build()));

          component.selectedBankAccount = verifiedBankAccount;
          component.insightsOptIn = true;
          component.choose();

          tick();

          expect(bankingFlowService.triggerCompleteEvent).toHaveBeenCalledTimes(1);
        }));

        it('should log error updating the insights preference', fakeAsync(() => {
          spyOn(bankingFlowService, 'triggerCompleteEvent');
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);
          updateInsightsPreferenceSpy.and.returnValue(Promise.reject(internalServerErrorFactory.build()));

          component.selectedBankAccount = verifiedBankAccount;
          component.insightsOptIn = true;
          component.choose();

          tick();

          expect(loggingService.log).toHaveBeenCalledOnceWith({
            message: 'Error updating users insights preference',
            severity: LogSeverity.error
          });
        }));

        it('should not call updateInsightsPreference in service on selection when preference is set (already opted in)', fakeAsync(() => {
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(true);

          component.selectedBankAccount = verifiedBankAccount;
          component.choose();

          tick();

          expect(userSessionService.updateInsightsPreference).not.toHaveBeenCalled();
        }));

        it('should not call updateInsightsPreference in service on selection when preference is set (already opted out)', fakeAsync(() => {
          spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(false);

          component.selectedBankAccount = verifiedBankAccount;
          component.choose();

          tick();

          expect(userSessionService.updateInsightsPreference).not.toHaveBeenCalled();
        }));

        it('should trigger complete event if all calls are successful', fakeAsync(() => {
          spyOn(bankingFlowService, 'triggerCompleteEvent');
          component.selectedBankAccount = verifiedBankAccount;

          component.choose();
          tick();

          expect(bankingFlowService.triggerCompleteEvent).toHaveBeenCalledTimes(1);
        }));

        it('should not call loadOffer if currentOfferId is not set', fakeAsync(() => {
          currentOfferIdSpy.and.returnValue('');
          component.selectedBankAccount = verifiedBankAccount;

          component.choose();
          tick();

          expect(loadOfferSpy).not.toHaveBeenCalled();
        }));

        it('should trigger error modal, throw bugsnag, and set processing to false if call to setSelectBankAccount fails', fakeAsync(() => {
          const errors = [internalServerErrorFactory.build()]; // eslint-disable-line
          errors.forEach(error => {
            setSelectedBankAccountSpy.and.returnValue(throwError(new ErrorResponse(error)));
            component.selectedBankAccount = verifiedBankAccount;

            component.choose();
            tick();

            expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postSelectBankAccount);
            expect(component.processingAccount).toEqual(false);
            showErrorSpy.calls.reset();
            notifyBugsnagSpy.calls.reset();
          });
        }));

        it('should trigger error modal with specific context, and set processing to false if call to setSelectInsightsBankAccounts fails with 409 conflict', fakeAsync(() => {
          setSelectedBankAccountSpy.and.returnValue(throwError(new ErrorResponse(conflictFactory.build())));
          component.selectedBankAccount = verifiedBankAccount;

          component.choose();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postSelectBankAccount, new ErrorModalContext('CHOOSE_BANKACCT_ERROR_HEADING', [ 'CHOOSE_BANKACCT_ERROR_TEXT' ], AppRoutes.dashboard.root));
          expect(component.processingAccount).toEqual(false);
        }));

        it('should trigger error modal, throw bugsnag, and set processing to false if call to loadOffer fails', fakeAsync(() => {
          const errors = [internalServerErrorFactory.build()];
          errors.forEach(error => {
            loadOfferSpy.and.returnValue(throwError(new ErrorResponse(error)));
            component.selectedBankAccount = verifiedBankAccount;

            component.choose();
            tick();

            expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postSelectBankAccount);
            expect(component.processingAccount).toEqual(false);
            showErrorSpy.calls.reset();
            notifyBugsnagSpy.calls.reset();
          });
        }));

        it('should trigger error modal, throw bugsnag, and set processing to false if increase limit call fails', fakeAsync(() => {
          const errors = [internalServerErrorFactory.build()];
          errors.forEach(error => {
            increaseLimitSpy.and.returnValue(true);
            postIncreaseLimitSpy.and.returnValue(throwError(error));

            component.selectedBankAccount = verifiedBankAccount;

            component.choose();
            tick();

            expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postSelectBankAccount);
            expect(component.processingAccount).toBeFalsy();
            showErrorSpy.calls.reset();
            notifyBugsnagSpy.calls.reset();
          });
        }));
      });
    });
  });

  describe('addNewBank()', () => {
    it('should set BankAccountLoadingState to READY', () => {
      spyOn(bankAccountService, 'setBankAccountLoadingState');

      component.addNewBank();

      expect(bankAccountService.setBankAccountLoadingState).toHaveBeenCalledOnceWith(BankAccountLoadingState.READY);
    });
  });

  describe('description', () => {
    it('should display description from BankingFlowService if it is set', () => {
      const expectedText = 'MY_VALUE';
      spyOnProperty(bankingFlowService, 'pickerDescription').and.returnValue(expectedText);

      fixture.detectChanges();

      expect(descriptionTextEl.nativeElement.innerHTML).toEqual(expectedText);
      expect(component.description).toEqual(expectedText);
    });
  });

  describe('requiresInsightPreference', () => {
    it('should return false when user session is falsy', () => {
      spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(undefined);
      expect(component.requiresInsightPreference).toBeFalse();
    });

    it('should return true when insightsPreference is not set (null)', () => {
      spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);
      expect(component.requiresInsightPreference).toBeTrue();
    });

    it('should return false when insights preference is set (opt in)', () => {
      spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(true);
      expect(component.requiresInsightPreference).toBeFalse();
    });

    it('should return false when insights preference is set (opt out)', () => {
      spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(false);
      expect(component.requiresInsightPreference).toBeFalse();
    });
  });

  describe('isChooseDisabled', () => {
    it('should return true when account selector is not initialized', () => {
      component.processingAccount = false;

      expect(component.isChooseDisabled).toBeTrue();
    });

    it('should return true when account selector is invalid', () => {
      component.selectedBankAccount = null;
      component.processingAccount = false;

      expect(component.isChooseDisabled).toBeTrue();
    });

    it('should return true when account selector processing is true', () => {
      component.selectedBankAccount = verifiedBankAccount;
      component.processingAccount = true;

      expect(component.isChooseDisabled).toBeTrue();
    });

    it('should return false otherwise', () => {
      (component.accountSelector as any)= { invalid: false }; // eslint-disable-line @typescript-eslint/no-explicit-any
      component.processingAccount = false;
      expect(component.isChooseDisabled).toBeFalse();
    });
  });
});
