import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SetUpBankComponent } from './set-up-bank.component';
import { ConnectBankManuallyComponent } from 'app/components/containers/connect-bank-manually/connect-bank-manually.component';
import { UiError } from 'app/models/ui-error';
import { BankAccountLoadingState, BankAccountService } from 'app/services/bank-account.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { OfferService } from 'app/services/offer.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { bankAccountFactory, verifiedBankAccount, bankAccountResponseFactory } from 'app/test-stubs/factories/bank-account';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  flinksRequestResponseFactory,
  flinksRequestErrorFactory,
  flinksRequestStateDone,
  flinksRequestStatePending,
  flinksRequestStateUnkown
} from 'app/test-stubs/factories/flinks-request-state';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { RouterTestingModule } from '@angular/router/testing';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from 'app/models/error-response';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { AppRoutes } from 'app/models/routes';
import { AppLoadService } from 'app/services/app-load.service';
import { BankAccountOwner } from 'app/models/bank-account';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { MockProvider } from 'ng-mocks';

describe('SetUpBankComponent', () => {
  let appLoadService: AppLoadService;
  let bankAccountService: BankAccountService;
  let bankingFlowService: BankingFlowService;
  let configurationService: ConfigurationService;
  let errorService: ErrorService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;

  let component: SetUpBankComponent;
  let fixture: ComponentFixture<SetUpBankComponent>;

  let loadUserDataSpy: jasmine.Spy;

  const flinksId = 'flinks-query-6utghW2hP8bv5zoh';
  const flinksPolling = { max_polling: 22, poll_interval: 1000 };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [
        SetUpBankComponent,
        ConnectBankManuallyComponent
      ],
      providers: [
        MockProvider(AppLoadService),
        OfferService,
        MerchantService,
        ErrorService,
        StateRoutingService,
        BankAccountService,
        UserSessionService,
        LoggingService,
        UtilityService,
        CookieService,
        LendingApplicationsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetUpBankComponent);
    component = fixture.componentInstance;

    appLoadService = TestBed.inject(AppLoadService);
    bankAccountService = TestBed.inject(BankAccountService);
    bankingFlowService = TestBed.inject(BankingFlowService);
    configurationService = TestBed.inject(ConfigurationService);
    errorService = TestBed.inject(ErrorService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);

    bankAccountService.owner = new BankAccountOwner(null);

    spyOn(bankingFlowService, 'setContext');
    loadUserDataSpy = spyOn(appLoadService,'loadUserData').and.returnValue(of(null));
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('includeStepper', () => {
    it('returns true when context is set and applicationContext in BankingFlowService returns true',
      () => {
        spyOnProperty(bankingFlowService, 'context').and.returnValue(BankingContext.application);
        spyOnProperty(bankingFlowService, 'applicationContext').and.returnValue(true);
        expect(component.includeStepper).toEqual(true);
      });

    it('returns false when context is set and applicationContext from BankingFlowService returns false',
      () => {
        spyOnProperty(bankingFlowService, 'context').and.returnValue(BankingContext.application);
        spyOnProperty(bankingFlowService, 'applicationContext').and.returnValue(false);
        expect(component.includeStepper).toEqual(false);
      });
  });

  describe('includeAvailableFinancing', () => {
    it('returns true when applicationContext from BankingFlowService returns true',
      () => {
        spyOnProperty(bankingFlowService, 'context').and.returnValue(BankingContext.application);
        spyOnProperty(bankingFlowService, 'applicationContext').and.returnValue(true);
        expect(component.includeAvailableFinancing).toEqual(true);
      });

    it('returns false when applicationContext from BankingFlowService returns false',
      () => {
        spyOnProperty(bankingFlowService, 'context').and.returnValue(BankingContext.application);
        spyOnProperty(bankingFlowService, 'applicationContext').and.returnValue(false);
        expect(component.includeAvailableFinancing).toEqual(false);
      });
  });

  describe('flinksRequestId', () => {
    it('should return the value set in BankingFlowService', () => {
      const expectedId = 'some-id';
      spyOnProperty(bankingFlowService, 'flinksRequestId').and.returnValue(expectedId);
      expect(component.flinksRequestId).toEqual(expectedId);
    });
  });

  describe('ngOnInit()', () => {
    it('should call clearFlinksRouteCookie from BankingFlowService',
      () => {
        spyOn(bankingFlowService, 'clearFlinksRouteCookie');

        fixture.detectChanges();

        expect(bankingFlowService.clearFlinksRouteCookie).toHaveBeenCalledTimes(1);
      });

    it('should start flinksFlow', () => {
      spyOn(component, 'startFlinksFlow');

      fixture.detectChanges();

      expect(component.startFlinksFlow).toHaveBeenCalledTimes(1);
    });

    it('should set bank account loading state to MANUAL when displayManualFormEvent is triggered form BankingFlowService',
      () => {
        spyOn(bankingFlowService, 'triggerDisplayManualFormEvent').and.callThrough();

        fixture.detectChanges();
        expect(bankingFlowService.triggerDisplayManualFormEvent).toHaveBeenCalledTimes(0);
        bankingFlowService.triggerDisplayManualFormEvent();

        expect(bankingFlowService.triggerDisplayManualFormEvent).toHaveBeenCalledTimes(1);
        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.MANUAL);
      });

    it('should set context on init', () => {
      component.ngOnInit();
      expect(bankingFlowService.setContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('startFlinksFlow()', () => {
    it('should call determineBankAccountsState', () => {
      spyOnProperty(configurationService, 'flinks').and.returnValue(flinksPolling);
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
      spyOn(component, 'determineBankAccountsState');
      bankAccountService.bankAccounts = [verifiedBankAccount];

      component.startFlinksFlow();

      expect(component.determineBankAccountsState).toHaveBeenCalledTimes(1);
    });
  }); // describe - startFlinksFlow()

  describe('setFlinksPollingConditions()', () => {
    it('should set flinks maxPolling and pollInterval ', () => {
      spyOnProperty(configurationService, 'flinks').and.returnValue(flinksPolling);
      component.setFlinksPollingConditions();

      expect(component.pollInterval).toEqual(flinksPolling.poll_interval);
      expect(component.maxPolling).toEqual(flinksPolling.max_polling);
    });
  }); // describe - setFlinksPollingConditions()

  describe('determineBankAccountsState()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load bank accounts', fakeAsync(() => {
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
      bankAccountService.bankAccounts = [verifiedBankAccount];

      component.determineBankAccountsState();
      tick();

      expect(bankAccountService.loadBankAccounts).toHaveBeenCalledTimes(1);
    }));

    it('should show modal, log bugsnag, and set bank accounts loading state to READY when loadBankAccounts encounters error', fakeAsync(() => {
      spyOn(Bugsnag, 'notify');
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(throwError({ message: 'Internal Server Error' }));
      spyOn(errorService, 'show');

      component.determineBankAccountsState();
      tick();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
    }));

    // Needed to deal with untyped err in err?.message
    it('should show modal, log bugsnag, and set bank accounts loading state to READY when loadBankAccounts encounters error with null message', fakeAsync(() => {
      spyOn(Bugsnag, 'notify');
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(throwError(null));
      spyOn(errorService, 'show');

      component.determineBankAccountsState();
      tick();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
    }));

    it('should set bank account loading state to LOADED if no flinks id but merchant does not have selected bank account' +
      'and there are bank accounts',
      fakeAsync(() => {
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(false);
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        bankAccountService.bankAccounts = [bankAccountFactory.build()];

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.LOADED);
      }));

    it('should set bank account loading state to LOADED if no flinks id but merchant requires sales volume' +
      'and there are bank accounts',
      fakeAsync(() => {
        spyOn(merchantService, 'merchantSalesVolumeRequired').and.returnValue(true);
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        bankAccountService.bankAccounts = [bankAccountFactory.build()];

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.LOADED);
      }));

    it('should set bank account loading state to LOADING if flinks id is present,', fakeAsync(() => {
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
      spyOn(component, 'waitForFlinks').and.returnValue(null); // prevent call
      spyOnProperty(bankingFlowService, 'flinksRequestId').and.returnValue(flinksId);

      component.determineBankAccountsState();
      tick();

      expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.LOADING);
    }));

    it('should set bank account loading state to READY if merchant doesnt have selected_bank_account, bank_connection_required is true and flinks id is null',
      fakeAsync(() => {
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(false);
        spyOn(bankAccountService.owner, 'bankConnectionRequired').and.returnValue(true);
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOnProperty(bankingFlowService, 'flinksRequestId').and.returnValue(null);

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
      }));

    describe('should set bank account loading state to READY if bank_connection_required is true and flinks id is null', () => {
      beforeEach(() => {
        spyOnProperty(bankingFlowService, 'flinksRequestId').and.returnValue(null);
        spyOn(bankAccountService.owner, 'bankConnectionRequired').and.returnValue(true);
      });

      it('when there are bank accounts',() => {
        const res = bankAccountResponseFactory.build();
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(res));
        bankAccountService.bankAccounts = res.data;
        component.determineBankAccountsState();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
      });

      it('when merchant has selected bank account', fakeAsync(() => {
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(true);

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
      }));

      it('when merchant has insights required', fakeAsync(() => {
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOn(bankAccountService.owner, 'areInsightsBankAccountsChosen').and.returnValue(false);

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
      }));

      it('when merchant has sv required', fakeAsync(() => {
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOn(merchantService, 'merchantSalesVolumeRequired').and.returnValue(true);

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
      }));
    });

    it('should set bank account loading state to READY if merchant has selected_bank_account, bank_connection_required is true and flinks id is null',
      fakeAsync(() => {
        spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(true);
        spyOn(bankAccountService.owner, 'bankConnectionRequired').and.returnValue(true);
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOnProperty(bankingFlowService, 'flinksRequestId').and.returnValue(null);

        component.determineBankAccountsState();
        tick();

        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
      }));

    it('should call triggerCompleteEvent if bank account & sales volume already selected for the merchant', () => {
      const res = bankAccountResponseFactory.build();
      spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(true);
      spyOn(merchantService, 'merchantSalesVolumeRequired').and.returnValue(false);
      spyOn(bankAccountService.owner, 'bankConnectionRequired').and.returnValue(false);
      spyOn(bankAccountService.owner, 'hasCompletedCYB').and.returnValue(true);
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(res));
      spyOn(bankingFlowService, 'triggerCompleteEvent');

      component.determineBankAccountsState();
      expect(bankingFlowService.triggerCompleteEvent).toHaveBeenCalledTimes(1);
    });

    it('should call triggerCompleteEvent if bank account & sales volume already selected for the merchant', () => {
      const res = bankAccountResponseFactory.build();
      spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(true);
      spyOn(merchantService, 'merchantSalesVolumeRequired').and.returnValue(false);
      spyOn(bankAccountService.owner, 'bankConnectionRequired').and.returnValue(false);
      spyOn(bankAccountService.owner, 'hasCompletedCYB').and.returnValue(false);
      spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(res));
      spyOn(bankAccountService, 'setBankAccountLoadingState');

      component.determineBankAccountsState();
      expect(bankAccountService.setBankAccountLoadingState).toHaveBeenCalledOnceWith(BankAccountLoadingState.READY);
    });
  }); // describe - determineBankAccountsState()

  describe('waitForFlinks()', () => {
    const accounts = [verifiedBankAccount];

    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('when polling is successful', () => {
      let pollFlinksSpy: jasmine.Spy;

      beforeEach(() => {
        pollFlinksSpy = spyOn(bankAccountService, 'pollFlinks');
      });

      it('should load bank accounts and merchant when polling is done ', fakeAsync(() => {
        bankAccountService.bankAccounts = accounts;
        pollFlinksSpy.and.returnValue(of(flinksRequestStateDone));
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));


        component.waitForFlinks();
        tick();

        expect(bankAccountService.loadBankAccounts).toHaveBeenCalledTimes(1);
        expect(appLoadService.loadUserData).toHaveBeenCalledTimes(1);
      }));

      it('should poll flinks until max attempts reached when polling returns pending', fakeAsync(() => {
        component.pollInterval = flinksPolling.poll_interval;
        component.maxPolling = flinksPolling.max_polling;

        const timespan = component.pollInterval * component.maxPolling; // mock polling timespan

        pollFlinksSpy.and.returnValue(of(flinksRequestStatePending));

        component.waitForFlinks();
        tick(timespan);

        expect(bankAccountService.pollFlinks).toHaveBeenCalledTimes(flinksPolling.max_polling);
        expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.FAILED);
      }));

      it('should not poll flinks or load bank accounts when polling returns 200 with unknown data', fakeAsync(() => {
        spyOn(bankingFlowService, 'clearFlinksRequestIdCookie');
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOn(bankAccountService, 'setBankAccountLoadingState');
        pollFlinksSpy.and.returnValue(of(flinksRequestStateUnkown));

        component.waitForFlinks();
        tick();

        expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
        expect(bankAccountService.setBankAccountLoadingState).toHaveBeenCalledTimes(1);
      }));

      it('should not poll flinks or load bank accounts when polling returns 200 with null', fakeAsync(() => {
        spyOn(bankingFlowService, 'clearFlinksRequestIdCookie');
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOn(bankAccountService, 'setBankAccountLoadingState');
        pollFlinksSpy.and.returnValue(of(null));

        component.waitForFlinks();
        tick();

        expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
        expect(bankAccountService.setBankAccountLoadingState).toHaveBeenCalledTimes(1);
      }));

      it('should call clearFlinksRequestIdCookie from BankingFlowService when poll flinks attempts max out', fakeAsync(() => {
        spyOn(bankingFlowService, 'clearFlinksRequestIdCookie');

        component.pollInterval = flinksPolling.poll_interval;
        component.maxPolling = flinksPolling.max_polling;

        const timespan = component.pollInterval * component.maxPolling; // mock polling timespan

        pollFlinksSpy.and.returnValue(of(flinksRequestStatePending));

        component.waitForFlinks();
        tick(timespan);

        expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
      }));


      it('should log error when poll flinks attempts max out', fakeAsync(() => {
        spyOn(loggingService, 'log');

        component.pollInterval = flinksPolling.poll_interval;
        component.maxPolling = flinksPolling.max_polling;

        const timespan = component.pollInterval * component.maxPolling; // mock polling timespan

        pollFlinksSpy.and.returnValue(of(flinksRequestStatePending));

        component.waitForFlinks();
        tick(timespan);

        const logString = 'Flinks max polling attempts reached';
        const expectedMessage: LogMessage = { message: logString, severity: LogSeverity.error };
        expect(loggingService.log).toHaveBeenCalledOnceWith(expectedMessage);
      }));

      describe('when polling is done', () => {
        beforeEach(() => {
          bankAccountService.bankAccounts = accounts;
          pollFlinksSpy.and.returnValue(of(flinksRequestStateDone));
        });

        it('should call clearFlinksRequestIdCookie from BankingFlowService', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));

          spyOn(bankingFlowService, 'clearFlinksRequestIdCookie');

          component.waitForFlinks();
          tick(flinksPolling.poll_interval);

          expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
        }));

        it('should show error modal and set BankAccountLoadingState to READY when no bank accounts were found', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));

          bankAccountService.bankAccounts = [];
          spyOn(errorService, 'show');

          component.waitForFlinks();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
          expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY);
        }));

        it('should call triggerCompleteEvent in BankingFlowService if merchant has a selected bank account AND SV AND insights', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
          spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(true);
          spyOn(bankAccountService.owner, 'areInsightsBankAccountsChosen').and.returnValue(false);
          spyOn(merchantService, 'merchantSalesVolumeRequired').and.returnValue(false);

          spyOn(bankingFlowService, 'triggerCompleteEvent');

          component.waitForFlinks();
          tick();

          expect(bankingFlowService.triggerCompleteEvent).toHaveBeenCalledTimes(1);
        }));

        it('should set BankAccountLoadingState to LOADED if merchant does not have a selected bank account', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
          spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(false);

          component.waitForFlinks();
          tick();

          expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.LOADED);
        }));

        it('should set BankAccountLoadingState to LOADED if merchant does not have a sales volume account', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
          spyOn(merchantService, 'merchantSalesVolumeRequired').and.returnValue(false);

          component.waitForFlinks();
          tick();

          expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.LOADED);
        }));

        it('should set BankAccountLoadingState to LOADED if context is insights and merchant has insights required', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
          spyOn(bankAccountService.owner, 'areInsightsBankAccountsChosen').and.returnValue(false);
          spyOnProperty(bankingFlowService, 'context').and.returnValue(BankingContext.insights);

          component.waitForFlinks();
          tick();

          expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.LOADED);
        }));

        it('should show error modal and log bugsnag when call to loadBankAccounts fails', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(throwError(internalServerErrorFactory.build()));
          spyOn(errorService, 'show');
          spyOn(Bugsnag, 'notify');

          component.waitForFlinks();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        }));

        it('should show error modal and log bugsnag when call to loadBankAccounts fails with error with null message', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(throwError(null));
          spyOn(errorService, 'show');
          spyOn(Bugsnag, 'notify');

          component.waitForFlinks();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        }));

        it('should show error modal when call to loadUserData fails', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
          loadUserDataSpy.and.returnValue(throwError(internalServerErrorFactory.build()));
          spyOn(errorService, 'show');
          spyOn(Bugsnag, 'notify');

          component.waitForFlinks();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        }));

        it('should show error modal when call to loadUserData fails with error with null message', fakeAsync(() => {
          spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
          loadUserDataSpy.and.returnValue(throwError(null));
          spyOn(errorService, 'show');
          spyOn(Bugsnag, 'notify');

          component.waitForFlinks();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadBankAccounts);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        }));
      }); // describe - 'when polling is successful'
    });

    describe('when polling fails', () => {
      let pollFlinksSpy: jasmine.Spy;
      const merchant = merchantDataFactory.build();

      beforeEach(() => {
        spyOn(bankAccountService, 'loadBankAccounts').and.returnValue(of(null));
        spyOn(bankingFlowService, 'clearFlinksRequestIdCookie');
        spyOnProperty(merchantService, 'merchantId').and.returnValue(merchant.id);
        spyOn(errorService, 'show');
        spyOn(Bugsnag, 'notify');
        spyOn(loggingService, 'log');

        pollFlinksSpy = spyOn(bankAccountService, 'pollFlinks');
      });

      describe('when pollFlinks returns error with status 422, code 40015', () => {
        const expectedMessage = 'Credentials supplied do not match existing sales volume account on reconnect';
        const error = flinksRequestErrorFactory.build({ status: 422, code: 40015, message: 'Credentials supplied do not match existing sales volume account on reconnect' });
        const errorResponse = new ErrorResponse(flinksRequestResponseFactory.build({ status: 422, error: error, message: expectedMessage }));

        beforeEach(() => {

          pollFlinksSpy.and.returnValue(throwError(errorResponse));
        });

        it('should show error modal with FlinksAccountType message', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.flinksAccountReconnectMismatch);
        }));

        it('should log error with error response status + message', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(loggingService.log).toHaveBeenCalledOnceWith(errorResponse);
        }));

        it('should set BankAccountLoadingState to READY', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.READY); // so user can try again
        }));

        it('should clear flinks request ID', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
        }));
      });

      describe('when pollFlinks returns error with status 422, any code besides 40015', () => {
        const expectedMessage = 'Bad bank account type - account cannot be used';
        const error = flinksRequestErrorFactory.build({ status: 422, code: 40010, message: 'Account type is not accepted' });
        const errorResponse = new ErrorResponse(flinksRequestResponseFactory.build({ status: 422, error: error, message: expectedMessage }));

        beforeEach(() => {
          pollFlinksSpy.and.returnValue(throwError(errorResponse));
        });

        it('should show error modal with BankConnectError message', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          const context: ErrorModalContext = new ErrorModalContext(
            'BANK_INFO.BANK_CONNECT_ERROR_HEADER',
            [
              'BANK_INFO.BANK_CONNECT_ERROR_MESSAGE'
            ],
            AppRoutes.documents.upload_banking,
            true
          );

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.bankConnectError, context);
        }));

        it('should log error with error response status + message', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(loggingService.log).toHaveBeenCalledOnceWith(errorResponse);
        }));

        it('should clear flinks request ID', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
        }));
      });

      describe('when pollFlinks returns any other error', () => {
        const expectedMessage = 'Unknown error';

        beforeEach(() => {
          pollFlinksSpy.and.returnValue(throwError(new ErrorResponse(flinksRequestResponseFactory.build({ status: 500, message: expectedMessage }))));
        });

        it('should notify Bugsnag', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        }));

        it('should set BankAccountLoadingState to FAILED', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(component.bankAccountLoadingState).toEqual(BankAccountLoadingState.FAILED);
        }));

        it('should clear flinks request ID', fakeAsync(() => {
          component.waitForFlinks();
          tick();

          expect(bankingFlowService.clearFlinksRequestIdCookie).toHaveBeenCalledTimes(1);
        }));
      });
    });
  }); // describe - waitForFlinks()

  describe('Display methods', () => {

    // ---------------------------------------------------------------------- displayLoading()
    describe('displayLoading()', () => {
      it('should be the only one to return true if bankAccountLoadingState is LOADING', () => {
        component.bankAccountLoadingState = BankAccountLoadingState.LOADING;

        expect(component.displayLoading()).toEqual(true);
        expect(component.displayFlinks()).toEqual(false);
        expect(component.displayPicker()).toEqual(false);
        expect(component.displayManualEntry()).toEqual(false);
        expect(component.displayError()).toEqual(false);
      });
    }); // describe - displayLoading()

    // ---------------------------------------------------------------------- displayPicker()
    describe('displayPicker()', () => {
      it('should be the only one to return true if bankAccountLoadingState is LOADED', () => {
        component.bankAccountLoadingState = BankAccountLoadingState.LOADED;

        expect(component.displayLoading()).toEqual(false);
        expect(component.displayFlinks()).toEqual(false);
        expect(component.displayPicker()).toEqual(true);
        expect(component.displayManualEntry()).toEqual(false);
        expect(component.displayError()).toEqual(false);
      });
    }); // describe - displayPicker()

    // ---------------------------------------------------------------------- displayFlinks()
    describe('displayFlinks()', () => {
      it('should be the only one to return true if bankAccountLoadingState is READY', () => {
        component.bankAccountLoadingState = BankAccountLoadingState.READY;

        expect(component.displayLoading()).toEqual(false);
        expect(component.displayFlinks()).toEqual(true);
        expect(component.displayPicker()).toEqual(false);
        expect(component.displayManualEntry()).toEqual(false);
        expect(component.displayError()).toEqual(false);
      });
    }); // describe - displayFlinks()

    // ---------------------------------------------------------------------- displayError()
    describe('displayError()', () => {
      it('should be the only one to return true if bankAccountLoadingState is FAILED', () => {
        component.bankAccountLoadingState = BankAccountLoadingState.FAILED;

        expect(component.displayLoading()).toEqual(false);
        expect(component.displayFlinks()).toEqual(false);
        expect(component.displayPicker()).toEqual(false);
        expect(component.displayManualEntry()).toEqual(false);
        expect(component.displayError()).toEqual(true);
      });
    }); // describe - displayError()

    // ---------------------------------------------------------------------- displayManualEntry()
    describe('displayLoading()', () => {
      it('should be the only one to return true if bankAccountLoadingState is MANUAL', () => {
        component.bankAccountLoadingState = BankAccountLoadingState.MANUAL;

        expect(component.displayLoading()).toEqual(false);
        expect(component.displayFlinks()).toEqual(false);
        expect(component.displayPicker()).toEqual(false);
        expect(component.displayManualEntry()).toEqual(true);
        expect(component.displayError()).toEqual(false);
      });
    }); // describe - displayManualEntry()

  }); // describe - 'Display methods'

}); // describe - SetUpBankComponent
