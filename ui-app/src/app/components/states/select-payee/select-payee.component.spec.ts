import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { SelectPayeeComponent } from './select-payee.component';
import { SupplierService } from 'app/services/supplier.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { LoggingService } from 'app/services/logging.service';
import { ErrorService } from 'app/services/error.service';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { supplierBeerStore, supplierLcbo, supplierInfoBeerStore } from 'app/test-stubs/factories/supplier';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { RouterTestingModule } from '@angular/router/testing';
import Bugsnag from '@bugsnag/js';

describe('SelectPayeeComponent', () => {
  let component: SelectPayeeComponent;
  let fixture: ComponentFixture<SelectPayeeComponent>;

  let stateRoutingService: StateRoutingService;

  const stubbedSuppliersResponse = { status: 200, body: [ supplierBeerStore, supplierLcbo ] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [ SelectPayeeComponent ],
      providers: [
        BorrowerInvoiceService,
        CookieService,
        ErrorService,
        LoggingService,
        MerchantService,
        SupplierService,
        UtilityService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });

    fixture = TestBed.createComponent(SelectPayeeComponent);
    component = fixture.componentInstance;

    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'navigate');
    component.suppliers = [];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isPayeeSupplierAndInvalid()', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return false on initial pay supplier selected', () => {
      expect(component.isPayeeSupplierAndInvalid).toBeFalse();
    });

    it('should return false once all fields for pay supplier have been filled in', () => {
      component.payeeType.setValue('payee-supplier');
      component.payee.setValue('Acme Supplier');
      component.invoiceNumber.setValue('1234567890');
      expect(component.isPayeeSupplierAndInvalid).toBeFalse();
    });
  });

  it('should set the initial payeeType to payee-self', () => {
    component.ngOnInit();

    expect(component.payeeType.value).toEqual('payee-self');
  });

  it('should set invalid for fields that are required, but are touched and dirty', () => {
    component.ngOnInit();

    component.payeeType.setValue('payee-supplier');
    component.payee.markAsTouched();
    component.payee.markAsDirty();
    component.invoiceNumber.markAsTouched();
    component.invoiceNumber.markAsDirty();

    expect(component.payee.valid).toBeFalse();
    expect(component.invoiceNumber.valid).toBeFalse();
    expect(component.isPayeeSupplierAndInvalid).toEqual(true);
  });

  it('should try to load suppliers on init only once', inject([ SupplierService ], (supplierService: SupplierService) => {
    spyOn(supplierService, 'loadSuppliers').and.returnValue(of(null));
    spyOn(component, 'loadSuppliers');

    component.ngOnInit();

    expect(component.loadSuppliers).toHaveBeenCalledTimes(1);
  }));

  it('should set suppliers subscription after successfully loading suppliers',
    inject([ SupplierService ], (supplierService: SupplierService) => {
      spyOn(supplierService, 'loadSuppliers').and.returnValue(of(null));
      spyOn(supplierService, 'getSuppliers').and.returnValue(new BehaviorSubject(stubbedSuppliersResponse.body));

      component.ngOnInit();

      expect(supplierService.loadSuppliers).toHaveBeenCalledTimes(1);
      expect(component.suppliers).toEqual(stubbedSuppliersResponse.body);
      expect(component.loaded).toBeTruthy();
    }));

  it('should set loaded to true on receipt of suppliers in subscription',
    inject([ SupplierService ], (supplierService: SupplierService) => {
      spyOn(supplierService, 'getSuppliers').and.returnValue(new BehaviorSubject(stubbedSuppliersResponse.body));

      expect(component.loaded).toBeFalsy();

      component.setSuppliersSubscription();

      expect(component.loaded).toBeTruthy();
    }));

  it('should show an error modal if failed to load suppliers',
    inject([ SupplierService, ErrorService ], (supplierService: SupplierService, errorService: ErrorService) => {
      spyOn(supplierService, 'loadSuppliers').and.returnValue(throwError(new HttpErrorResponse({})));
      spyOn(component, 'setSuppliersSubscription');
      spyOn(errorService, 'show');

      component.loadSuppliers();

      expect(supplierService.loadSuppliers).toHaveBeenCalledTimes(1);
      expect(component.setSuppliersSubscription).not.toHaveBeenCalled();
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getSuppliers);
    }));

  it('should try to save selected supplier information in supplier service on next()',
    inject([ BorrowerInvoiceService ], (borrowerInvoiceService: BorrowerInvoiceService) => {
      spyOn(borrowerInvoiceService, 'findExistingInvoice').and.returnValue(of(null));
      spyOn(component, 'saveSelectedSupplier');
      component.merchant = merchantDataFactory.build();
      component.payeeType.setValue('payee-supplier');
      component.payee.setValue(supplierInfoBeerStore.id);
      component.invoiceNumber.setValue(supplierInfoBeerStore.invoice_number);
      component.next();

      expect(component.saveSelectedSupplier).toHaveBeenCalledTimes(1);
    }));

  it('should not try to save selected supplier information, or find Invoice on next() if payee is self',
    inject([ BorrowerInvoiceService ], (borrowerInvoiceService: BorrowerInvoiceService) => {
      const borrowerInvoiceServiceSpy = spyOn(borrowerInvoiceService, 'findExistingInvoice');
      spyOn(component, 'saveSelectedSupplier');
      component.merchant = merchantDataFactory.build();
      component.payeeType.setValue('payee-self');

      component.next();

      expect(component.saveSelectedSupplier).not.toHaveBeenCalled();
      expect(borrowerInvoiceServiceSpy).not.toHaveBeenCalled();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
    }));

  it('should raise bugsnag on next() if findExistingInvoice fails', // This doesn't mean it could not find a match, it just means the API call fails
    inject([ BorrowerInvoiceService ], (borrowerInvoiceService: BorrowerInvoiceService) => {
      spyOn(borrowerInvoiceService, 'findExistingInvoice').and.returnValue(throwError(new HttpErrorResponse({
        status: 500, statusText: 'Internal Server Error'
      })));
      spyOn(Bugsnag, 'notify');
      component.merchant = merchantDataFactory.build();
      component.payeeType.setValue('payee-supplier');
      component.payee.setValue(supplierInfoBeerStore.id);
      component.invoiceNumber.setValue(supplierInfoBeerStore.invoice_number);
      component.next();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    }));

  it('should show an error modal on next() if findExistingInvoice fails', // This doesn't mean it could not find a match, it just means the API call fails
    inject([ BorrowerInvoiceService, ErrorService, LoggingService ],
      (borrowerInvoiceService: BorrowerInvoiceService, errorService: ErrorService) => {
      spyOn(borrowerInvoiceService, 'findExistingInvoice').and.returnValue(throwError(new HttpErrorResponse({})));
      spyOn(errorService, 'show');
      spyOn(Bugsnag, 'notify');

      component.merchant = merchantDataFactory.build();
      component.payeeType.setValue('payee-supplier');
      component.payee.setValue(supplierInfoBeerStore.id);
      component.invoiceNumber.setValue(supplierInfoBeerStore.invoice_number);
      component.next();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    }));

  it('should save selected supplier information in the currentSupplierInformation resource of the supplier service',
    fakeAsync(inject([ SupplierService ], (supplierService: SupplierService) => { // TODO: Might be able to split that test.
      const supplier_info = supplierInfoBeerStore;
      component.suppliers = [ supplierBeerStore ];
      spyOn(supplierService, 'setCurrentSupplierInformation');
      spyOn(supplierService, 'getSupplier').and.returnValue(new BehaviorSubject(supplier_info));

      // Mocked correct supplier forms inputs:
      component.payee.setValue(supplier_info.id);
      component.accountNumber.setValue(supplier_info.account_number);
      component.invoiceNumber.setValue(supplier_info.invoice_number);
      component.saveSelectedSupplier();

      const expectedSavedSupplierInformation = {
        id: component.payee.value,
        name: supplier_info.name,
        account_number: component.accountNumber.value,
        invoice_number: component.invoiceNumber.value,
        is_business_partner: supplier_info.is_business_partner
      };
      tick();

      expect(supplierService.setCurrentSupplierInformation).toHaveBeenCalledOnceWith(expectedSavedSupplierInformation);
    })));

  it('should save selected supplier information with leading/trailing whitespace removed',
    fakeAsync(inject([ SupplierService ], (supplierService: SupplierService) => {
      const supplier_info = supplierInfoBeerStore;
      component.suppliers = [ supplierBeerStore ];
      spyOn(supplierService, 'setCurrentSupplierInformation');
      spyOn(supplierService, 'getSupplier').and.returnValue(new BehaviorSubject(supplier_info));

      // Mocked correct supplier forms inputs:
      component.payee.setValue(supplier_info.id);
      component.accountNumber.setValue(' ACC-123 ');
      component.invoiceNumber.setValue(' INV-123 ');
      component.saveSelectedSupplier();

      const expectedSavedSupplierInformation = {
        id: component.payee.value,
        name: supplier_info.name,
        account_number: 'ACC-123',
        invoice_number: 'INV-123',
        is_business_partner: true
      };
      tick();

      expect(supplierService.setCurrentSupplierInformation).toHaveBeenCalledOnceWith(expectedSavedSupplierInformation);
    })));

  it('should not save selected supplier information in the currentSupplierInformation resource of the supplier service without a perfect match',
    inject([ SupplierService ], (supplierService: SupplierService) => {
      const supplier_info = supplierInfoBeerStore;
      component.suppliers = [ supplierBeerStore, supplierBeerStore ];
      spyOn(supplierService, 'setCurrentSupplierInformation');

      // Mocked incorrect supplier forms inputs:
      component.payee.setValue(supplier_info.id);
      component.accountNumber.setValue(supplier_info.account_number);
      component.invoiceNumber.setValue(supplier_info.invoice_number);
      component.saveSelectedSupplier();

      expect(supplierService.setCurrentSupplierInformation).not.toHaveBeenCalled();
    }));

  it('should navigate to select_lending_offer on next()',
    inject([ BorrowerInvoiceService ], (borrowerInvoiceService: BorrowerInvoiceService) => {
      spyOn(borrowerInvoiceService, 'findExistingInvoice').and.returnValue(of(null));
      component.merchant = merchantDataFactory.build();
      component.payee.setValue(supplierInfoBeerStore.id);
      component.invoiceNumber.setValue(supplierInfoBeerStore.invoice_number);
      component.next();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
    }));

  it('should enforce invoice number as a required field', () => {
    component.selectSupplierFormGroup.setValue({
      payee: 'Supplier 1',
      accountNumber: 'ACC-123',
      invoiceNumber: ''
    });
    expect(component.selectSupplierFormGroup.valid).toBeFalsy();

    const errors = component.invoiceNumber.errors || {};
    expect(errors.required).toBeTruthy();
  });

  it('should enforce payee as a required field', () => {
    component.selectSupplierFormGroup.setValue({
      payee: '',
      accountNumber: 'ACC-123',
      invoiceNumber: 'I-123'
    });
    expect(component.selectSupplierFormGroup.valid).toBeFalsy();

    const errors = component.payee.errors || {};
    expect(errors.required).toBeTruthy();
  });

  it('should allow account Number to be optional', () => {
    component.selectSupplierFormGroup.setValue({
      payee: 'Supplier 1',
      accountNumber: '',
      invoiceNumber: 'I-123'
    });
    expect(component.selectSupplierFormGroup.valid).toBeTruthy();
  });

  it('should have dashboard link defined', () => {
    expect(component.dashboardLink).toEqual(AppRoutes.dashboard.root_link);
  });
});
