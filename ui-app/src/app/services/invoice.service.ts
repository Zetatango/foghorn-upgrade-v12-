import { Injectable } from '@angular/core';
import { Invoice, InvoiceStatus } from 'app/models/api-entities/invoice';

@Injectable()
export class InvoiceService {

  getInvoiceStatus(invoice: Invoice): string {
    if (invoice.status === InvoiceStatus.paid) {
      return 'INVOICE_STATUS.PAID';
    } else if (invoice.status === InvoiceStatus.partially) {
      return 'INVOICE_STATUS.PARTIALLY';
    } else if (invoice.status === InvoiceStatus.overpaid) {
      return 'INVOICE_STATUS.OVERPAID';
    } else if (invoice.status === InvoiceStatus.processing) {
      return 'INVOICE_STATUS.PROCESSING';
    }
    return invoice.sent ? 'INVOICE_STATUS.SENT' : 'INVOICE_STATUS.UNSENT';
  }

  getInvoiceSource(invoice: Invoice): string {
    return  invoice.quickbooks_invoice_id ? 'DATA_SOURCE.QUICKBOOKS' : null;
  }

  hasDifferentEmails(invoice: Invoice): boolean {
    return !!invoice && !!invoice.receiver_entity && !!invoice.receiver_entity.email && invoice.sent_to !== invoice.receiver_entity.email;
  }
}
