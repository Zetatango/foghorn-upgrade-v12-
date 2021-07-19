import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { CURRENT_SUPPLIER_ID_KEY, SupplierService } from './supplier.service';
import { UtilityService } from './utility.service';

import { API_SUPPLIER } from 'app/constants';

import { supplierBeerStore, supplierInfoBeerStore, supplierLcbo } from 'app/test-stubs/factories/supplier';
import { CookieService } from 'ngx-cookie-service';

describe('SupplierService', () => {
  let supplierService: SupplierService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ CookieService, SupplierService, UtilityService ]
    });

    supplierService = TestBed.inject(SupplierService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(supplierService).toBeTruthy();
  });

  // ------------------------------------------------------------------------------- loadSuppliers()
  describe('loadSuppliers()', () => {
    const startParam = 1;
    const countParam = 10;
    const searchParam = 'ari';

    it('should be able to get suppliers data with no query params', () => {
      supplierService.loadSuppliers()
        .pipe(take(1))
        .subscribe((res) => {
          expect(res).toEqual({
            status: 'Success',
            message: 'Loaded Suppliers List',
            data: [ supplierBeerStore, supplierLcbo ]
          });
        });

      const suppliersRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH);
      expect(suppliersRequest.request.method).toEqual('GET');
      suppliersRequest.flush({
        status: 'Success',
        message: 'Loaded Suppliers List',
        data: [ supplierBeerStore, supplierLcbo ]
      });
    });

    it('should be able to get suppliers data with 3 query params', () => {
      supplierService.loadSuppliers({ start: startParam, count: countParam, search_string: searchParam })
        .pipe(take(1))
        .subscribe((res) => {
          expect(res).toEqual({
            status: 'Success',
            message: 'Loaded Suppliers List',
            data: [ supplierBeerStore, supplierLcbo ]
          });
        });

      const suppliersRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH + `?start=${startParam}&count=${countParam}&search_string=${searchParam}`);
      expect(suppliersRequest.request.method).toEqual('GET');
      suppliersRequest.flush({
        status: 'Success',
        message: 'Loaded Suppliers List',
        data: [ supplierBeerStore, supplierLcbo ]
      });
    });

    it('should be able to get suppliers data with 2 query params', () => {
      supplierService.loadSuppliers({ start: startParam, count: countParam })
        .pipe(take(1))
        .subscribe((res) => {
          expect(res).toEqual({
            status: 'Success',
            message: 'Loaded Suppliers List',
            data: [ supplierBeerStore, supplierLcbo ]
          });
        });

      const suppliersRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH + `?start=${startParam}&count=${countParam}`);
      expect(suppliersRequest.request.method).toEqual('GET');
      suppliersRequest.flush({
        status: 'Success',
        message: 'Loaded Suppliers List',
        data: [ supplierBeerStore, supplierLcbo ]
      });
    });

    it('should be able to get suppliers data with 1 query param', () => {
      supplierService.loadSuppliers({ start: startParam })
        .pipe(take(1))
        .subscribe((res) => {
          expect(res).toEqual({
            status: 'Success',
            message: 'Loaded Suppliers List',
            data: [ supplierBeerStore, supplierLcbo ]
          });
        });

      const suppliersRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH + `?start=${startParam}`);
      expect(suppliersRequest.request.method).toEqual('GET');
      suppliersRequest.flush({
        status: 'Success',
        message: 'Loaded Suppliers List',
        data: [ supplierBeerStore, supplierLcbo ]
      });
    });

    it('should be able to get empty suppliers data', () => {
      supplierService.loadSuppliers()
        .pipe(take(1))
        .subscribe((res) => {
          expect(res).toEqual({
            status: 'Success',
            message: 'Loaded Suppliers List',
            data: []
          });
        });

      const suppliersRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH);
      expect(suppliersRequest.request.method).toEqual('GET');
      suppliersRequest.flush({
        status: 'Success',
        message: 'Loaded Suppliers List',
        data: []
      });
    });

    it('should pass down an error to caller if getting suppliers return an http error',
      () => {
        const httpErrors = [
          { status: 400, statusText: 'Bad Request' },
          { status: 401, statusText: 'Unauthorized' },
          { status: 404, statusText: 'Not Found' },
          { status: 422, statusText: 'Unprocessable Entity' },
          { status: 500, statusText: 'Internal Server Error' }
        ];

        httpErrors.forEach(httpError => {
          supplierService.loadSuppliers()
            .pipe(take(1))
            .subscribe(
              () => fail('Unexpected'), // Nothing to check here, won't be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const lendingApplicationRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH);
          expect(lendingApplicationRequest.request.method).toEqual('GET');
          lendingApplicationRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });

    it('should set public suppliers behaviour subject when successfully getting suppliers data',
      () => {
        expect(supplierService.getSuppliers()).toEqual(new BehaviorSubject([]));

        supplierService.loadSuppliers()
          .pipe(take(1))
          .subscribe(() => {
            supplierService.getSuppliers()
              .pipe(take(1))
              .subscribe((value) => {
                expect(value).toEqual([ supplierBeerStore, supplierLcbo ]);
              });
          });

        const suppliersRequest = httpMock.expectOne(API_SUPPLIER.GET_SUPPLIERS_PATH);
        expect(suppliersRequest.request.method).toEqual('GET');
        suppliersRequest.flush({
          status: 'Success',
          message: 'Loaded Suppliers List',
          data: [ supplierBeerStore, supplierLcbo ]
        });
      });
  }); // describe - getSuppliers()

  // -------------------------------------------------------------- setCurrentSupplierInformation()
  describe('setCurrentSupplierInformation()', () => {
    it('should set currentSupplierInformation on caller\'s demand', () => {
      expect(supplierService.currentSupplierInformation).toEqual(new BehaviorSubject(undefined));
      supplierService.setCurrentSupplierInformation(supplierInfoBeerStore);
      expect(supplierService.currentSupplierInformation).toEqual(new BehaviorSubject(supplierInfoBeerStore));
    });
  }); // describe  - setCurrentSupplierInformation()

  describe('getSupplier()', () => {
    it('should be undefined initially', () => {
      expect(supplierService.getSupplier()).toEqual(new BehaviorSubject(undefined));
    });

    it('should equal the value that the current supplier is set to', () => {
      supplierService.setCurrentSupplier(supplierBeerStore);
      expect(supplierService.getSupplier()).toEqual(new BehaviorSubject(supplierBeerStore));
    });
  });

  // --------------------------------------------------------------------- clearSupplierInformation()
  describe('clearSupplierInformation()', () => {
    it('should set current supplier information to null', () => {
      supplierService.setCurrentSupplierInformation(supplierInfoBeerStore);
      expect(supplierService.currentSupplierInformation.getValue()).toEqual(supplierInfoBeerStore);

      supplierService.clearSupplierInformation();
      expect(supplierService.currentSupplierInformation.getValue()).toBeNull();
    });
  }); // describe - clearSupplierInformation()

  // --------------------------------------------------------------------- clearCurrentSupplier()
  describe('clearCurrentSupplier()', () => {
    it('should set current supplier to null', () => {
      supplierService.setCurrentSupplier(supplierBeerStore);
      expect(supplierService.getSupplier()).toEqual(new BehaviorSubject(supplierBeerStore));

      supplierService.clearCurrentSupplier();
      expect(supplierService.getSupplier().getValue()).toBeNull();
    });
  }); // describe - clearCurrentSupplier()

  describe('selectedSupplierIdForMerchant', () => {
    it('should get item from local storage', () => {
      spyOn(localStorage, 'getItem');

      supplierService.getSelectedSupplierIdForMerchant('m_123');

      expect(localStorage.getItem).toHaveBeenCalledOnceWith(CURRENT_SUPPLIER_ID_KEY + '_m_123');
    });

    it('should set item in local storage', () => {
      spyOn(localStorage, 'setItem');

      supplierService.setSelectedSupplierIdForMerchant('m_123', 'su_456');

      expect(localStorage.setItem).toHaveBeenCalledOnceWith(CURRENT_SUPPLIER_ID_KEY + '_m_123', 'su_456');
    });

    it('should remove item from local storage', () => {
      spyOn(localStorage, 'removeItem');

      supplierService.clearSelectedSupplierIdForMerchant('m_123');

      expect(localStorage.removeItem).toHaveBeenCalledOnceWith(CURRENT_SUPPLIER_ID_KEY + '_m_123');
    });
  });
});
