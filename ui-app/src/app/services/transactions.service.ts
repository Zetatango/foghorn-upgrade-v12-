import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_TRANSACTIONS } from 'app/constants';
import { PaymentDirection, Transaction } from 'app/models/api-entities/transaction';
import { TransactionList } from 'app/models/api-entities/transaction-list';
import { TransactionsRequestParameters } from 'app/models/api-entities/transactions-request-parameters';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { Translation } from 'app/models/languages';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class TransactionsService {
  private transactionsHistory: BehaviorSubject<TransactionList> = new BehaviorSubject<TransactionList>(null);

  constructor(public http: HttpClient, private utilityService: UtilityService) {}

  private setTransactionList(response: TransactionList): void {
    response.transactions = response.transactions.map(transaction => {
      transaction.description = this.getTransactionDescription(transaction);
      return transaction;
    });
    this.transactionsHistory.next(response);
  }

  getTransactionList(): BehaviorSubject<TransactionList> {
    return this.transactionsHistory;
  }

  loadTransactionList(params: TransactionsRequestParameters): Observable<ZttResponse<TransactionList>> {
    const url: string = this.utilityService.getAugmentedUrl(API_TRANSACTIONS.GET_TRANSACTIONS_PATH, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<TransactionList>) => {
          this.setTransactionList(res.data);
        })
      );
  }

  // Helpers
  isCredit(transaction: Transaction): boolean {
    return !!transaction && transaction.direction === PaymentDirection.credit;
  }

  isDebit(transaction: Transaction): boolean {
    return !!transaction && transaction.direction === PaymentDirection.debit;
  }

  isOnBehalfOf(transaction: Transaction): boolean {
    return !!transaction && transaction.direction === PaymentDirection.on_behalf_of;
  }

  isFinancing(transaction: Transaction): boolean {
    return !!transaction && !!transaction.ubl_id;
  }

  isDirectDebit(transaction: Transaction): boolean {
    return !!transaction && !!transaction.direct_payment_id;
  }

  isOffline(transaction: Transaction): boolean {
    return !!transaction && !!transaction.offline_entity_name;
  }

  hasInvoiceNumber(transaction: Transaction): boolean {
    return !!transaction && !!transaction.invoice_number;
  }

  hasSupplier(transaction: Transaction): boolean {
    return !!transaction && !!transaction.supplier_id;
  }

  isFinancingRepayment(transaction: Transaction): boolean {
    return this.isDebit(transaction) && this.isFinancing(transaction);
  }

  isFinancingDeposit(transaction: Transaction): boolean {
    return this.isCredit(transaction) && this.isFinancing(transaction);
  }

  isOfflinePayment(transaction: Transaction): boolean {
    return this.isOffline(transaction) && this.isOnBehalfOf(transaction);
  }

  getTransactionDescription(transaction: Transaction): Translation {
    if (this.isOnBehalfOf(transaction)) {
      return this.getOnBehalfOfDescription(transaction);
    } else if (this.isDebit(transaction)) {
      return this.getDebitDescription(transaction);
    } else if (this.isCredit(transaction)) {
      return this.getCreditDescription(transaction);
    } else {
      return {
        key: 'COMMON.NOT_AVAILABLE',
        values: undefined
      };
    }
  }

  /**
   * Returns localised description string for a on_behalf_of transaction.
   * Either an offline payment or a payment to a supplier.
   *
   * @param transaction
   */
  private getOnBehalfOfDescription(transaction: Transaction): Translation {
    if (this.isOfflinePayment(transaction)) {
      return {
        key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.OFFLINE_PAYMENT',
        values: {
          offlineEntityName: this.getOfflineEntityName(transaction),
          referenceNumber: this.getReferenceNumber(transaction)
        }
      };
    } else {
      if (this.hasInvoiceNumber(transaction)) {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_INVOICE_PAYMENT_TO',
          values: {
            supplierName: this.getSupplierName(transaction),
            invoiceNumber: this.getInvoiceNumber(transaction),
            referenceNumber: this.getReferenceNumber(transaction)
          }
        };
      } else {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_PAYMENT_TO',
          values: {
            supplierName: this.getSupplierName(transaction),
            referenceNumber: this.getReferenceNumber(transaction)
          }
        };
      }
    }
  }

  /**
   * Returns localised description string for a debit transaction.
   * Either direct debit payment or a financing repayment.
   *
   * @param transaction
   */
  private getDebitDescription(transaction: Transaction): Translation {
    if (this.isDirectDebit(transaction)) { // Direct debit payment
      if (this.hasInvoiceNumber(transaction)) {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.DIRECT_DEBIT_INVOICE_PAYMENT_TO',
          values: {
            supplierName: this.getSupplierName(transaction),
            invoiceNumber: this.getInvoiceNumber(transaction)
          }
        };
      } else {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.DIRECT_DEBIT_PAYMENT_TO',
          values: {
            supplierName: this.getSupplierName(transaction)
          }
        };
      }
    } else if (this.isFinancingRepayment(transaction)) { // Financing repayment
      if (this.hasInvoiceNumber(transaction)) {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_INVOICE_REPAYMENT',
          values: {
            invoiceNumber: this.getInvoiceNumber(transaction),
            referenceNumber: this.getReferenceNumber(transaction)
          }
        };
      } else {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_REPAYMENT',
          values: {
            referenceNumber: this.getReferenceNumber(transaction)
          }
        };
      }
    } else {
      return {
        key: 'COMMON.NOT_AVAILABLE',
        values: undefined
      };
    }
  }

  /**
   * Returns localised description string for a credit transaction.
   * Either a financing deposit or payment received from a merchant.
   *
   * @param transaction
   */
  private getCreditDescription(transaction: Transaction): Translation {
    if (this.isFinancingDeposit(transaction)) {
      return {
        key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_DEPOSIT',
        values: {
          referenceNumber: this.getReferenceNumber(transaction)
        }
      };
    } else {
      if (this.hasInvoiceNumber(transaction)) {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.INVOICE_PAYMENT_FROM',
          values: {
            merchantName: this.getMerchantName(transaction),
            invoiceNumber: this.getInvoiceNumber(transaction)
          }
        };
      } else {
        return {
          key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.PAYMENT_FROM',
          values: {
            merchantName: this.getMerchantName(transaction)
          }
        };
      }
    }
  }

  private getSupplierName(transaction: Transaction): string {
    return  transaction?.supplier_name || 'COMMON.NOT_AVAILABLE';
  }

  private getInvoiceNumber(transaction: Transaction): string {
    return transaction?.invoice_number || 'COMMON.NOT_AVAILABLE';
  }

  private getReferenceNumber(transaction: Transaction): string {
    return transaction?.ubl_reference_number || 'COMMON.NOT_AVAILABLE';
  }

  private getMerchantName(transaction: Transaction): string {
    return transaction?.merchant_name || 'COMMON.NOT_AVAILABLE';
  }

  private getOfflineEntityName(transaction: Transaction): string {
    return transaction?.offline_entity_name || 'COMMON.NOT_AVAILABLE';
  }
}
