import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankFlinksComponent } from './bank-flinks.component';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { LoadingService } from 'app/services/loading.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { FLINKS } from 'app/constants';

import { CookieService } from 'ngx-cookie-service';
import { BankingFlowService, BankingStatus } from 'app/services/banking-flow.service';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { bankAccountDetailsFactory } from 'app/test-stubs/factories/bank-account-details';
import { SupportedLanguage } from 'app/models/languages';
import { StateRoutingService } from 'app/services/state-routing.service';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';

describe('BankFlinksComponent', () => {
  let component: BankFlinksComponent;
  let fixture: ComponentFixture<BankFlinksComponent>;

  let bankingFlowService: BankingFlowService;
  let configurationService: ConfigurationService;
  let errorService: ErrorService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let stateRoutingService: StateRoutingService;
  let translateService: TranslateService;

  let stubBankingContextAndStatus;
  let rootRouteSpy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule, RouterTestingModule ],
      declarations: [ BankFlinksComponent ],
      providers: [
        BankAccountService,
        BankingFlowService,
        ConfigurationService,
        CookieService,
        ErrorService,
        LoadingService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        TranslateService,
        UtilityService,
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankFlinksComponent);
    component = fixture.componentInstance;

    bankingFlowService = TestBed.inject(BankingFlowService);
    configurationService = TestBed.inject(ConfigurationService);
    errorService = TestBed.inject(ErrorService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    translateService = TestBed.inject(TranslateService);

    stubBankingContextAndStatus = (status) => bankingFlowService.setAttributes(false, status);

    rootRouteSpy = spyOn(stateRoutingService, 'rootRoute');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should show the flinks loader', () => {
      fakeAsync(() => {
        spyOn(component, 'setFlinksUrl').and.callFake(() => undefined); // Prevent its execution
        component.ngOnInit();

        expect(component.isFlinksLoaded).toBeFalsy();
      });
    });

    it('should call setFlinksUrl()', fakeAsync(() => {
        spyOn(component, 'setFlinksUrl').and.callFake(() => undefined); // Prevent its execution
        component.ngOnInit();
        tick(1); // Wait for loadingService.show()

        expect(component.setFlinksUrl).toHaveBeenCalledTimes(1);
    }));

    it('should call rootRoute from StateRoutingService', () => {
      component.ngOnInit();
      expect(stateRoutingService.rootRoute).toHaveBeenCalledTimes(1);
    });
  });

  describe('setFlinksUrl()', () => {
    beforeEach(() => {
      spyOn(loggingService, 'log');
      spyOn(loggingService, 'logCurrentPage');
      rootRouteSpy.and.returnValue(AppRoutes.application.root);
    });

    it('should set flinksUrl with supported locales',
      () => {
        const sampleFlinksUrl = 'https://zetatango-iframe.private.fin.ag/?demo=true&withTransactions=true&daysOfTransactions=Days365';

        const SUPPORTED_LOCALES = [SupportedLanguage.en, SupportedLanguage.fr];
        const langSpy = spyOnProperty(translateService, 'currentLang');

        SUPPORTED_LOCALES.forEach((locale) => {
          langSpy.and.returnValue(locale);

          component.setFlinksUrl();

          // Sample expected value:
          //
          // https://zetatango-iframe.private.fin.ag/
          //  ?demo=true
          //  &withTransactions=true
          //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
          //  %3Fflinks_route%3Dapplication
          //  %26owner%3Dline_of_credit
          //  &backgroundColor=ffffff00
          //  &foregroundColor1=000000
          //  &foregroundColor2=000000
          //  &language=en

          const expectedflinksURL = component.sanitizer
            .bypassSecurityTrustResourceUrl(
              sampleFlinksUrl +
              `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
              `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.LOC}`) +
              '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
              '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
              '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
              '&language=' + locale
          );

          expect(component.flinksUrl).toEqual(expectedflinksURL);
        });
      });

    it('should set flinksUrl with flinksRoute and owner (LOC) correctly when flinksRoute is anything other than insights',
      () => {
        const sampleFlinksUrl = 'https://zetatango-iframe.private.fin.ag/?demo=true&withTransactions=true&daysOfTransactions=Days365';
        const ROUTES = [AppRoutes.application.root, AppRoutes.dashboard.root, AppRoutes.onboarding.root, AppRoutes.error.root, AppRoutes.partner_onboarding.root,
                        AppRoutes.partner_dashboard.root, AppRoutes.cash_flow.root, AppRoutes.documents.root, AppRoutes.quickbooks.root, AppRoutes.marketing.root,
                        AppRoutes.agreement.root];

        spyOnProperty(translateService, 'currentLang').and.returnValue('en');

        ROUTES.forEach((route) => {
          rootRouteSpy.and.returnValue(route);

          component.setFlinksUrl();

          // Sample expected value:
          //
          // https://zetatango-iframe.private.fin.ag/
          //  ?demo=true
          //  &withTransactions=true
          //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
          //  %3Fflinks_route%3D{route}
          //  %26owner%3Dline_of_credit
          //  &backgroundColor=ffffff00
          //  &foregroundColor1=000000
          //  &foregroundColor2=000000
          //  &language=en

          const expectedflinksURL = component.sanitizer
            .bypassSecurityTrustResourceUrl(
              sampleFlinksUrl +
              `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
              `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.LOC}`) +
              '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
              '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
              '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
              '&language=en'
            );

          expect(component.flinksUrl).toEqual(expectedflinksURL);
        });
      });

    it('should set flinksUrl with flinksRoute and owner (CFA) correctly when flinksRoute is insights',
      () => {
        const sampleFlinksUrl = 'https://zetatango-iframe.private.fin.ag/?demo=true&withTransactions=true&daysOfTransactions=Days365';

        spyOnProperty(translateService, 'currentLang').and.returnValue('en');
        rootRouteSpy.and.returnValue(AppRoutes.insights.root);

        component.setFlinksUrl();

        // Sample expected value:
        //
        // https://zetatango-iframe.private.fin.ag/
        //  ?demo=true
        //  &withTransactions=true
        //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
        //  %3Fflinks_route%3Dinsights
        //  %26owner%3Dcash_flow_advisor
        //  &backgroundColor=ffffff00
        //  &foregroundColor1=000000
        //  &foregroundColor2=000000
        //  &language=en

        const expectedflinksURL = component.sanitizer
          .bypassSecurityTrustResourceUrl(
            sampleFlinksUrl +
            `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
            `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.CFA}`) +
            '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
            '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
            '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
            '&language=en'
          );

        expect(component.flinksUrl).toEqual(expectedflinksURL);
      });

    it ('should set blank base flinksUrl when env vars from configuration service are blank',
      () => {
        const sampleFlinksUrl = '?';

        spyOnProperty(translateService, 'currentLang').and.returnValue('en');

        spyOnProperty(configurationService, 'flinks').and.returnValue({
          flinks_url: '',
          flinks_creds: '',
          flinks_uri: '',
          flinks_opts: '',
          max_polling: '',
          poll_interval: ''
        });

        component.setFlinksUrl();

        // Sample expected value:
        //
        //  ?
        //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
        //  %3Fflinks_route%3Dapplication
        //  %26owner%3Dline_of_credit
        //  &withTransactions=false
        //  &backgroundColor=ffffff00
        //  &foregroundColor1=000000
        //  &foregroundColor2=000000
        //  &language=en

        const expectedflinksURL = component.sanitizer
          .bypassSecurityTrustResourceUrl(
            sampleFlinksUrl +
            `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
            `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.LOC}`) +
            '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
            '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
            '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
            '&language=en'
          );

        expect(component.flinksUrl).toEqual(expectedflinksURL);
      });

    it('should set flinksUrl to correctly pre-pick institution and disable back button when merchant is reconnecting bank account with a valid institution name',
      () => {
        spyOnProperty(translateService, 'currentLang').and.returnValue('en');

        const INSTITUTION_NAMES = ['ATB Financial', 'Bank of Montreal', 'Bank of Nova Scotia', 'Canadian Imperial Bank of Commerce', 'Coast Capital Savings Federal Credit Union',
          'EQ Bank', 'Fédération des Caisses Desjardins du Québec', 'FlinksCapital', 'HSBC Bank of Canada', 'Laurentian Bank of Canada', 'Meridian Credit Union', 'National Bank of Canada',
          'Royal Bank of Canada', 'Simplii Financial', 'Tangerine', 'Toronto-Dominion Bank', 'Vancouver City Savings Credit Union'];

        stubBankingContextAndStatus(BankingStatus.need_connection_refresh);
        const merchantSpy = spyOn(merchantService, 'getMerchant');

        INSTITUTION_NAMES.forEach((institution_name) => {
          const bankAccountDetails = bankAccountDetailsFactory.build({institution_name: institution_name});
          merchantSpy.and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: bankAccountDetails }));

          const institution_key = institution_name.toUpperCase().replace(/ /g,'_').replace(/-/g, '_')
          const institution_url = FLINKS.INSTITUTION_URL[institution_key];

          const sampleFlinksUrl = `https://zetatango-iframe.private.fin.ag/Credential/${institution_url}?demo=true&withTransactions=true&daysOfTransactions=Days365&backEnable=false`;

          component.setFlinksUrl();

            // Sample expected value:
            //
            // https://zetatango-iframe.private.fin.ag/
            //  Credential/FlinksCapital
            //  ?demo=true
            //  &withTransactions=true
            //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
            //  %3Fflinks_route%3Dapplication
            //  %26owner%3Dline_of_credit
            //  &backgroundColor=ffffff00
            //  &foregroundColor1=000000
            //  &foregroundColor2=000000
            //  &language=en

          const expectedflinksURL = component.sanitizer
            .bypassSecurityTrustResourceUrl(
              sampleFlinksUrl +
              `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
              `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.LOC}`) +
              '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
              '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
              '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
              '&language=en'
            );

          expect(component.flinksUrl).toEqual(expectedflinksURL);
        });

        stubBankingContextAndStatus(null);
      });

    it('should set flinksUrl to default and not pre-pick institution when merchant is reconnecting bank with invalid institution name',
      () => {
        const sampleFlinksUrl = 'https://zetatango-iframe.private.fin.ag/?demo=true&withTransactions=true&daysOfTransactions=Days365';

        spyOnProperty(translateService, 'currentLang').and.returnValue('en');

        const bankAccountDetails = bankAccountDetailsFactory.build({ institution_name: 'Unregistered Banque de l\'Interwebs' });
        spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: bankAccountDetails }));

        stubBankingContextAndStatus(BankingStatus.need_connection_refresh);

        component.setFlinksUrl();

          // Sample expected value:
          //
          // https://zetatango-iframe.private.fin.ag/
          //  ?demo=true
          //  &withTransactions=true
          //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
          //  %3Fflinks_route%3Dapplication

          //  &backgroundColor=ffffff00
          //  &foregroundColor1=000000
          //  &foregroundColor2=000000
          //  &language=en

        const expectedflinksURL = component.sanitizer
          .bypassSecurityTrustResourceUrl(
            sampleFlinksUrl +
            `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
            `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.LOC}`) +
            '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
            '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
            '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
            '&language=en'
          );

        expect(component.flinksUrl).toEqual(expectedflinksURL);

        stubBankingContextAndStatus(null);
      });

    it('should set flinksUrl to default and not pre-pick institution when merchant banking details not found',
      () => {
        const sampleFlinksUrl = 'https://zetatango-iframe.private.fin.ag/?demo=true&withTransactions=true&daysOfTransactions=Days365';

        spyOnProperty(translateService, 'currentLang').and.returnValue('en');

        spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build({selected_sales_volume_account_details: undefined }));

        stubBankingContextAndStatus(BankingStatus.need_connection_refresh);

        component.setFlinksUrl();

        // Sample expected value:
        //
        // https://zetatango-iframe.private.fin.ag/
        //  ?demo=true
        //  &withTransactions=true
        //  &redirectUrl=http%3A%2F%2Fdreampayments.zetatango.local%3A3001%2Fbank_account%2Fflinks
        //  %3Fflinks_route%3Dapplication

        //  &backgroundColor=ffffff00
        //  &foregroundColor1=000000
        //  &foregroundColor2=000000
        //  &language=en

        const expectedflinksURL = component.sanitizer
          .bypassSecurityTrustResourceUrl(
            sampleFlinksUrl +
            `&redirectUrl=` + encodeURIComponent(`${window.location.protocol}` + '//' + `${window.location.hostname}` + ':' + `${window.location.port}` + `${FLINKS.BACKEND_ROUTE}` +
            `?flinks_route=${component.flinksRoute}&owner=${FLINKS.OWNER.LOC}`) +
            '&backgroundColor=' + FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString() +
            '&foregroundColor1=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString() +
            '&foregroundColor2=' + FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString() +
            '&language=en'
          );

        expect(component.flinksUrl).toEqual(expectedflinksURL);

        stubBankingContextAndStatus(null);
      });
  });

  describe('flinksIframeLoaded()', () => {
    it('should set isFlinksLoaded true when done loading', () => {
        component.flinksIframeLoaded();

        expect(component.isFlinksLoaded).toBeTruthy();
      });
  });

  describe('flinks unsupported institution handling', () => {
    it('should raise error dialog on unsupported institution', () => {
      spyOn(errorService, 'show');

      const stepString = FLINKS.STEP.INSTITUTION_SELECTED;
      const context: ErrorModalContext = new ErrorModalContext(
        'BANK_INFO.BANK_CONNECT_ERROR_HEADER',
        [
          component.translateService.instant('BANK_INFO.BANK_CONNECT_ERROR_MESSAGE')
        ],
        AppRoutes.documents.upload_banking,
        true
      );

      FLINKS.UNSUPPORTED_INSTITUTIONS.forEach((value) => {
        const event = new MessageEvent('message', {data: {step: stepString, institution: value}});
        window.dispatchEvent(event);
      });
      expect(errorService.show).toHaveBeenCalledTimes(FLINKS.UNSUPPORTED_INSTITUTIONS.length);
      expect(errorService.show).toHaveBeenCalledWith(UiError.bankConnectError, context);
    });

    it('should not raise error dialog on supported institution', () => {
      spyOn(errorService, 'show');

      const stepString = FLINKS.STEP.INSTITUTION_SELECTED;
      const event = new MessageEvent('message', {data: {step: stepString, institution: 'RBC'}});
      window.dispatchEvent(event);

      expect(errorService.show).not.toHaveBeenCalled();
    });

    it('should not raise error dialog on null institution', () => {
      spyOn(errorService, 'show');

      const stepString = FLINKS.STEP.INSTITUTION_SELECTED;
      const event = new MessageEvent('message', {data: {step: stepString, institution: null}});
      window.dispatchEvent(event);

      expect(errorService.show).not.toHaveBeenCalled();
    });

    it('should not raise error dialog on empty message.data event', () => {
      spyOn(errorService, 'show');

      const event = new MessageEvent('message', { data: {} });
      window.dispatchEvent(event);

      expect(errorService.show).not.toHaveBeenCalled();
    });
  });

  describe ('flinks retry error handling', () => {
    it('should raise error dialog when retries reach or exceed threshold', () => {
      spyOn(errorService, 'show');

      const stepString = FLINKS.STEP.RETRY_COUNT;
      const context: ErrorModalContext = new ErrorModalContext(
        'BANK_INFO.BANK_CONNECT_ERROR_HEADER',
        [
          component.translateService.instant('BANK_INFO.BANK_CONNECT_ERROR_MESSAGE')
        ],
        AppRoutes.documents.upload_banking,
        true
      );

      [FLINKS.RETRY_LIMIT, FLINKS.RETRY_LIMIT + 1].forEach((value) => {
        const event = new MessageEvent('message', {data: {step: stepString, count: value}});
        window.dispatchEvent(event);
      });
      expect(errorService.show).toHaveBeenCalledTimes(2);
      expect(errorService.show).toHaveBeenCalledWith(UiError.bankConnectError, context);
    });

  it ('should not raise error dialog when retries below threshold', () => {
    spyOn(errorService, 'show');

    const stepString = FLINKS.STEP.RETRY_COUNT;
    [FLINKS.RETRY_LIMIT - 1, 0].forEach((value) => {
      const event = new MessageEvent('message', {data: {step: stepString, count: value}});
      window.dispatchEvent(event);
    });

    expect(errorService.show).not.toHaveBeenCalled();
    });
  });

  describe('flinks event logging', () => {
    beforeEach(() => {
      spyOn(loggingService, 'log');
      spyOn(loggingService, 'logCurrentPage');
    });

    it('should log flinks events', () => {
      const stepString = 'Test';
      const event = new MessageEvent('message', { data: {step: stepString, message: 'Test message'}});
      window.dispatchEvent(event);
      const logString = FLINKS.LOG_PREFIX + JSON.stringify(event.data);
      const expectedMessage: LogMessage = {message: logString, severity: LogSeverity.info};
      expect(loggingService.log).toHaveBeenCalledOnceWith(expectedMessage);
      const gtmString = FLINKS.LOG_PREFIX + stepString;
      expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(gtmString);
    });

    it('should log flinks institution event and include institution to GTM', () => {
      const stepString = FLINKS.STEP.INSTITUTION_SELECTED;
      const institutionName = 'CIBC';
      const event = new MessageEvent('message', { data: {step: stepString, message: 'Test message', institution: institutionName}});
      window.dispatchEvent(event);
      const gtmString = `${FLINKS.LOG_PREFIX}${stepString} : ${institutionName}`;
      expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(gtmString);
    });

    it('should log flinks redirect event and include institution to GTM', () => {
      const stepString = FLINKS.STEP.REDIRECT;
      const institutionName = 'CIBC';
      const event = new MessageEvent('message', { data: {step: stepString, message: 'Test message', institution: institutionName}});
      window.dispatchEvent(event);
      const gtmString = `${FLINKS.LOG_PREFIX}${stepString} : ${institutionName}`;
      expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(gtmString);
    });

    it('should not log non json events', () => {
      const event = new MessageEvent('message', {data: 'string'});
      window.dispatchEvent(event);
      expect(loggingService.log).toHaveBeenCalledTimes(0);
    });

    it('should not log invalid events', () => {
      const event = new MessageEvent(null);
      window.dispatchEvent(event);
      expect(loggingService.log).toHaveBeenCalledTimes(0);
    });

    it('should set hasReceivedFlinksMessage', () => {
      const event = new MessageEvent('message', {data: 'string'});
      window.dispatchEvent(event);
      expect(component.hasReceivedFlinksMessage).toBeTrue();
    });

    it('should not log json non flinks events', () => {
      const event = new MessageEvent('message', {data: {key: 'key', value: 'value'}});
      window.dispatchEvent(event);
      expect(loggingService.log).toHaveBeenCalledTimes(0);
    });

    it('should only report institution on REDIRECT step event', () => {
      const institutionName = 'RBC'
      const event = new MessageEvent('message',
        { data: {step: FLINKS.STEP.REDIRECT, loginId: 'sensitive', institution: institutionName}});
      window.dispatchEvent(event);
      const logString = FLINKS.LOG_PREFIX + JSON.stringify({ step: FLINKS.STEP.REDIRECT, institution: 'RBC'});
      const gtmString = `${FLINKS.LOG_PREFIX}${FLINKS.STEP.REDIRECT} : ${institutionName}`;
      const expectedMessage: LogMessage = {message: logString, severity: LogSeverity.info};
      expect(loggingService.log).toHaveBeenCalledOnceWith(expectedMessage);
      expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(gtmString);
    });
  });

  describe('isFlinksReady', () => {
    it('should be false initially', () => {
      expect(component.isFlinksReady).toBeFalse();
    });

    it('should be false when flinks iframe is loaded but has not received a message', () => {
      component.flinksIframeLoaded();
      expect(component.isFlinksReady).toBeFalse();
    });

    it('should be true when iframe is loaded and received first message from iframe', () => {
      component.flinksIframeLoaded();
      const event = new MessageEvent('message', {data: 'string'});
      window.dispatchEvent(event);
      expect(component.isFlinksReady).toBeTrue();
    });
  });
});
