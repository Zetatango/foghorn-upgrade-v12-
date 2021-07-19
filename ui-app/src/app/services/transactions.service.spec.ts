import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaymentDirection } from 'app/models/api-entities/transaction';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { OrderDirection } from 'app/models/datatables';
import { TransactionsService } from './transactions.service';
import { UtilityService } from './utility.service';
import { API_TRANSACTIONS } from 'app/constants';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { receivedTransactionList, transactionFactory } from 'app/test-stubs/factories/transaction';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let utilityService: UtilityService;

  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        TransactionsService,
        CookieService,
        UtilityService
      ]
    });

    transactionsService = TestBed.inject(TransactionsService);
    utilityService = TestBed.inject(UtilityService);

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(transactionsService).toBeTruthy();
  });

  describe('loadTransactionList', () => {
    it('should return the transaction list on success', () => {
      const params = {
        offset: 5,
        limit: 5,
        order_by: '',
        order_direction: OrderDirection.ascending
      };
      transactionsService.loadTransactionList(params)
        .pipe(take(1))
        .subscribe(
          () => {
            const transactions = transactionsService.getTransactionList().getValue().transactions;
            transactions.forEach(transaction => {
              expect(transaction.description).toBeDefined();
            });
            expect(transactionsService.getTransactionList()).toEqual(new BehaviorSubject(receivedTransactionList));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = utilityService.getAugmentedUrl(API_TRANSACTIONS.GET_TRANSACTIONS_PATH, params);
      const getTransactionRequest: TestRequest = httpMock.expectOne(url);
      expect(getTransactionRequest.request.method).toEqual('GET');
      getTransactionRequest.flush({ status: 'SUCCESS', data: receivedTransactionList });
    });

    it('should pass down an error if getTransaction returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const params = {
          offset: 5,
          limit: 5,
          order_by: '',
          order_direction: OrderDirection.ascending
        };
        transactionsService.loadTransactionList(params)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = utilityService.getAugmentedUrl(API_TRANSACTIONS.GET_TRANSACTIONS_PATH, params);
        const getTransactionRequest: TestRequest = httpMock.expectOne(url);
        expect(getTransactionRequest.request.method).toEqual('GET');
        getTransactionRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('isDebit', () => {
    it('should return true if direction is debit', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.debit });
      expect(transactionsService.isDebit(transaction)).toEqual(true);
    });

    it('should return false if direction is not debit', () => {
      const directionValues = Object.values(PaymentDirection).filter((val) => val !== PaymentDirection.debit);
      directionValues.push(...[ null, undefined ]);

      directionValues.forEach((value) => {
        const transaction = transactionFactory.build({ direction: value });
        expect(transactionsService.isDebit(transaction)).toEqual(false);
      });
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isDebit(value)).toEqual(false));
    });
  });

  describe('isOnBehalfOf', () => {
    it('should return true if direction is on_behalf_of', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.on_behalf_of });
      expect(transactionsService.isOnBehalfOf(transaction)).toEqual(true);
    });

    it('should return false if direction is not on_behalf_of', () => {
      const directionValues = Object.values(PaymentDirection).filter((val) => val !== PaymentDirection.on_behalf_of);
      directionValues.push(...[ null, undefined ]);

      directionValues.forEach((value) => {
        const transaction = transactionFactory.build({ direction: value });
        expect(transactionsService.isOnBehalfOf(transaction)).toEqual(false);
      });
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isOnBehalfOf(value)).toEqual(false));
    });
  });

  describe('isCredit', () => {
    it('should return true if direction is credit', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.credit });
      expect(transactionsService.isCredit(transaction)).toEqual(true);
    });

    it('should return false if direction is not credit', () => {
      const directionValues = Object.values(PaymentDirection).filter((val) => val !== PaymentDirection.credit);
      directionValues.push(...[ null, undefined ]);

      directionValues.forEach((value) => {
        const transaction = transactionFactory.build({ direction: value });
        expect(transactionsService.isCredit(transaction)).toEqual(false);
      });
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isCredit(value)).toEqual(false));
    });
  });

  describe('isFinancing', () => {
    it('should return true if transaction has a ubl_id', () => {
      const transaction = transactionFactory.build({ ubl_id: 'lub_123' });
      expect(transactionsService.isFinancing(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have a ubl_id', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.isFinancing(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isFinancing(value)).toEqual(false));
    });
  });

  describe('isDirectDebit', () => {
    it('should return true if transaction has a direct_payment_id', () => {
      const transaction = transactionFactory.build({ direct_payment_id: 'dp_123' });
      expect(transactionsService.isDirectDebit(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have a direct_payment_id', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.isDirectDebit(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.isDirectDebit(transaction)).toEqual(false);
    });
  });

  describe('isOffline', () => {
    it('should return true if transaction has an offline_entity_name', () => {
      const transaction = transactionFactory.build({ offline_entity_name: 'cra' });
      expect(transactionsService.isOffline(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have an offline_entity_name', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.isOffline(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isOffline(value)).toEqual(false));
    });
  });

  describe('hasInvoiceNumber', () => {
    it('should return true if transaction has an invoice_number', () => {
      const transaction = transactionFactory.build({ invoice_number: '7890' });
      expect(transactionsService.hasInvoiceNumber(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have an invoice_number', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.hasInvoiceNumber(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.hasInvoiceNumber(value)).toEqual(false));
    });
  });

  describe('hasSupplier', () => {
    it('should return true if transaction has a supplier_id', () => {
      const transaction = transactionFactory.build({ supplier_id: 'su_123' });
      expect(transactionsService.hasSupplier(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have a supplier_id', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.hasSupplier(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.hasSupplier(value)).toEqual(false));
    });
  });

  describe('isOfflinePayment', () => {
    it('should return true if transaction is offline and on_behalf_of', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.on_behalf_of, offline_entity_name: 'cra' });
      expect(transactionsService.isOfflinePayment(transaction)).toEqual(true);
    });

    it('should return false if transaction is not an offline payment', () => {
      const transaction = transactionFactory.build();
      expect(transactionsService.isOfflinePayment(transaction)).toEqual(false);
    });

    it('should return false if transaction is not on_behalf_of', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.credit });
      expect(transactionsService.isOfflinePayment(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isOfflinePayment(value)).toEqual(false));
    });
  });

  describe('isFinancingRepayment', () => {
    it('should return true if transaction is a repayment and has ubl id', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.debit, ubl_id: 'lub_123' });
      expect(transactionsService.isFinancingRepayment(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have a ubl id', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.debit, ubl_id: undefined });
      expect(transactionsService.isFinancingRepayment(transaction)).toEqual(false);
    });

    it('should return false if transaction is not a repayment', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.credit });
      expect(transactionsService.isFinancingRepayment(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isFinancingRepayment(value)).toEqual(false));
    });
  });

  describe('isFinancingDeposit', () => {
    it('should return true if transaction is a credit and has ubl id', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.credit, ubl_id: 'lub_123' });
      expect(transactionsService.isFinancingDeposit(transaction)).toEqual(true);
    });

    it('should return false if transaction does not have a ubl id', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.credit, ubl_id: undefined });
      expect(transactionsService.isFinancingDeposit(transaction)).toEqual(false);
    });

    it('should return false if transaction is not a credit', () => {
      const transaction = transactionFactory.build({ direction: PaymentDirection.debit });
      expect(transactionsService.isFinancingDeposit(transaction)).toEqual(false);
    });

    it('should return false if transaction is null or undefined', () => {
      const transactionValues = [ null, undefined ];
      transactionValues.forEach((value) => expect(transactionsService.isFinancingDeposit(value)).toEqual(false));
    });
  });

  describe('getTransactionDescription', () => {
    const mockSupplierName = 'Leduc coop';
    const mockTransactionId = 'mt_123';
    const mockReferenceNum = 'lub_123';
    const mockInvoiceNum = '1234';
    const mockOfflineEntity = 'cra';
    const mockMerchantName = 'CARA OPERATIONS LTD';

    let isCreditSpy: jasmine.Spy;
    let isDebitSpy: jasmine.Spy;
    let isOnBehalfOfSpy: jasmine.Spy;
    let isFinancingSpy: jasmine.Spy;
    let isDirectDebitSpy: jasmine.Spy;
    let hasSupplierSpy: jasmine.Spy;
    let hasInvoiceNumber: jasmine.Spy;
    let isOfflinePaymentSpy: jasmine.Spy;
    let isFinancingRepayment: jasmine.Spy;
    let isFinancingDeposit: jasmine.Spy;

    beforeEach(() => {
      isCreditSpy = spyOn(transactionsService, 'isCredit');
      isDebitSpy = spyOn(transactionsService, 'isDebit');
      isOnBehalfOfSpy = spyOn(transactionsService, 'isOnBehalfOf');
      isFinancingSpy = spyOn(transactionsService, 'isFinancing');
      isDirectDebitSpy = spyOn(transactionsService, 'isDirectDebit');
      hasSupplierSpy = spyOn(transactionsService, 'hasSupplier');
      hasInvoiceNumber = spyOn(transactionsService, 'hasInvoiceNumber');
      isOfflinePaymentSpy = spyOn(transactionsService, 'isOfflinePayment');
      isFinancingRepayment = spyOn(transactionsService, 'isFinancingRepayment');
      isFinancingDeposit = spyOn(transactionsService, 'isFinancingDeposit');
    });

    it('should return COMMON.NOT_AVAILABLE if the transaction direction is not recognised', () => {
      const transaction = transactionFactory.build({ direction: undefined });
      const expectedValue = {
        key: 'COMMON.NOT_AVAILABLE',
        values: undefined
      };

      expect(transactionsService.getTransactionDescription(transaction)).toEqual(expectedValue);
    });

    describe('On-behalf-of transactions', () => {
      beforeEach(() => {
        isOnBehalfOfSpy.and.returnValue(true);
      });

      describe('When transaction is an offline payment', () => {
        it('should return correct localisation key', () => {
          isOfflinePaymentSpy.and.returnValue(true);

          const transaction = transactionFactory.build({
            offline_entity_name: mockOfflineEntity,
            ubl_reference_number: mockReferenceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual(
            {
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.OFFLINE_PAYMENT',
              values: {
                offlineEntityName: mockOfflineEntity,
                referenceNumber: mockReferenceNum
              }
            }
          );
        });

        it('should return NOT_AVAILABLE if ubl_reference_num and offline_entity_name are not present', () => {
          isOfflinePaymentSpy.and.returnValue(true);

          const values = [transactionFactory.build(), null, undefined];
          values.forEach((value) => {
            const object = transactionsService.getTransactionDescription(value);
            expect(object).toEqual({
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.OFFLINE_PAYMENT',
              values: {
                offlineEntityName: 'COMMON.NOT_AVAILABLE',
                referenceNumber: 'COMMON.NOT_AVAILABLE'
              }
            });
          });
        });
      });

      describe('When transaction is not an offline payment', () => {
        it('should return correct localisation key when there is an invoice number', () => {
          hasInvoiceNumber.and.returnValue(true);

          const transaction = transactionFactory.build({
            invoice_number: mockInvoiceNum,
            supplier_name: mockSupplierName,
            ubl_reference_number: mockReferenceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual(
            {
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_INVOICE_PAYMENT_TO',
              values: {
                supplierName: mockSupplierName,
                invoiceNumber: mockInvoiceNum,
                referenceNumber: mockReferenceNum
              }
            });
        });

        it('should return correct localisation key when there is no invoice number', () => {
          hasInvoiceNumber.and.returnValue(false);

          const transaction = transactionFactory.build({
            supplier_name: mockSupplierName,
            ubl_reference_number: mockReferenceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_PAYMENT_TO',
            values: {
              supplierName: mockSupplierName,
              referenceNumber: mockReferenceNum
            }
          });
        });

        it('should return NOT_AVAILABLE when invoice number, supplier name, and reference number are not present or transaction falsy', () => {
          hasInvoiceNumber.and.returnValue(true);

          const values = [transactionFactory.build(), null, undefined];
          values.forEach((value) => {
            const object = transactionsService.getTransactionDescription(value);
            expect(object).toEqual({
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_INVOICE_PAYMENT_TO',
              values: {
                supplierName: 'COMMON.NOT_AVAILABLE',
                invoiceNumber: 'COMMON.NOT_AVAILABLE',
                referenceNumber: 'COMMON.NOT_AVAILABLE'
              }
            });
          });
        });
      });
    });

    describe('Debit transactions', () => {
      beforeEach(() => {
        isDebitSpy.and.returnValue(true);
      });

      describe('When transaction is direct debit', () => {
        it('should return correct localisation key when there is an invoice number', () => {
          isDirectDebitSpy.and.returnValue(true);
          hasInvoiceNumber.and.returnValue(true);

          const transaction = transactionFactory.build({
            supplier_name: mockSupplierName,
            invoice_number: mockInvoiceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.DIRECT_DEBIT_INVOICE_PAYMENT_TO',
            values: {
              supplierName: mockSupplierName,
              invoiceNumber: mockInvoiceNum
            }
          });
        });

        it('should return correct localisation key when there is no invoice number', () => {
          isDirectDebitSpy.and.returnValue(true);
          hasInvoiceNumber.and.returnValue(false);

          const transaction = transactionFactory.build({
            supplier_name: mockSupplierName
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.DIRECT_DEBIT_PAYMENT_TO',
            values: {
              supplierName: mockSupplierName
            }
          });
        });

        it('should return NOT_AVAILABLE when supplier name and invoice number are not present or transaction is null or undefined', () => {
          isDirectDebitSpy.and.returnValue(true);
          hasInvoiceNumber.and.returnValue(true);

          const values = [transactionFactory.build(), null, undefined];
          values.forEach((value) => {
            const object = transactionsService.getTransactionDescription(value);
            expect(object).toEqual({
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.DIRECT_DEBIT_INVOICE_PAYMENT_TO',
              values: {
                supplierName: 'COMMON.NOT_AVAILABLE',
                invoiceNumber: 'COMMON.NOT_AVAILABLE'
              }
            });
          });
        });
      });

      describe('When transaction is financing repayment', () => {
        it('should return correct localisation key when there is an invoice', () => {
          isFinancingRepayment.and.returnValue(true);
          hasInvoiceNumber.and.returnValue(true);

          const transaction = transactionFactory.build({
            invoice_number: mockInvoiceNum,
            ubl_reference_number: mockReferenceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_INVOICE_REPAYMENT',
            values: {
              invoiceNumber: mockInvoiceNum,
              referenceNumber: mockReferenceNum
            }
          });
        });

        it('should return correct localisation key when there is no invoice', () => {
          isFinancingRepayment.and.returnValue(true);
          hasInvoiceNumber.and.returnValue(false);

          const transaction = transactionFactory.build({
            ubl_reference_number: mockReferenceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);

          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_REPAYMENT',
            values: {
              referenceNumber: mockReferenceNum
            }
          });
        });

        it('should return NOT_AVAILABLE when supplier name and reference number are not present or transaction is null or undefined', () => {
          isFinancingRepayment.and.returnValue(true);
          hasInvoiceNumber.and.returnValue(true);

          const values = [transactionFactory.build(), null, undefined];
          values.forEach((value) => {
            const object = transactionsService.getTransactionDescription(value);
            expect(object).toEqual({
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_INVOICE_REPAYMENT',
              values: {
                invoiceNumber: 'COMMON.NOT_AVAILABLE',
                referenceNumber: 'COMMON.NOT_AVAILABLE'
              }
            });
          });
        });
      });

      describe('Transaction not recognised', () => {
        it('should return COMMON.NOT_AVAILABLE if is NOT direct debit, there is a supplier, and it is NOT financing', () => {
          isDirectDebitSpy.and.returnValue(false);
          hasSupplierSpy.and.returnValue(true);
          isFinancingSpy.and.returnValue(false);
          const expectedValue = {
            key: 'COMMON.NOT_AVAILABLE',
            values: undefined
          };
          const transaction = transactionFactory.build({ id: mockTransactionId });
          expect(transactionsService.getTransactionDescription(transaction)).toEqual(expectedValue);
        });
      });
    });

    describe('Credit transactions', () => {
      beforeEach(() => {
        isCreditSpy.and.returnValue(true);
      });

      describe('When transaction is a financing deposit', () => {
        it('should return correct localisation key', () => {
          isFinancingDeposit.and.returnValue(true);

          const transaction = transactionFactory.build({
            ubl_reference_number: mockReferenceNum
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual(
            {
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_DEPOSIT',
              values: {
                referenceNumber: mockReferenceNum
              }
            });
        });

        it('should return NOT_AVAILABLE when transaction is null or undefined', () => {
          isFinancingDeposit.and.returnValue(true);

          const values = [transactionFactory.build(), null, undefined];
          values.forEach((value) => {
            const object = transactionsService.getTransactionDescription(value);
            expect(object).toEqual({
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.FINANCING_DEPOSIT',
              values: {
                referenceNumber: 'COMMON.NOT_AVAILABLE'
              }
            });
          });
        });
      });

      describe('When transaction is not a financing deposit', () => {
        it('should return correct localisation key when there is an invoice', () => {
          isFinancingDeposit.and.returnValue(false);
          hasInvoiceNumber.and.returnValue(true);

          const transaction = transactionFactory.build({
            invoice_number: mockInvoiceNum,
            merchant_name: mockMerchantName
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.INVOICE_PAYMENT_FROM', values: {
              invoiceNumber: mockInvoiceNum,
              merchantName: mockMerchantName
            }
          });
        });

        it('should return correct localisation key when there is no invoice', () => {
          isFinancingDeposit.and.returnValue(false);
          hasInvoiceNumber.and.returnValue(false);

          const transaction = transactionFactory.build({
            merchant_name: mockMerchantName
          });

          const object = transactionsService.getTransactionDescription(transaction);
          expect(object).toEqual({
            key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.PAYMENT_FROM', values: {
              merchantName: mockMerchantName
            }
          });
        });

        it('should return NOT_AVAILABLE when invoice number and merchant name are not present or transaction is null or undefined', () => {
          isFinancingDeposit.and.returnValue(false);
          hasInvoiceNumber.and.returnValue(true);

          const values = [transactionFactory.build({ merchant_name: undefined }), null, undefined];
          values.forEach((value) => {
            const object = transactionsService.getTransactionDescription(value);
            expect(object).toEqual({
              key: 'DASHBOARD.TRANSACTIONS_TAB.DESCRIPTION.INVOICE_PAYMENT_FROM', values: {
                invoiceNumber: 'COMMON.NOT_AVAILABLE',
                merchantName: 'COMMON.NOT_AVAILABLE'
              }
            });
          });
        });
      });
    });
  });
});
