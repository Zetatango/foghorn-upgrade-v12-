import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ReviewDirectDebitComponent } from './review-direct-debit.component';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantService } from 'app/services/merchant.service';
import { LoggingService } from 'app/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UiAssetService } from 'app/services/ui-asset.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { directPaymentPostFactory, directPaymentPostWithoutInvoiceFactory } from 'app/test-stubs/factories/direct-payment';
import { supplierInfoLcbo } from 'app/test-stubs/factories/supplier';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { MaskPipe } from 'app/pipes/mask.pipe';
import { DirectPaymentPost } from 'app/models/api-entities/direct-payment-post';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankAccount } from 'app/models/bank-account';
import { bankAccountFactory } from 'app/test-stubs/factories/bank-account';
import { RouterTestingModule } from '@angular/router/testing';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';

describe('ReviewDirectDebitComponent', () => {
  let component: ReviewDirectDebitComponent;
  let fixture: ComponentFixture<ReviewDirectDebitComponent>;

  let directDebitPostSpy: jasmine.Spy;
  let bankAccountSpy: jasmine.Spy;
  let delegatedAccessSpy: jasmine.Spy;

  const sampleDirectDebitPost = directPaymentPostFactory.build();
  const sampleDirectDebitPostWithoutInvoice = directPaymentPostWithoutInvoiceFactory.build();
  const sampleSupplierInformation = supplierInfoLcbo;
  const sampleBankAccount = bankAccountFactory.build();

  beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ HttpClientTestingModule, TranslateModule.forRoot(), CollapseModule.forRoot(), BrowserAnimationsModule, RouterTestingModule ],
        declarations: [
          ReviewDirectDebitComponent,
          MaskPipe,
          ZttCurrencyPipe
        ],
        providers: [
          CookieService,
          UtilityService,
          DirectPaymentService,
          BankAccountService,
          ErrorService,
          LoggingService,
          MerchantService,
          UiAssetService,
          StateRoutingService,
          { provide: ErrorService,
            useClass: class {
              show = jasmine.createSpy('show');
            }
          }
        ],
        schemas: [ NO_ERRORS_SCHEMA ]
      });

      fixture = TestBed.createComponent(ReviewDirectDebitComponent);
      component = fixture.componentInstance;

      const directPaymentService: DirectPaymentService = TestBed.inject(DirectPaymentService);
      const bankAccountService: BankAccountService = TestBed.inject(BankAccountService);
      const merchantService: MerchantService = TestBed.inject(MerchantService);

      directDebitPostSpy = spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject<DirectPaymentPost>(sampleDirectDebitPost));
      spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject<SupplierInformation>(sampleSupplierInformation));
      bankAccountSpy = spyOnProperty(bankAccountService, 'bankAccount').and.returnValue(new BehaviorSubject<BankAccount>(sampleBankAccount));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

      // Stub delegated access
      delegatedAccessSpy = spyOn(merchantService, 'isDelegatedAccessMode')
        .and.returnValue(false);
    });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('confirmDirectDebit()', () => {
    it('should show ui error if delegated access mode enabled', inject([ErrorService], (errorService: ErrorService) => {
        delegatedAccessSpy.and.returnValue(true);
        fixture.detectChanges();
        component.confirmDirectDebit();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
      }));

    it('should emit event if not delegated access mode', inject([ErrorService], (errorService: ErrorService) => {
        delegatedAccessSpy.and.returnValue(false);
        spyOn(component.nextEvent, 'emit');
        fixture.detectChanges();
        component.confirmDirectDebit();

        expect(errorService.show).toHaveBeenCalledTimes(0);
        expect(component.nextEvent.emit).toHaveBeenCalledTimes(1);
      }));
  });

  describe('cancel()', () => {
    it('should show ui error if delegated access mode enabled', inject([ErrorService], (errorService: ErrorService) => {
        delegatedAccessSpy.and.returnValue(true);
        fixture.detectChanges();
        component.cancel();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
      }));

    it('should emit event if not delegated access mode', inject([ErrorService], (errorService: ErrorService) => {
        delegatedAccessSpy.and.returnValue(false);
        spyOn(component.cancelEvent, 'emit');
        fixture.detectChanges();
        component.cancel();

        expect(errorService.show).toHaveBeenCalledTimes(0);
        expect(component.cancelEvent.emit).toHaveBeenCalledTimes(1);
      }));
  });

  describe('bankAccountInfo()', () => {
    it('returns bank account number', () => {
        fixture.detectChanges();

        expect(component.bankAccountInfo()).toBe(sampleBankAccount.account_number);
      });

    it('returns empty bank account number if failed to load bank account', () => {
      fixture.detectChanges();
      bankAccountSpy.and.returnValue(null);

      expect(component.bankAccountInfo()).toBe('N/A');
    });

    it('returns empty bank account number if not loaded yet', () => {
      fixture.detectChanges();
      component.loaded = false;

      expect(component.bankAccountInfo()).toBe('N/A');
    });
  });

  describe('invoiceNumber()', () => {
    it('returns invoice number from existing invoice if loaded', () => {
      fixture.detectChanges();

      expect(component.invoiceNumber()).toBe(sampleSupplierInformation.invoice_number);
    });

    it('returns invoice number entered manually if loaded', () => {
      directDebitPostSpy.and.returnValue(new BehaviorSubject<DirectPaymentPost>(sampleDirectDebitPostWithoutInvoice));
      fixture.detectChanges();

      expect(component.invoiceNumber()).toBe(sampleDirectDebitPostWithoutInvoice.invoice_number);
    });

    it('returns empty invoice info if not loaded yet', () => {
      fixture.detectChanges();
      component.loaded = false;

      expect(component.invoiceNumber()).toBe(null);
    });
  });

  describe('supplierInfo()', () => {
    it('returns supplier information', () => {
      fixture.detectChanges();

      expect(component.supplierInfo()).toBe(sampleSupplierInformation);
    });

    it('returns empty supplier info if not loaded yet', () => {
      fixture.detectChanges();
      component.loaded = false;

      expect(component.supplierInfo()).toBe(null);
    });
  });
});
