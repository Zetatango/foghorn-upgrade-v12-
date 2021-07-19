import { Injectable } from '@angular/core';
import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { LendingOfflinePayout, PayoutPayee } from 'app/models/api-entities/lending-offline-payout';
import { TranslateService } from '@ngx-translate/core';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage } from "app/models/error-response";

export enum RequiredDocumentListType {
  wca = 'wca',
  invoice_financing = 'invoice_financing',
  increase_limit = 'increase_limit'
}

@Injectable({
  providedIn: 'root'
})
/**
 * The purpose of this class is to provide methods for retrieving commonly used assets across components.
 */
export class UiAssetService {
  constructor(
    private translateService: TranslateService,
  ) {}

  /**
   * Returns the label for displaying the payout.
   *
   * @param payout
   */
  getPayoutPayeeLabel(payout: LendingOfflinePayout): string {
    if (payout.label) {
      if (payout.payee === PayoutPayee.cra) {
        return this.translateService.instant('PAY_REVIEW_PAYOUT.TYPE.CRA') + '-' + payout.label;
      }
      return payout.label;
    } else {
      switch (payout.payee) {
        case PayoutPayee.cra:
          return 'PAY_REVIEW_PAYOUT.TYPE.CRA';
        case PayoutPayee.landlord:
          return 'PAY_REVIEW_PAYOUT.TYPE.LANDLORD';
        case PayoutPayee.competitor:
          return 'PAY_REVIEW_PAYOUT.TYPE.COMPETITOR';
        case PayoutPayee.key_supplier:
          return 'PAY_REVIEW_PAYOUT.TYPE.KEY_SUPPLIER';
        default:
          return 'PAY_REVIEW_PAYOUT.TYPE.OTHER';
      }
    }
  }

  getStepList(documentListType: RequiredDocumentListType, hasBankAccount: boolean): string[] {
    let doc = [];
    switch (documentListType) {
      case RequiredDocumentListType.wca :
        doc = [
          'LENDING_APPLICATION_FLOW.INFORMATION.STEPS.SELECT_YOUR_FINANCING',
          'LENDING_APPLICATION_FLOW.INFORMATION.STEPS.UPLOAD_THE_MOST'
        ];
        if (!hasBankAccount) {
          doc.splice(1, 0, 'LENDING_APPLICATION_FLOW.INFORMATION.STEPS.CONNECT_YOUR_BANK');
        }
        break;
      case RequiredDocumentListType.invoice_financing:
        if (!hasBankAccount) {
          doc.push('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.CONNECT_YOUR_BANK');
        }
        doc.push('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.PROVIDE_YOUR_INVOICE');
        doc.push('LENDING_APPLICATION_FLOW.INFORMATION.STEPS.SELECT_YOUR_PAYMENT');
        break;
    }
    return doc;
  }

  getLocalizedLoanTermUnit(unit: TermUnit): string {
    let localizationKey = 'PAY_TERMS.LABEL_';

    switch ( unit ) {
      case (TermUnit.one_time): localizationKey += 'ONE_TIME'; break;
      case (TermUnit.days): localizationKey += 'DAYS'; break;
      case (TermUnit.weeks): localizationKey += 'WEEKS'; break;
      case (TermUnit.months): localizationKey += 'MONTHS'; break;
      default: {
        const e = new ErrorMessage(`Unsupported loan term unit ${unit} from lending application.`);
        Bugsnag.notify(e);

        return '';
      }
    }

    return localizationKey;
  }

  getPayReviewFormulaLocalizationKey(repSched: RepaymentSchedule): string {
    return this.getAugmentedRepaymentLocalizationKey(repSched, 'PAY_REVIEW_LENDING_FORMULA.');
  }

  getRepaymentScheduleLocalizationKey(repSched: RepaymentSchedule): string {
    return this.getAugmentedRepaymentLocalizationKey(repSched, 'PAY_REVIEW.');
  }

  getPafReviewFormulaLocalizationKey(repSched: RepaymentSchedule): string {
    return this.getAugmentedRepaymentLocalizationKey(repSched, 'PAY_REVIEW_LENDING_FORMULA.');
  }

  getPaymentFrequencyLabel(repSched: RepaymentSchedule): string {
    switch ( repSched ) {
      case (RepaymentSchedule.daily): return 'INVOICE.PAYMENT_FREQUENCY_DAILY';
      case (RepaymentSchedule.weekly): return 'INVOICE.PAYMENT_FREQUENCY_WEEKLY';
      case (RepaymentSchedule.bi_weekly): return 'INVOICE.PAYMENT_FREQUENCY_BIWEEKLY';
      default: {
          const e = new ErrorMessage(`Unsupported repayment schedule ${repSched} from Select lending component.`);
          Bugsnag.notify(e);

          return '';
        }
    }
  }

  private getAugmentedRepaymentLocalizationKey(repSched: RepaymentSchedule, baseTranslationKey: string): string {
    switch ( repSched ) {
      case (RepaymentSchedule.daily): return baseTranslationKey + 'DAILY';
      case (RepaymentSchedule.weekly): return baseTranslationKey + 'WEEKLY';
      case (RepaymentSchedule.bi_weekly): return baseTranslationKey + 'BI_WEEKLY';
      case (RepaymentSchedule.monthly): return baseTranslationKey + 'MONTHLY';
      default: {
          const e = new ErrorMessage(`Unsupported repayment schedule ${repSched} from lending application.`);
          Bugsnag.notify(e);

          return '';
        }
    }
  }
}
