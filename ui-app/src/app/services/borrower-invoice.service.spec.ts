import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BORROWER_INVOICES } from 'app/constants';
import { Invoice, InvoiceStatus, PAYABLE_STATES } from 'app/models/api-entities/invoice';
import { PaymentPlanState } from 'app/models/api-entities/payment_plan';
// Services
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { UtilityService } from 'app/services/utility.service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
// Models
import {
  blankBorrowerInvoice,
  borrowerInvoice,
  invoiceListResponseFactory,
  invoiceResponseFactory,
  receivedBorrowerInvoices,
  receivedMatchingBorrowerInvoices,
  receivedNoMatchingBorrowerInvoices
} from 'app/test-stubs/factories/invoice';
import {
  invoiceDtParamsFactory,
  sampleInvoiceDatatableParams,
  sampleInvoiceDatatableParamsWithoutFilter
} from 'app/test-stubs/factories/invoices-list';
import { paymentPlanFactory } from 'app/test-stubs/factories/payment_plan';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

describe('BorrowerInvoiceService', () => {
  let borrowerInvoiceService: BorrowerInvoiceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ BorrowerInvoiceService, UtilityService, CookieService ]
    });
    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    const service: BorrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);
    expect(service).toBeTruthy();
  });

  it('should initially not have invoice set', () => {
    expect(borrowerInvoiceService.hasActiveInvoiceSet()).toEqual(false);
  });

  describe('When invoice is set but not yet fetched', () => {
    beforeEach(() => {
      borrowerInvoiceService.saveActiveInvoiceId(borrowerInvoice.id);
    });

    it('hasActiveInvoiceSet should be true', () => {
      expect(borrowerInvoiceService.hasActiveInvoiceSet()).toBeTruthy();
    });

    it('getActiveInvoice returns blank invoice before fetch completes', () => {
      expect(borrowerInvoiceService.getActiveInvoice()).toEqual(blankBorrowerInvoice);
    });

    it('fetchInvoice will call the rails api as expected to get invoice', () => {
      borrowerInvoiceService.fetchInvoice()
        .pipe(take(1))
        .subscribe(
          () => expect(borrowerInvoiceService.getActiveInvoice()).toEqual(borrowerInvoice),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = BORROWER_INVOICES.GET_INVOICE.replace(':id', borrowerInvoice.id);
      const invoiceRequest = httpMock.expectOne(url);
      expect(invoiceRequest.request.method).toEqual('GET');
      invoiceRequest.flush({status: 'SUCCESS', data: borrowerInvoice});
    });
  });

  describe('When invoice is set', () => {
    beforeEach(() => {
      borrowerInvoiceService.saveActiveInvoiceId(borrowerInvoice.id);
      // fetch and save the invoice the initial time
      borrowerInvoiceService.fetchInvoice()
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Prevented this test to fail silently: ' + err)
        });

      const url = BORROWER_INVOICES.GET_INVOICE.replace(':id', borrowerInvoice.id);
      const invoiceRequest = httpMock.expectOne(url);
      invoiceRequest.flush({status: 'SUCCESS', data: borrowerInvoice});
    });

    it('getActiveInvoice returns expected invoice info when fetched', () => {
      borrowerInvoiceService.fetchInvoice()
        .pipe(take(1))
        .subscribe(
          () => expect(borrowerInvoiceService.getActiveInvoice()).toEqual(borrowerInvoice),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = BORROWER_INVOICES.GET_INVOICE.replace(':id', borrowerInvoice.id);
      const invoiceRequest = httpMock.expectOne(url);
      expect(invoiceRequest.request.method).toEqual('GET');
      invoiceRequest.flush({status: 'SUCCESS', data: borrowerInvoice});
    });
  });

  describe('When call to lookup invoice fails', () => {
    beforeEach(() => {
      borrowerInvoiceService.saveActiveInvoiceId(borrowerInvoice.id);
    });

    it('should pass down an error if fetchInvoice returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        borrowerInvoiceService.fetchInvoice()
          .pipe(take(1))
          .subscribe(
            () => fail('Should not succeed:'),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = BORROWER_INVOICES.GET_INVOICE.replace(':id', borrowerInvoice.id);
        const invRequest = httpMock.expectOne(url);
        expect(invRequest.request.method).toEqual('GET');
        invRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('When invoice is not set', () => {
    it('should throw an error when fetchInvoice is called', () => {
      borrowerInvoiceService.fetchInvoice()
        .subscribe({
          error: (err) => expect(err.message).toEqual('No invoiceId present to fetch.')
        });
    });

    it('hasActiveInvoiceSet should not be true', () => {
      expect(borrowerInvoiceService.hasActiveInvoiceSet()).toBeFalsy();
    });

    it('getActiveInvoice returns blank invoice', () => {
      expect(borrowerInvoiceService.getActiveInvoice()).toEqual(blankBorrowerInvoice);
    });
  });

  describe('invoiceAsSupplierInformation()', () => {
    it('can be created from an existing invoice', () => {
      spyOn(borrowerInvoiceService, 'getActiveInvoice')
        .and.returnValue(borrowerInvoice);

      const res = borrowerInvoiceService.invoiceAsSupplierInformation();
      expect(res.account_number).toBe(borrowerInvoice.account_number);
      expect(res.name).toBe(borrowerInvoice.supplier_entity.name);
      expect(res.id).toBe(borrowerInvoice.supplier_entity.id);
      expect(res.invoice_number).toBe(borrowerInvoice.invoice_number);
    });

    it('can be created from an empty invoice', () => {
      spyOn(borrowerInvoiceService, 'getActiveInvoice')
        .and.returnValue(blankBorrowerInvoice);

      const res = borrowerInvoiceService.invoiceAsSupplierInformation();
      expect(res.account_number).toBe('');
      expect(res.name).toBe('');
      expect(res.id).toBe('');
      expect(res.invoice_number).toBe('');
    });
  });

  describe('clearActiveInvoice()', () => {
    it('clears invoice data', () => {
      borrowerInvoiceService.clearActiveInvoice();
      const res = borrowerInvoiceService.getActiveInvoice();
      expect(res).toEqual(blankBorrowerInvoice);
    });

    it('resets hasActiveInvoiceSet state', () => {
      borrowerInvoiceService.clearActiveInvoice();
      expect(borrowerInvoiceService.hasActiveInvoiceSet()).toBeFalsy();
    });

    it('resets invoiceId', () => {
      borrowerInvoiceService.clearActiveInvoice();
      expect(borrowerInvoiceService.getActiveInvoiceId()).toEqual('');
    });

    it('resets behavior subject', () => {
      borrowerInvoiceService.clearActiveInvoice();
      const res = borrowerInvoiceService.getBorrowerInvoice();
      expect(res).toEqual(new BehaviorSubject<Invoice>(null));
    });
  });

  describe('getBorrowerInvoice()', () => {
    it('returns response when active invoice is set', () => {
      borrowerInvoiceService.saveActiveInvoiceId(borrowerInvoice.id);
      borrowerInvoiceService.fetchInvoice()
        .pipe(take(1))
        .subscribe(
          () => {
            expect(borrowerInvoiceService.getActiveInvoice()).toEqual(borrowerInvoice);
            borrowerInvoiceService.getBorrowerInvoice().pipe(take(1)).subscribe((value) => expect(value).toEqual(borrowerInvoice));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = BORROWER_INVOICES.GET_INVOICE.replace(':id', borrowerInvoice.id);
      const invoiceRequest = httpMock.expectOne(url);
      invoiceRequest.flush({status: 'SUCCESS', data: borrowerInvoice});
    });

    it('returns null when no invoice is set', () => {
      expect(borrowerInvoiceService.getBorrowerInvoice().getValue()).toBe(null);
    });
  });

  // ----------------------------------------------------------------------- loadInvoices()
  describe('loadInvoices()', () => {
    const filter = encodeURIComponent(JSON.stringify({ invoice_number: 'dundee' }));
    const basicQueryParams = '?id=m_guid&offset=0&limit=25';
    const queryParamsWithoutFilter = '?id=m_guid&offset=0&limit=25&order_by=amount&order_direction=asc';
    const queryParams = queryParamsWithoutFilter + '&filter=' + filter;

    it('should be able to get borrower invoices with minimal API params', () => {
      const params = invoiceDtParamsFactory.build();
      borrowerInvoiceService.loadInvoices('m_guid', params)
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(receivedBorrowerInvoices));

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + basicQueryParams;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusTest: 'OK', data: receivedBorrowerInvoices });
    });

    it('should be able to get borrower invoices', () => {
      borrowerInvoiceService.loadInvoices('m_guid', sampleInvoiceDatatableParams)
        .pipe(take(1))
        .subscribe((res) => {
          const invoices = borrowerInvoiceService.getBorrowerInvoices().getValue().business_partner_invoices;
          invoices.forEach(invoice => expect(invoice.displayStatus).toBeDefined());
          expect(res.data).toEqual(receivedBorrowerInvoices);
        });

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusTest: 'OK', data: receivedBorrowerInvoices });
    });

    it('should be able to get borrower invoices if no filter provided', () => {
      borrowerInvoiceService.loadInvoices('m_guid', sampleInvoiceDatatableParamsWithoutFilter)
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(receivedBorrowerInvoices));

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParamsWithoutFilter;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusTest: 'OK', data: receivedBorrowerInvoices });
    });

    it('borrowerInvoices behaviour subject should initially be empty', () => {
      expect(borrowerInvoiceService.getBorrowerInvoices())
        .toEqual(new BehaviorSubject(null));
    });

    it('should set borrowerInvoices behaviour subject when successfully getting borrower invoices', () => {
      borrowerInvoiceService.loadInvoices('m_guid', sampleInvoiceDatatableParams)
        .pipe(take(1))
        .subscribe(() => {
          borrowerInvoiceService.getBorrowerInvoices()
            .pipe(take(1))
            .subscribe((value) => expect(value).toEqual(receivedBorrowerInvoices));
        });

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusText: 'OK', data: receivedBorrowerInvoices });
    });

    it('should pass down an error to caller if getting borrower invoices returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        borrowerInvoiceService.loadInvoices('m_guid', sampleInvoiceDatatableParams)
          .pipe(take(1))
          .subscribe(
            () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
            (err) => expect(err.status).toEqual(httpError.status));

        const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
        const borrowerInvoiceRequest = httpMock.expectOne(url);
        expect(borrowerInvoiceRequest.request.method).toEqual('GET');
        borrowerInvoiceRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  }); // describe - loadInvoices

  describe('findExistingInvoice()', () => {
    const supplierId = 'su_guid';
    const invoiceNumber = '321';

    const filter = encodeURIComponent(JSON.stringify({ invoice_number: invoiceNumber, supplier_id: supplierId }));
    const queryParams = '?id=m_guid&offset=0&limit=1&order_by=created_at&order_direction=desc&filter=' + filter;

    it('should be able to get borrower invoice', () => {
      borrowerInvoiceService.findExistingInvoice('m_guid', supplierId, invoiceNumber)
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(receivedMatchingBorrowerInvoices));

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusTest: 'OK', data: receivedMatchingBorrowerInvoices });
    });

    it('active invoice id should initially be empty', () => {
      expect(borrowerInvoiceService.getActiveInvoiceId())
        .toEqual('');
    });

    it('should set active invoice id when successfully getting borrower invoice', () => {
      borrowerInvoiceService.findExistingInvoice('m_guid', supplierId, invoiceNumber)
        .pipe(take(1))
        .subscribe(() => {
          expect(borrowerInvoiceService.getActiveInvoiceId()).toEqual(receivedMatchingBorrowerInvoices.business_partner_invoices[0].id);
        });

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusText: 'OK', data: receivedMatchingBorrowerInvoices });
    });

    it('should not set active invoice id when successfully getting no matching borrower invoice', () => {
      borrowerInvoiceService.findExistingInvoice('m_guid', supplierId, invoiceNumber)
        .pipe(take(1))
        .subscribe(() => {
          expect(borrowerInvoiceService.getActiveInvoiceId()).toEqual('');
        });

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const borrowerInvoiceRequest = httpMock.expectOne(url);
      expect(borrowerInvoiceRequest.request.method).toEqual('GET');
      borrowerInvoiceRequest.flush({ status: 200, statusText: 'OK', data: receivedNoMatchingBorrowerInvoices });
    });

    it('should pass down an error to caller if getting borrower invoices returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        borrowerInvoiceService.findExistingInvoice('m_guid', supplierId, invoiceNumber)
          .pipe(take(1))
          .subscribe(
            () => fail('Prevented this unit test from failing silently'),
            (err) => expect(err.status).toEqual(httpError.status));

        const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
        const borrowerInvoiceRequest = httpMock.expectOne(url);
        expect(borrowerInvoiceRequest.request.method).toEqual('GET');
        borrowerInvoiceRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getInvoiceDisplayStatusClass', () => {
    it('should return "positive-status" class for unpaid invoices if it is scheduled', () => {
      const expectedStatus = 'positive-status';
      const pp = paymentPlanFactory.build({ state: PaymentPlanState.pending });
      const unpaidInvoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid, payment_plan_entity: pp });

      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(unpaidInvoice)).toBe(expectedStatus);
    });

    it('should return "caution-status" class for unpaid invoices if it is not scheduled', () => {
      const expectedStatus = 'caution-status';
      const unpaidInvoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid });

      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(unpaidInvoice)).toBe(expectedStatus);
    });

    it('should return "caution-status" class for overpaid invoices', () => {
      const expectedStatus = 'caution-status';
      const overpaidInvoice = invoiceResponseFactory.build({ status: InvoiceStatus.overpaid });

      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(overpaidInvoice)).toBe(expectedStatus);
    });

    it('should return "positive-status" class for processing, partially paid, & paid invoices', () => {
      const expectedStatus = 'positive-status';
      const processingInvoice = invoiceResponseFactory.build({ status: InvoiceStatus.processing });
      const partiallyInvoice = invoiceResponseFactory.build({ status: InvoiceStatus.partially });
      const paidInvoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });

      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(processingInvoice)).toBe(expectedStatus);
      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(partiallyInvoice)).toBe(expectedStatus);
      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(paidInvoice)).toBe(expectedStatus);
    });

    it('should return "no-status" class for unpaid for null & null status invoices', () => {
      const expectedStatus = 'no-status';
      const nullInvoice = null;
      const nullStatusInvoice = invoiceResponseFactory.build({ status: null });

      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(nullInvoice)).toBe(expectedStatus);
      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass(nullStatusInvoice)).toBe(expectedStatus);
    });
  });

  describe('getInvoiceDisplayStatus', () => {
    it('should return "COMMON.NOT_AVAILABLE" for null invoice', () => {
      const expectedStatus = 'COMMON.NOT_AVAILABLE';
      const invoice = null;

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return "COMMON.NOT_AVAILABLE" for null invoice status', () => {
      const expectedStatus = 'COMMON.NOT_AVAILABLE';
      const invoice = invoiceResponseFactory.build({ status: null });

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return processing translation key for processing invoice', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_PROCESSING';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.processing });

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return processing translation key for processing invoice even if invoice is scheduled', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_PROCESSING';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.processing });
      spyOn(borrowerInvoiceService, 'isScheduled').and.returnValue(true);

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return paid translation key for paid invoice', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_PAID';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return paid translation key for paid invoice even if invoice is scheduled', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_PAID';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      spyOn(borrowerInvoiceService, 'isScheduled').and.returnValue(true);

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return overpaid translation key for overpaid invoice', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_OVERPAID';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.overpaid });

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return overpaid translation key for overpaid invoice even if invoice is scheduled', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_OVERPAID';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.overpaid });
      spyOn(borrowerInvoiceService, 'isScheduled').and.returnValue(true);

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return scheduled if invoice is scheduled and is in unpaid or partially status', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_SCHEDULED';
      const statuses = [ InvoiceStatus.unpaid, InvoiceStatus.partially ];
      spyOn(borrowerInvoiceService, 'isScheduled').and.returnValue(true);

      statuses.forEach((status) => {
        const invoice = invoiceResponseFactory.build({ status: status });
        expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
      });
    });

    it('should return unpaid translation key for unpaid invoice if invoice is NOT scheduled', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_UNPAID';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid });
      spyOn(borrowerInvoiceService, 'isScheduled').and.returnValue(false);

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });

    it('should return partial translation key for partially paid invoice if invoice is NOT scheduled', () => {
      const expectedStatus = 'BORROWER_INVOICES_COMPONENT.STATUS_PARTIAL';
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.partially });
      spyOn(borrowerInvoiceService, 'isScheduled').and.returnValue(false);

      expect(borrowerInvoiceService.getInvoiceDisplayStatus(invoice)).toBe(expectedStatus);
    });
  });

  describe('canInvoiceBePaid', () => {
    it('should return false if invoice is null', () => {
      const invoice = null;
      expect(borrowerInvoiceService.canInvoiceBePaid(invoice)).toBeFalse();
    });

    it('should return true if invoice\'s status is null', () => {
      const invoice = invoiceResponseFactory.build({ status: null });
      expect(borrowerInvoiceService.canInvoiceBePaid(invoice)).toBeTrue();
    });

    it('should return false if invoice\'s status is fully paid but still processing', () => {
      const invoice = invoiceResponseFactory.build({
        status: InvoiceStatus.processing,
        amount: 500,
        amount_paid: 0,
        processing_amount: 500
      });
      expect(borrowerInvoiceService.canInvoiceBePaid(invoice)).toBeFalse();
    });

    it('should return true if invoice\'s status is processing but only paid partially', () => {
      const invoice = invoiceResponseFactory.build({
        status: InvoiceStatus.processing,
        amount: 500,
        amount_paid: 0,
        processing_amount: 300
      });
      expect(borrowerInvoiceService.canInvoiceBePaid(invoice)).toBeTrue();
    });

    it('should return true if invoice is in payable state', () => {
      PAYABLE_STATES.forEach((state) => {
        const invoice = invoiceResponseFactory.build({ status: state });
        expect(borrowerInvoiceService.canInvoiceBePaid(invoice)).toBeTrue();
      });
    });
  });

  describe('getInvoicePaymentPlanState', () => {
    it('returns payment plan state if payment plan entity exists and it has a state', () => {
      Object.values(PaymentPlanState).forEach((state) => {
        const pp = paymentPlanFactory.build({ state: state });
        const invoice = invoiceResponseFactory.build({ payment_plan_entity: pp });
        expect(borrowerInvoiceService.getInvoicePaymentPlanState(invoice)).toEqual(state);
      });
    });

    it('returns null if invoice is null', () => {
      expect(borrowerInvoiceService.getInvoicePaymentPlanState(null)).toEqual(null);
    });

    it('returns null if payment plan entity is not present', () => {
      const invoice = invoiceResponseFactory.build({ payment_plan_entity: null });
      expect(borrowerInvoiceService.getInvoicePaymentPlanState(invoice)).toEqual(null);
    });

    it('returns null if payment plan entity state is not present', () => {
      const pp = paymentPlanFactory.build({ state: null });
      const invoice = invoiceResponseFactory.build({ payment_plan_entity: pp });
      expect(borrowerInvoiceService.getInvoicePaymentPlanState(invoice)).toEqual(null);
    });
  });

  describe('isScheduled', () => {
    it('returns true if invoice payment plan is in pending or scheduled state', () => {
      const SCHEDULED_STATES = [ PaymentPlanState.scheduled, PaymentPlanState.pending ];

      SCHEDULED_STATES.forEach((state) => {
        const pp = paymentPlanFactory.build({ state: state });
        const invoice = invoiceResponseFactory.build({ payment_plan_entity: pp });
        expect(borrowerInvoiceService.isScheduled(invoice)).toBeTrue();
      });
    });

    it('returns false if invoice payment plan is in any other state', () => {
      const NOT_SCHEDULED_STATES = Object.values(PaymentPlanState).filter((state) =>
        state !== PaymentPlanState.pending && state !== PaymentPlanState.scheduled);

      NOT_SCHEDULED_STATES.forEach((state) => {
        const pp = paymentPlanFactory.build({ state: state });
        const invoice = invoiceResponseFactory.build({ payment_plan_entity: pp });
        expect(borrowerInvoiceService.isScheduled(invoice)).toBeFalse();
      });
    });

    it('returns false if invoice payment plan is null', () => {
      const invoice = invoiceResponseFactory.build({ payment_plan_entity: null });
      expect(borrowerInvoiceService.isScheduled(invoice)).toBeFalse();
    });

    it('returns false if invoice payment plan state is null', () => {
      const pp = paymentPlanFactory.build({ state: null });
      const invoice = invoiceResponseFactory.build({ payment_plan_entity: pp });
      expect(borrowerInvoiceService.isScheduled(invoice)).toBeFalse();
    });
  });

  describe('loadUnpaidInvoicesCount()', () => {
    it('should be able to get unpaid borrower invoices', () => {
      const params = {
        id: 'm_guid',
        offset: 0,
        limit: 1,
        filter: encodeURIComponent(JSON.stringify({
          overdue: false,
          status: [ InvoiceStatus.unpaid, InvoiceStatus.partially ]
        }))
      };

      const queryParams = `?id=${params.id}&offset=${params.offset}&limit=${params.limit}&filter=${params.filter}`;
      borrowerInvoiceService.loadUnpaidInvoicesCount('m_guid')
        .pipe(take(1))
        .subscribe((res) => expect(res).toEqual(invoiceListResponseFactory.build()));

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(invoiceListResponseFactory.build());
    });

    it('should be able to get ovedue + unpaid borrower invoices', () => {
      const params = {
        id: 'm_guid',
        offset: 0,
        limit: 1,
        filter: encodeURIComponent(JSON.stringify({
          overdue: true,
          status: [ InvoiceStatus.unpaid, InvoiceStatus.partially ]
        }))
      };

      const queryParams = `?id=${params.id}&offset=${params.offset}&limit=${params.limit}&filter=${params.filter}`;
      borrowerInvoiceService.loadUnpaidInvoicesCount('m_guid', true)
        .pipe(take(1))
        .subscribe((res) => expect(res).toEqual(invoiceListResponseFactory.build()));

      const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(invoiceListResponseFactory.build());
    });

    it('should return expected errors when an HTTP error is recevied', () => {
      const params = {
        id: 'm_guid',
        offset: 0,
        limit: 1,
        filter: encodeURIComponent(JSON.stringify({
          overdue: true,
          status: [ InvoiceStatus.unpaid, InvoiceStatus.partially ]
        }))
      };

      const queryParams = `?id=${params.id}&offset=${params.offset}&limit=${params.limit}&filter=${params.filter}`;
      HTTP_ERRORS.forEach(httpError => {
        borrowerInvoiceService.loadUnpaidInvoicesCount('m_guid', true)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = BORROWER_INVOICES.GET_INVOICES_PATH + queryParams;
        const req = httpMock.expectOne(url);
        expect(req.request.method).toEqual('GET');
        req.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });
});
