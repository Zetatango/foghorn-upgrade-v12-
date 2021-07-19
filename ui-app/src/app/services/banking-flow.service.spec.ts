import { TestBed } from '@angular/core/testing';
import { FLINKS } from 'app/constants';
import { CookieService } from 'ngx-cookie-service';
import { ErrorService } from 'app/services/error.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BankingContext, BankingFlowService, BankingStatus } from './banking-flow.service';

describe('BankingFlowService', () => {
  let cookieService: CookieService;
  let service: BankingFlowService;

  beforeEach(() => TestBed.configureTestingModule({
    imports: [ TranslateModule.forRoot() ],
    providers: [ CookieService, ErrorService, TranslateService ]
  }));

  beforeEach(() => {
    service = TestBed.inject(BankingFlowService);
    cookieService = TestBed.inject(CookieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Event Emitters', () => {
    describe('should be able to trigger with arguments', () => {
      let timesCalled = 0;
      beforeEach(() => {
        timesCalled = 0;
      });

      it('startEvent', () => {
        service.startEvent.subscribe(
          () => timesCalled++,
          () => fail('should not fail'));

        service.triggerStartEvent();
        expect(timesCalled).toEqual(1);
      });

      it('cancelEvent', () => {
        service.cancelEvent.subscribe(
          () => timesCalled++,
          () => fail('should not fail'));

        service.triggerCancelEvent();
        expect(timesCalled).toEqual(1);
      });

      it('skipEvent', () => {
        service.skipEvent.subscribe(
          () => timesCalled++,
          () => fail('should not fail'));

        service.triggerSkipEvent();
        expect(timesCalled).toEqual(1);
      });

      it('completeEvent', () => {
        service.completeEvent.subscribe(
          () => timesCalled++,
          () => fail('should not fail'));

        service.triggerCompleteEvent();
        expect(timesCalled).toEqual(1);
      });

      it('displayManualFormEvent', () => {
        service.displayManualFormEvent.subscribe(
          () => timesCalled++,
          () => fail('should not fail'));

        service.triggerDisplayManualFormEvent();
        expect(timesCalled).toEqual(1);
      });
    });
  });

  describe('registerDescription', () => {
    it('should return SET_BANK_INSTRUCTIONS.BUSINESS_PARTNER when context is business_partner_registration regardless of status', () => {
      service.setContext(BankingContext.business_partner_registration);
      const values = Object.values(BankingStatus);
      values.forEach((val) => {
        service.setAttributes(false, val);
        expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.BUSINESS_PARTNER');
      });
    });

    it('should return SET_BANK_INSTRUCTIONS.SALES_VOLUME when status is need_sales_volume any non business partner context', () => {
      service.setContext(BankingContext.application);
      service.setAttributes(false, BankingStatus.need_sales_volume);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.SALES_VOLUME');
    });

    it('should return SET_BANK_INSTRUCTIONS.REFRESH_BANK when status is need_connection_refresh any non business partner context', () => {
      service.setAttributes(false, BankingStatus.need_connection_refresh);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.REFRESH_BANK');
    });

    it('should return SET_BANK_INSTRUCTIONS.INSIGHTS when context is insights', () => {
      service.setContext(BankingContext.insights);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.INSIGHTS');
    });

    it('should return SET_BANK_INSTRUCTIONS.BANK_ACCOUNT when context is application', () => {
      service.setContext(BankingContext.application);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.BANK_ACCOUNT');
    });

    it('should return SET_BANK_INSTRUCTIONS.BANK_ACCOUNT when context is direct_debit', () => {
      service.setContext(BankingContext.direct_debit);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.BANK_ACCOUNT');
    });

    it('should return SET_BANK_INSTRUCTIONS.BANK_ACCOUNT when context is pre_authorized_financing', () => {
      service.setContext(BankingContext.pre_authorized_financing);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.BANK_ACCOUNT');
    });

    it('should return SET_BANK_INSTRUCTIONS.BANK_ACCOUNT when context is dashboard', () => {
      service.setContext(BankingContext.dashboard);
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.BANK_ACCOUNT');
    });

    it('should return SET_BANK_INSTRUCTIONS.BANK_ACCOUNT value when context is not set', () => {
      expect(service.registerDescription).toEqual('SET_BANK_INSTRUCTIONS.BANK_ACCOUNT');
    });
  });

  describe('pickerDescription', () => {
    it('should return CHOOSE_BANKACCT_INSTRUCTIONS_BUSINESS_PARTNER when context is business_partner_registration regardless of status', () => {
      service.setContext(BankingContext.business_partner_registration);
      const values = Object.values(BankingStatus);
      values.forEach((val) => {
        service.setAttributes(false, val);
        expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS_BUSINESS_PARTNER');
      });
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS_SALES_VOLUME when status is need_sales_volume any non business partner context', () => {
      service.setAttributes(false, BankingStatus.need_sales_volume);
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS_SALES_VOLUME');
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS_INSIGHTS when context is insights', () => {
      service.setContext(BankingContext.insights);
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS_INSIGHTS');
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS when context is application', () => {
      service.setContext(BankingContext.application);
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS');
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS when context is direct_debit', () => {
      service.setContext(BankingContext.direct_debit);
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS');
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS when context is pre_authorized_financing', () => {
      service.setContext(BankingContext.pre_authorized_financing);
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS');
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS when context is dashboard', () => {
      service.setContext(BankingContext.dashboard);
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS');
    });

    it('should return CHOOSE_BANKACCT_INSTRUCTIONS value when context is not set', () => {
      expect(service.pickerDescription).toEqual('CHOOSE_BANKACCT_INSTRUCTIONS');
    });
  });

  describe('allowManualInput', () => {
    it('should return false when context is application', () => {
      service.setContext(BankingContext.application);
      expect(service.allowManualInput).toEqual(false);
    });

    it('should return false when context is direct_debit', () => {
      service.setContext(BankingContext.direct_debit);
      expect(service.allowManualInput).toEqual(false);
    });

    it('should return false when context is pre_authorized_financing', () => {
      service.setContext(BankingContext.pre_authorized_financing);
      expect(service.allowManualInput).toEqual(false);
    });

    it('should return false when context is dashboard', () => {
      service.setContext(BankingContext.dashboard);
      expect(service.allowManualInput).toEqual(false);
    });

    it('should return true when context is business_partner_registration', () => {
      service.setContext(BankingContext.business_partner_registration);
      expect(service.allowManualInput).toEqual(true);
    });

    it('should return falsy value when context is not set', () => {
      expect(service.allowManualInput).toEqual(false);
    });
  });

  describe('sourceFilter', () => {
    it('should return empty string when context is business_partner_registration regardless of status', () => {
      const values = Object.values(BankingStatus);
      values.forEach((val) => {
        service.setContext(BankingContext.business_partner_registration);
        service.setAttributes(false, val);
        expect(service.sourceFilter).toEqual('');
      });
    });

    it('should return flinks when status is need_sales_volume and any non business partner context', () => {
      service.setContext(BankingContext.dashboard);
      service.setAttributes(false, BankingStatus.need_sales_volume);
      expect(service.sourceFilter).toEqual('flinks');
    });

    it('should return flinks when context is application', () => {
      service.setContext(BankingContext.application);
      expect(service.sourceFilter).toEqual('flinks');
    });

    it('should return empty string when context is direct_debit', () => {
      service.setContext(BankingContext.direct_debit);
      expect(service.sourceFilter).toEqual('');
    });

    it('should return empty string when context is pre_authorized_financing', () => {
      service.setContext(BankingContext.pre_authorized_financing);
      expect(service.sourceFilter).toEqual('');
    });

    it('should return flinks when context is dashboard', () => {
      service.setContext(BankingContext.dashboard);
      expect(service.sourceFilter).toEqual('flinks');
    });

    it('should return empty string when context is not set', () => {
      expect(service.sourceFilter).toEqual('');
    });
  });

  describe('flinksRequestId', () => {
    it('should return falsy value if request id is not set', () => {
      expect(service.flinksRequestId).toBeFalsy();
    });

    it('should return request id as string if request id is set', () => {
      const expectedId = 'some-id';
      spyOn(cookieService, 'get').withArgs(FLINKS.COOKIE_KEY.REQUEST_ID).and.returnValue(expectedId);
      expect(service.flinksRequestId).toEqual(expectedId);
    });
  });

  describe('flinksRoute', () => {
    it('should return falsy value if flinks route is not set', () => {
      expect(service.flinksRoute).toBeFalsy();
    });

    it('should return route as string if flinks route is set', () => {
      const expectedRoute = BankingContext.dashboard;
      spyOn(cookieService, 'get').withArgs(FLINKS.COOKIE_KEY.ROUTE).and.returnValue(expectedRoute);
      expect(service.flinksRoute).toEqual(expectedRoute);
    });
  });

  describe('applicationContext', () => {
    it('should return true when context is application', () => {
      service.setContext(BankingContext.application);
      expect(service.applicationContext).toEqual(true);
    });

    it('should return false when context is not application', () => {
      service.setContext(BankingContext.dashboard);
      expect(service.applicationContext).toEqual(false);
    });

    it('should return false when context is not set', () => {
      expect(service.applicationContext).toEqual(false);
    });
  });

  describe('setAttributes', () => {
    it('should set context, skippable, and status attributes', () => {
      service.setAttributes(true, BankingStatus.need_sales_volume);
      expect(service.skippable).toEqual(true);
      expect(service.status).toEqual(BankingStatus.need_sales_volume);
    });

    it('should set skippable and status attributes to defaults if not explicitly passed', () => {
      service.setAttributes();
      expect(service.skippable).toEqual(false);
      expect(service.status).toEqual(BankingStatus.need_bank_account);
    });
  });

  describe('clearAttributes', () => {
    it('should set context and skippable attributes to null and false, respectively', () => {
      service.setContext(BankingContext.dashboard);
      service.setAttributes(true, BankingStatus.need_sales_volume);
      expect(service.context).toEqual(BankingContext.dashboard);
      expect(service.skippable).toEqual(true);
      expect(service.status).toEqual(BankingStatus.need_sales_volume);

      service.clearAttributes();
      expect(service.context).toBeNull();
      expect(service.skippable).toEqual(false);
      expect(service.status).toBeNull();
    });
  });

  describe('clearFlinksRouteCookie', () => {
    it('should clear finks_route + initial_route cookies on / and /on_boarding', () => {
      spyOn(cookieService, 'delete');

      service.clearFlinksRouteCookie();

      expect(cookieService.delete).toHaveBeenCalledTimes(2);
      expect(cookieService.delete).toHaveBeenCalledWith(FLINKS.COOKIE_KEY.ROUTE, '/');
      expect(cookieService.delete).toHaveBeenCalledWith(FLINKS.COOKIE_KEY.ROUTE, '/on_boarding');
    });
  });

  describe('clearFlinksRequestIdCookie', () => {
    it('should clear finks_route and flinks_request_id cookies', () => {
      spyOn(cookieService, 'delete');

      service.clearFlinksRequestIdCookie();

      expect(cookieService.delete).toHaveBeenCalledOnceWith(FLINKS.COOKIE_KEY.REQUEST_ID, '/');
    });
  });

  describe('isBankFlowInProgress', () => {
    it('should return true if flinksRoute equals passed BankingContext', () => {
      spyOnProperty(service, 'flinksRoute').and.returnValue(BankingContext.application);

      expect(service.isBankFlowInProgress(BankingContext.application)).toEqual(true);
    });

    it('should return false if flinksRoute does not equal passed BankingContext', () => {
      spyOnProperty(service, 'flinksRoute').and.returnValue(BankingContext.application);

      expect(service.isBankFlowInProgress(BankingContext.dashboard)).toEqual(false);
    });

    it('should return false regardless of passed context if flinksRoute is not set', () => {
      spyOnProperty(service, 'flinksRoute').and.returnValue(undefined);

      expect(service.isBankFlowInProgress(null)).toEqual(false);
    });
  });

  describe('needConnectionRefresh', () => {
    it('should return true if status is need_connection_refresh', () => {
      spyOnProperty(service, 'status').and.returnValue(BankingStatus.need_connection_refresh);

      expect(service.needConnectionRefresh).toEqual(true);
    });

    it('should return false if status is need_bank_account', () => {
      spyOnProperty(service, 'status').and.returnValue(BankingStatus.need_bank_account);

      expect(service.needConnectionRefresh).toEqual(false);
    });

    it('should return true if status is need_sales_volume', () => {
      spyOnProperty(service, 'status').and.returnValue(BankingStatus.need_sales_volume);

      expect(service.needConnectionRefresh).toEqual(false);
    });
  });

  describe('setContext', () => {
    it('should set context', () => {
      service.setContext(BankingContext.dashboard);

      expect(service.context).toEqual(BankingContext.dashboard);
    });
  });
});
