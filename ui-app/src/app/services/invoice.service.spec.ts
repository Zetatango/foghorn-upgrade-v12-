import { TestBed } from '@angular/core/testing';
import { InvoiceStatus } from 'app/models/api-entities/invoice';
import { InvoiceService } from './invoice.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantService } from 'app/services/merchant.service';
import { LoggingService } from 'app/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { invoiceResponseFactory } from 'app/test-stubs/factories/invoice';

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [CookieService, InvoiceService, MerchantService, UtilityService, LoggingService]
    });

    invoiceService = TestBed.inject(InvoiceService);
  });

  it('should be created', () => {
    expect(invoiceService).toBeTruthy();
  });

  describe('getInvoiceStatus', () => {
    it('should return INVOICE_STATUS.PAID when a paid invoice is passed in', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      expect(invoiceService.getInvoiceStatus(invoice)).toBe('INVOICE_STATUS.PAID');
    });

    it('should return INVOICE_STATUS.PARTIALLY when a partially paid invoice is passed in', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.partially });
      expect(invoiceService.getInvoiceStatus(invoice)).toBe('INVOICE_STATUS.PARTIALLY');
    });

    it('should return INVOICE_STATUS.OVERPAID when a overpaid invoice is passed in', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.overpaid});
      expect(invoiceService.getInvoiceStatus(invoice)).toBe('INVOICE_STATUS.OVERPAID');
    });

    it('should return INVOICE_STATUS.PROCESSING when a processing invoice is passed in', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.processing });
      expect(invoiceService.getInvoiceStatus(invoice)).toBe('INVOICE_STATUS.PROCESSING');
    });

    it('should return INVOICE_STATUS.SENT if unpaid and sent', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid });
      expect(invoiceService.getInvoiceStatus(invoice)).toBe('INVOICE_STATUS.SENT');
    });

    it('should return INVOICE_STATUS.UNSENT otherwise', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid, sent: false });
      expect(invoiceService.getInvoiceStatus(invoice)).toBe('INVOICE_STATUS.UNSENT');
    });
  });

  describe('getInvoiceSource', () => {
    it('should return DATA_SOURCE.QUICKBOOKS when a QuickBooks created invoice is passed in', () => {
      const invoice = invoiceResponseFactory.build({ quickbooks_invoice_id: 'qb_123' });
      expect(invoiceService.getInvoiceSource(invoice)).toBe('DATA_SOURCE.QUICKBOOKS');
    });

    it('should return null otherwise', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      expect(invoiceService.getInvoiceSource(invoice)).toBeNull();
    });
  });

  describe('hasDifferentEmails', () => {
    it('should return true when emails are set and do NOT match', () => {
      const invoice = invoiceResponseFactory.build({ sent_to: 'emailnotmatching@test.com' });
      expect(invoiceService.hasDifferentEmails(invoice)).toBe(true);
    });

    it('should return false when emails are set and match', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      expect(invoiceService.hasDifferentEmails(invoice)).toBe(false);
    });

    it('should return false when invoice receiver_entity email is null', () => {
      const invoice = invoiceResponseFactory.build({ receiver_entity: { email: null } });
      expect(invoiceService.hasDifferentEmails(invoice)).toBe(false);
    });

    it('should return false when invoice receiver_entity is null', () => {
      const invoice = invoiceResponseFactory.build({ receiver_entity: null });
      expect(invoiceService.hasDifferentEmails(invoice)).toBe(false);
    });

    it('should return false when invoice is null', () => {
      expect(invoiceService.hasDifferentEmails(null)).toBe(false);
    });
  });
});
