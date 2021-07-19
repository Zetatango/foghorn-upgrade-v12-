import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BORROWER_INVOICES } from 'app/constants';
// Models
import { emptyBorrowerInvoice, Invoice, InvoiceStatus, PAYABLE_STATES } from 'app/models/api-entities/invoice';
import { InvoiceDatatableParams, InvoiceList } from 'app/models/api-entities/invoice-list';
import { PaymentPlanState } from 'app/models/api-entities/payment_plan';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { BehaviorSubject, Observable, throwError } from 'rxjs'; 
import { tap } from 'rxjs/operators';
// Services
import { UtilityService } from './utility.service';
import { ZttResponse } from 'app/models/api-entities/response';
// import { throwError } from 'rxjs/internal/observable/throwError';
import { ErrorMessage } from 'app/models/error-response';

@Injectable({
  providedIn: 'root'
})
export class BorrowerInvoiceService {
  private invoiceId = '';
  private borrowerInvoice: Invoice;

  private borrowerInvoiceResponse: BehaviorSubject<Invoice> = new BehaviorSubject<Invoice>(null);
  private borrowerInvoices: BehaviorSubject<InvoiceList> = new BehaviorSubject(null);

  constructor(
    private http: HttpClient,
    private utilityService: UtilityService
  ) {
    this.borrowerInvoice = emptyBorrowerInvoice;
  }

  private static getBorrowerInvoiceUrl(id): string { 
    return BORROWER_INVOICES.GET_INVOICE.replace(':id', id);
  }

  // SETTERS

  private setBorrowerInvoice(response: Invoice): void {
    this.borrowerInvoice = response;
    this.borrowerInvoiceResponse.next(response);
  }

  private setBorrowerInvoices(borrowerInvoices: InvoiceList): void {
    borrowerInvoices.business_partner_invoices.forEach(invoice => {
      invoice.displayStatus = this.getInvoiceDisplayStatus(invoice);
    });
    this.borrowerInvoices.next(borrowerInvoices);
  }

  // GETTERS
  getBorrowerInvoice(): BehaviorSubject<Invoice> {
    if (this.hasActiveInvoiceSet()) {
      return this.borrowerInvoiceResponse;
    } else {
      return new BehaviorSubject(null);
    }
  }

  public getBorrowerInvoices(): BehaviorSubject<InvoiceList> {
    return this.borrowerInvoices;
  }

  // returns true if an invoice has been set - NOTE: Details may not have been received yet
  hasActiveInvoiceSet(): boolean {
    return !!this.invoiceId && this.invoiceId.length > 0;
  }

  getActiveInvoiceId(): string {
    return this.invoiceId;
  }

  saveActiveInvoiceId(invoiceId: string): void {
    this.invoiceId = invoiceId;
  }

  clearActiveInvoice(): void {
    this.borrowerInvoice = emptyBorrowerInvoice;
    this.borrowerInvoiceResponse = new BehaviorSubject<Invoice>(null);
    this.invoiceId = '';
  }

  /** Convert borrower Invoice info to SupplierInformation to be compatible with Pay a Supplier
   */
  invoiceAsSupplierInformation(): SupplierInformation {
    const invoice = this.getActiveInvoice();
    const supplierInfo: SupplierInformation = {
      name: invoice.supplier_entity.name,
      id: invoice.supplier_entity.id,
      is_business_partner: invoice.supplier_entity.is_business_partner,
      account_number: invoice.account_number,
      invoice_number: invoice.invoice_number
    };
    return supplierInfo;
  }

  getActiveInvoice(): Invoice {
    return this.borrowerInvoice;
  }

  // API CALLS

  fetchInvoice(): Observable<ZttResponse<Invoice>> {
    if (!this.hasActiveInvoiceSet()) {
      return throwError(new ErrorMessage('No invoiceId present to fetch.'));
    }

    const url = BorrowerInvoiceService.getBorrowerInvoiceUrl(this.invoiceId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<Invoice>) => this.setBorrowerInvoice(res.data))
      );
  }

  loadInvoices(merchantId: string, dtParams: InvoiceDatatableParams): Observable<ZttResponse<InvoiceList>> {
    const params = {
      id: merchantId,
      offset: dtParams.offset,
      limit: dtParams.limit
    };

    if (dtParams.order_by) params['order_by'] = dtParams.order_by;
    if (dtParams.order_direction) params['order_direction'] = dtParams.order_direction;
    if (dtParams.filter) params['filter'] = encodeURIComponent(JSON.stringify({ invoice_number: dtParams.filter }));

    const url = this.utilityService.getAugmentedUrl(BORROWER_INVOICES.GET_INVOICES_PATH, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<InvoiceList>) => this.setBorrowerInvoices(res.data))
      );
  }

  findExistingInvoice(merchantId: string, supplierId: string, invoiceNumber: string): Observable<ZttResponse<InvoiceList>> {
    const filter = {
      invoice_number: invoiceNumber,
      supplier_id: supplierId
    };

    const params = {
      id: merchantId,
      offset: 0,
      limit: 1,
      order_by: 'created_at',
      order_direction: 'desc',
      filter: encodeURIComponent(JSON.stringify(filter))
    };

    const url = this.utilityService.getAugmentedUrl(BORROWER_INVOICES.GET_INVOICES_PATH, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<InvoiceList>) => {
          if (res.data.business_partner_invoices.length > 0) {
            this.saveActiveInvoiceId(res.data.business_partner_invoices[0].id);
          }
        })
      );
  }

  getInvoiceDisplayStatus(invoice: Invoice): string {
    const isScheduled = this.isScheduled(invoice);

    if (!invoice) return 'COMMON.NOT_AVAILABLE';

    switch (invoice.status) {
      case InvoiceStatus.unpaid:
        return isScheduled ? 'BORROWER_INVOICES_COMPONENT.STATUS_SCHEDULED' : 'BORROWER_INVOICES_COMPONENT.STATUS_UNPAID';
      case InvoiceStatus.processing:
        return 'BORROWER_INVOICES_COMPONENT.STATUS_PROCESSING';
      case InvoiceStatus.partially:
        return isScheduled ? 'BORROWER_INVOICES_COMPONENT.STATUS_SCHEDULED' : 'BORROWER_INVOICES_COMPONENT.STATUS_PARTIAL';
      case InvoiceStatus.paid:
        return 'BORROWER_INVOICES_COMPONENT.STATUS_PAID';
      case InvoiceStatus.overpaid:
        return 'BORROWER_INVOICES_COMPONENT.STATUS_OVERPAID';
      default:
        return 'COMMON.NOT_AVAILABLE';
    }
  }

  getInvoiceDisplayStatusClass(invoice: Invoice): string {
    const isScheduled = this.isScheduled(invoice);

    if (!invoice) return 'no-status';

    switch (invoice.status) {
      case InvoiceStatus.unpaid:
        return isScheduled ? 'positive-status' : 'caution-status';
      case InvoiceStatus.overpaid:
        return 'caution-status';
      case InvoiceStatus.partially:
      case InvoiceStatus.processing:
      case InvoiceStatus.paid:
        return 'positive-status';
      default:
        return 'no-status';
    }
  }

  canInvoiceBePaid(invoice: Invoice): boolean {
    if (!invoice) return false;

    // for now assume no status is the same as unpaid
    if (!invoice.status) return true;

    if ((invoice.processing_amount + invoice.amount_paid) >= invoice.amount) {
      return false;
    }

    return PAYABLE_STATES.includes(invoice.status);
  }

  /**
   * Returns state of payment plan entity if it exists.
   *
   * @param invoice
   */
  getInvoicePaymentPlanState(invoice: Invoice): PaymentPlanState {
    if (!invoice || !invoice.payment_plan_entity || !invoice.payment_plan_entity.state) {
      return null;
    }
    return invoice.payment_plan_entity.state;
  }

  /**
   * An invoice is considered "scheduled" if its payment plan entity is either in pending or scheduled state.
   *
   * @param invoice
   */
  isScheduled(invoice: Invoice): boolean {
    const invoicePafStatus = this.getInvoicePaymentPlanState(invoice);
    return invoicePafStatus === PaymentPlanState.scheduled || invoicePafStatus === PaymentPlanState.pending;
  }

  loadUnpaidInvoicesCount(merchantId: string, overdue = false): Observable<ZttResponse<InvoiceList>> {
    const params = {
      id: merchantId,
      offset: 0,
      limit: 1,
      filter: encodeURIComponent(JSON.stringify({ overdue: overdue, status: [ InvoiceStatus.unpaid, InvoiceStatus.partially ] }))
    };

    const url = this.utilityService.getAugmentedUrl(BORROWER_INVOICES.GET_INVOICES_PATH, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get<ZttResponse<InvoiceList>>(url, httpOptions);
  }
}
