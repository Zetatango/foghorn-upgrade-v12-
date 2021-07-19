import { TestBed, waitForAsync } from '@angular/core/testing';
import { RequiredDocumentListType, UiAssetService } from './ui-asset.service';

import { UtilityService } from 'app/services/utility.service';
import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { LendingOfflinePayout, PayoutPayee } from 'app/models/api-entities/lending-offline-payout';
import { lendingPayoutFactory } from 'app/test-stubs/factories/lending-offline-payout';
import { TranslateModule } from '@ngx-translate/core';
import Bugsnag from '@bugsnag/js';

describe('UiAssetService', () => {
  let service: UiAssetService;

  let notifyBugsnagSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, TranslateModule.forRoot() ],
      providers: [
        CookieService,
        UiAssetService,
        UtilityService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    service = TestBed.inject(UiAssetService);
    notifyBugsnagSpy = spyOn(Bugsnag, 'notify');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPayoutPayeeLabel()', () => {
    let mockPayout: LendingOfflinePayout;

    describe('if label is set', () => {
      it('should return label with translated prefix if payee is CRA', () => {
        const mockLabel = 'MyLabel';
        const mockPrefix = 'PAY_REVIEW_PAYOUT.TYPE.CRA-';
        mockPayout = lendingPayoutFactory.build({ label: mockLabel, payee: PayoutPayee.cra });
        expect(service.getPayoutPayeeLabel(mockPayout)).toEqual(mockPrefix + mockLabel);
      });

      it('should return label if payee is not CRA', () => {
        const mockLabel = 'MyLabel';
        const payees = Object.values(PayoutPayee).filter((payee) => payee !== PayoutPayee.cra);
        payees.forEach((type) => {
          mockPayout = lendingPayoutFactory.build({ label: mockLabel, payee: type });
          expect(service.getPayoutPayeeLabel(mockPayout)).toEqual(mockLabel);
        });
      });
    });

    describe('if label is not set', () => {
      it('should return CRA label for payout type CRA', () => {
        mockPayout = lendingPayoutFactory.build({ payee: PayoutPayee.cra });
        expect(service.getPayoutPayeeLabel(mockPayout)).toEqual('PAY_REVIEW_PAYOUT.TYPE.CRA');
      });

      it('should return Landlord label for payout type Landlord', () => {
        mockPayout = lendingPayoutFactory.build({ payee: PayoutPayee.landlord });
        expect(service.getPayoutPayeeLabel(mockPayout)).toEqual('PAY_REVIEW_PAYOUT.TYPE.LANDLORD');
      });

      it('should return Competitor label for payout type Competitor', () => {
        mockPayout = lendingPayoutFactory.build({ payee: PayoutPayee.competitor });
        expect(service.getPayoutPayeeLabel(mockPayout)).toEqual('PAY_REVIEW_PAYOUT.TYPE.COMPETITOR');
      });

      it('should return Key supplier label for payout type Key supplier', () => {
        mockPayout = lendingPayoutFactory.build({ payee: PayoutPayee.key_supplier });
        expect(service.getPayoutPayeeLabel(mockPayout)).toEqual('PAY_REVIEW_PAYOUT.TYPE.KEY_SUPPLIER');
      });

      it('should return Other label for null or undefined payout type', () => {
        const values = [ null, undefined ];

        values.forEach((val) => {
          mockPayout = lendingPayoutFactory.build({ payee: val });
          expect(service.getPayoutPayeeLabel(mockPayout)).toEqual('PAY_REVIEW_PAYOUT.TYPE.OTHER');
        });
      });
    });

  });

  describe('getStepList', () => {
    it('should return the number of items (3) in the list is wca', () => {
      const stepList = service.getStepList(RequiredDocumentListType.wca, false);
      expect(stepList.length).toEqual(3);
      expect(stepList[0]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.SELECT_YOUR_FINANCING');
      expect(stepList[1]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.CONNECT_YOUR_BANK');
      expect(stepList[2]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.UPLOAD_THE_MOST');
    });

    it('should return the number of items (3) in the list is IF', () => {
      const stepList = service.getStepList(RequiredDocumentListType.invoice_financing, false);
      expect(stepList.length).toEqual(3);
      expect(stepList[0]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.CONNECT_YOUR_BANK');
      expect(stepList[1]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.PROVIDE_YOUR_INVOICE');
      expect(stepList[2]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.SELECT_YOUR_PAYMENT');
    });

    it('should return the number of items (2) in the list is wca and connected bank account', () => {
      const stepList = service.getStepList(RequiredDocumentListType.wca, true);
      expect(stepList.length).toEqual(2);
      expect(stepList[0]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.SELECT_YOUR_FINANCING');
      expect(stepList[1]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.UPLOAD_THE_MOST');
    });

    it('should return the number of items (2) in the list is IF and connected bank account', () => {
      const stepList = service.getStepList(RequiredDocumentListType.invoice_financing, true);
      expect(stepList.length).toEqual(2);
      expect(stepList[0]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.PROVIDE_YOUR_INVOICE');
      expect(stepList[1]).toEqual('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.SELECT_YOUR_PAYMENT');
    });

    it('should return an empty list when null is passed', () => {
      expect(service.getStepList(null, false).length).toEqual(0);
    });
  });

  describe('getLocalizedLoanTermUnit', () => {
    it('should return expected plural translation key', () => {
      Object.values(TermUnit).forEach(termUnit => {
        const label = service.getLocalizedLoanTermUnit(termUnit);

        switch (termUnit) {
          case (TermUnit.one_time): expect(label).toBe('PAY_TERMS.LABEL_ONE_TIME'); break;
          case (TermUnit.days): expect(label).toBe('PAY_TERMS.LABEL_DAYS'); break;
          case (TermUnit.weeks): expect(label).toBe('PAY_TERMS.LABEL_WEEKS'); break;
          case (TermUnit.months): expect(label).toBe('PAY_TERMS.LABEL_MONTHS'); break;
          default: {
            expect(label).toBe('');
            expect(Bugsnag.notify).toHaveBeenCalledTimes(1);

            fail('Unexpected `termUnit` value: ' + termUnit);
          }
        }
      });

    });

    it('should return an empty string and trigger a bugsnag when term unit is invalid', () => {
      const INVALID_TERM_UNITS: TermUnit[] = [ undefined, null, 'year' as TermUnit, '' as TermUnit ];
      INVALID_TERM_UNITS.forEach(termUnit => {
        const label = service.getLocalizedLoanTermUnit(termUnit);
        expect(label).toBe('');
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);

        notifyBugsnagSpy.calls.reset();
      });
    });
  });

  describe('getPayReviewFormulaLocalizationKey', () => {
    it('should return appropriate translation key for each repayment schedule when getPayReviewFormulaLocalizationKey is called', () => {
      Object.values(RepaymentSchedule)
        .filter((repSched: RepaymentSchedule) => repSched !== RepaymentSchedule.none)
        .forEach((repSched: RepaymentSchedule) => {
          const localizationKey = service.getPayReviewFormulaLocalizationKey(repSched);
          switch (repSched) {
            case (RepaymentSchedule.daily): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.DAILY'); break;
            case (RepaymentSchedule.weekly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.WEEKLY'); break;
            case (RepaymentSchedule.bi_weekly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.BI_WEEKLY'); break;
            case (RepaymentSchedule.monthly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.MONTHLY'); break;
            default: {
              expect(localizationKey).toBe('');

              expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
              fail('Unexpected `repSched` value: ' + repSched);
            }
          }
        }); // forEach
    });

    it('should return an empty string and trigger a bugsnag when repayment schedule is not valid', () => {
      const unsupportedUnit = 'year' as RepaymentSchedule;
      expect(service.getPayReviewFormulaLocalizationKey(unsupportedUnit)).toEqual('');
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPafReviewFormulaLocalizationKey', () => {
    it('should return appropriate translation key for each repayment schedule when getPafReviewFormulaLocalizationKey is called', () => {
      Object.values(RepaymentSchedule)
        .filter((repSched: RepaymentSchedule) => repSched !== RepaymentSchedule.none)
        .forEach((repSched: RepaymentSchedule) => {
          const localizationKey = service.getPafReviewFormulaLocalizationKey(repSched);
          switch (repSched) {
            case (RepaymentSchedule.daily): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.DAILY'); break;
            case (RepaymentSchedule.weekly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.WEEKLY'); break;
            case (RepaymentSchedule.bi_weekly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.BI_WEEKLY'); break;
            case (RepaymentSchedule.monthly): expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.MONTHLY'); break;
            default: {
              expect(localizationKey).toBe('');
              expect(Bugsnag.notify).toHaveBeenCalledTimes(1);

              fail('Unexpected `repSched` value: ' + repSched);
            }
          }
        });
    });
  });

  describe('getRepaymentScheduleLocalizationKey for repayment schedule', () => {
    it('should return appropriate translation key for each repayment schedule when getRepaymentScheduleLocalizationKey is called', () => {
      Object.values(RepaymentSchedule)
        .filter((repSched: RepaymentSchedule) => repSched !== RepaymentSchedule.none)
        .forEach((repSched: RepaymentSchedule) => {
          const localizationKey = service.getRepaymentScheduleLocalizationKey(repSched);
          switch (repSched) {
            case (RepaymentSchedule.daily): expect(localizationKey).toBe('PAY_REVIEW.DAILY'); break;
            case (RepaymentSchedule.weekly): expect(localizationKey).toBe('PAY_REVIEW.WEEKLY'); break;
            case (RepaymentSchedule.bi_weekly): expect(localizationKey).toBe('PAY_REVIEW.BI_WEEKLY'); break;
            case (RepaymentSchedule.monthly): expect(localizationKey).toBe('PAY_REVIEW.MONTHLY'); break;
            default: {
              expect(localizationKey).toBe('');
              expect(Bugsnag.notify).toHaveBeenCalledTimes(1);

              fail('Unexpected `repSched` value: ' + repSched);
            }
          }
        }); // forEach
    });

    it('should return an empty string and trigger a bugsnag when repayment schedule is not valid', () => {
      const INVALID_REPAYMENT_SCHEDULE: RepaymentSchedule[] = [ undefined, null, 'year' as RepaymentSchedule, '' as RepaymentSchedule ];
      INVALID_REPAYMENT_SCHEDULE.forEach(repSched => {
        const repSchedLocalizationKey = service.getRepaymentScheduleLocalizationKey(repSched);
        expect(repSchedLocalizationKey).toEqual('');
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);

        notifyBugsnagSpy.calls.reset();
      });
    });
  });

  describe('getPaymentFrequencyLabel', () => {
    it('should return appropriate translation key for each repayment schedule when getPaymentFrequencyLabel is called', () => {
      Object.values(RepaymentSchedule)
        .filter((repSched: RepaymentSchedule) => repSched !== RepaymentSchedule.none)
        .forEach((repSched: RepaymentSchedule) => {
          const localizationKey = service.getPaymentFrequencyLabel(repSched);
          switch (repSched) {
            case (RepaymentSchedule.daily): expect(localizationKey).toBe('INVOICE.PAYMENT_FREQUENCY_DAILY'); break;
            case (RepaymentSchedule.weekly): expect(localizationKey).toBe('INVOICE.PAYMENT_FREQUENCY_WEEKLY'); break;
            case (RepaymentSchedule.bi_weekly): expect(localizationKey).toBe('INVOICE.PAYMENT_FREQUENCY_BIWEEKLY'); break;
            case(RepaymentSchedule.monthly): break;
            default: {
              expect(localizationKey).toBe('');
              expect(Bugsnag.notify).toHaveBeenCalledTimes(1);

              fail('Unexpected `repSched` value: ' + repSched);
            }
          }
        }); // forEach
    });
  });
});
