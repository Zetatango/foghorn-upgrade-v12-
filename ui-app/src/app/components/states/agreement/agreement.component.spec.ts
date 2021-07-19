import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Agreement, AgreementType } from 'app/models/agreement';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ReauthService } from 'app/services/reauth.service';
import { SupplierService } from 'app/services/supplier.service';
import { UtilityService } from 'app/services/utility.service';
import { agreementFactory } from 'app/test-stubs/factories/agreement';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { supplierLcbo } from 'app/test-stubs/factories/supplier';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AgreementComponent } from './agreement.component';
import { AgreementService } from 'app/services/agreement.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Merchant } from 'app/models/api-entities/merchant';
import { Supplier } from 'app/models/api-entities/supplier';
import { supplierResponseFactory } from 'app/test-stubs/factories/direct-payment';
import Bugsnag from '@bugsnag/js';

describe('AgreementComponent', () => {
  let component: AgreementComponent;
  let fixture: ComponentFixture<AgreementComponent>;

  let agreementService;
  let errorService;
  let loggingService;
  let merchantService;
  let reauthService;
  let supplierService;
  let translateService;

  let agreementBehaviorSubjectSpy: jasmine.Spy;
  let loadAgreementByTypeSpy: jasmine.Spy;
  let merchantSpy: jasmine.Spy;

  const defaultMerchant: Merchant = merchantDataFactory.build();
  const defaultPadAgreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_debit });
  const defaultPafAgreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_financing });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule ],
      providers: [
        AgreementService,
        CookieService,
        ErrorService,
        LoggingService,
        MerchantService,
        ReauthService,
        SupplierService,
        UtilityService
      ],
      declarations: [ AgreementComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgreementComponent);
    component = fixture.componentInstance;

    agreementService = TestBed.inject(AgreementService);
    errorService = TestBed.inject(ErrorService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    reauthService = TestBed.inject(ReauthService);
    supplierService = TestBed.inject(SupplierService);
    translateService = TestBed.inject(TranslateService);

    agreementBehaviorSubjectSpy = spyOnProperty(agreementService, 'agreementSubject').and.returnValue(new BehaviorSubject<Agreement>(defaultPafAgreement));
    spyOn(agreementService, 'clearActivePafAgreementForMerchant');
    spyOn(supplierService, 'clearSelectedSupplierIdForMerchant');
    spyOn(errorService, 'show');
    spyOn(supplierService, 'getSelectedSupplierIdForMerchant').and.returnValue('su_123');
    loadAgreementByTypeSpy = spyOn(agreementService, 'loadAgreementByType').and.returnValue(of(null));
    spyOn(Bugsnag, 'notify');
    merchantSpy = spyOnProperty(component, 'merchant').and.returnValue(defaultMerchant);
    spyOn(loggingService, 'GTMUpdate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load the agreement by type (PAF)', () => {
      spyOn(supplierService, 'getSupplier').and.returnValue(new BehaviorSubject<Supplier>(supplierResponseFactory.build({ id: 'su_123'})));
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_financing);
      component.ngOnInit();

      expect(agreementService.loadAgreementByType).toHaveBeenCalledOnceWith(defaultMerchant.id, AgreementType.pre_authorized_financing, true, 'su_123');
    });

    it('should load the agreement by type (PAF, supplier loaded)', () => {
      spyOnProperty(component, 'supplierId').and.returnValue('su_456');
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_financing);
      component.ngOnInit();

      expect(agreementService.loadAgreementByType).toHaveBeenCalledOnceWith(defaultMerchant.id, AgreementType.pre_authorized_financing, true, 'su_456');
    });

    it('should set agreement property (PAF)', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_financing);
      component.ngOnInit();

      expect(component.agreement).toEqual(defaultPafAgreement);
    });

    it('should set loaded flag (PAD)', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_financing);
      component.ngOnInit();

      expect(component.loaded).toBeTruthy();
    });

    it('should load the agreement by type (PAD)', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);
      component.ngOnInit();

      expect(agreementService.loadAgreementByType).toHaveBeenCalledOnceWith(defaultMerchant.id, AgreementType.pre_authorized_debit, true, null);
    });

    it('should set agreement property (PAD)', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(defaultPadAgreement));
      component.ngOnInit();

      expect(component.agreement).toEqual(defaultPadAgreement);
    });

    it('should set loaded flag (PAD)', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(defaultPadAgreement));
      component.ngOnInit();

      expect(component.loaded).toBeTruthy();
    });

    it('should display error dialog and log bugsnag if agreement fails to load (PAF)', () => {
      spyOnProperty(component, 'supplierId').and.returnValue('su_456');
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_financing);
      loadAgreementByTypeSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: 'https://foghorn.com' })));
      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });

    it('should display error dialog and log bugsnag if agreement fails to load (PAD)', () => {
      spyOnProperty(component, 'supplierId').and.returnValue('su_456');
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);
      loadAgreementByTypeSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: 'https://foghorn.com' })));
      component.ngOnInit();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });

    it('should clear active PAF agreement and selected supplier if type is PAF', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_financing);

      component.ngOnDestroy();

      expect(supplierService.clearSelectedSupplierIdForMerchant).toHaveBeenCalledTimes(1);
      expect(agreementService.clearActivePafAgreementForMerchant).toHaveBeenCalledTimes(1);
    });

    it('should not clear active PAF agreement and selected supplier if type is not PAF', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);

      component.ngOnDestroy();

      expect(supplierService.clearSelectedSupplierIdForMerchant).not.toHaveBeenCalled();
      expect(agreementService.clearActivePafAgreementForMerchant).not.toHaveBeenCalled();
    });
  });

  describe('Merchant', () => {
    it('should return merchant from service if set in service', () => {
      const merchant = merchantDataFactory.build();
      spyOn(merchantService, 'getMerchant').and.returnValue(merchant);
      merchantSpy.and.callThrough();
      component.ngOnInit();
      expect(merchantService.getMerchant).toHaveBeenCalledTimes(1);
      expect(component.merchant).toEqual(merchant);
    });

    it('should be undefined if not set in service', () => {
      spyOn(merchantService, 'getMerchant').and.returnValue(undefined);
      merchantSpy.and.callThrough();
      component.ngOnInit();
      expect(merchantService.getMerchant).toHaveBeenCalledTimes(1);
      expect(component.merchant).toBeUndefined();
    });
  });

  describe('merchantId', () => {
    it('should return the merchant id if the merchant is set', () => {
      expect(component.merchantId).toEqual(defaultMerchant.id);
    });

    it('should return null if the merchant is not set', () => {
      merchantSpy.and.returnValue(undefined);
      expect(component.merchantId).toBeNull();
    });
  });

  describe('merchantName', () => {
    it('should return the merchant name if the merchant is set', () => {
      expect(component.merchantName).toEqual(defaultMerchant.name);
    });

    it('should return empty string if the merchant is not set', () => {
      merchantSpy.and.returnValue(undefined);
      expect(component.merchantName).toEqual('');
    });
  });

  describe('Supplier', () => {
    it('should return supplier from service if set in service', () => {
      const supplier = supplierLcbo;
      spyOn(supplierService, 'getSupplier').and.returnValue(new BehaviorSubject(supplier));
      component.ngOnInit();
      expect(supplierService.getSupplier).toHaveBeenCalledTimes(1);
      expect(component.supplier).toEqual(supplier);
    });

    it('should be undefined if not set in service', () => {
      spyOn(supplierService, 'getSupplier').and.returnValue(new BehaviorSubject(undefined));
      component.ngOnInit();
      expect(supplierService.getSupplier).toHaveBeenCalledTimes(1);
      expect(component.supplier).toBeUndefined();
    });
  });

  describe('supplierId', () => {
    it('should return the supplier id if the supplier is set', () => {
      const supplier = supplierLcbo;
      spyOnProperty(component, 'supplier').and.returnValue(supplier);
      expect(component.supplierId).toEqual(supplier.id);
    });

    it('should return null if the supplier is not set', () => {
      spyOnProperty(component, 'supplier').and.returnValue(undefined);
      expect(component.supplierId).toBeNull();
    });
  });

  describe('agreementName', () => {
    it('should return agreement type prefixed with AGREEMENT.NAME. and call translate', () => {
        spyOn(translateService, 'instant').and.callThrough();
        Object.values(AgreementType).forEach((type) => {
          component.agreementType = type;
          expect(component.agreementName).toEqual('AGREEMENT.NAME.' + type);
          expect(translateService.instant).toHaveBeenCalledWith(component.agreementName);
        });
      });
  });

  describe('agreementContent', () => {
    it('should return agreement content attribute if agreement is set', () => {
      const agreement = agreementFactory.build();
      spyOnProperty(component, 'agreement').and.returnValue(agreement);
      expect(component.agreementContent).toEqual(agreement.content);
    });

    it('should return empty string if agreement is not set', () => {
      spyOnProperty(component, 'agreement').and.returnValue(undefined);
      expect(component.agreementContent).toEqual('');
    });
  });

  describe('agreementFileName', () => {
    it('should return agreementName and type with Ario_ prefix and call translate on agreementName', () => {
        spyOn(translateService, 'instant').and.callThrough();
        Object.values(AgreementType).forEach((type) => {
          component.agreementType = type;
          expect(component.agreementFileName).toEqual('Ario_AGREEMENT.NAME.' + type);
          expect(translateService.instant).toHaveBeenCalledWith(component.agreementName);
        });
      });
  });

  describe('containerText', () => {
    it('should return agreement type prefixed with AGREEMENT.CONTAINER_TEXT_TOP.', () => {
      Object.values(AgreementType).forEach((type) => {
        component.agreementType = type;
        expect(component.containerText).toEqual('AGREEMENT.CONTAINER_TEXT_TOP.' + type);
      });
    });
  });

  describe('sign button', () => {
    it('should not be disabled when agreement has loaded', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(defaultPadAgreement));

      fixture.detectChanges();

      const signBtn = fixture.debugElement.query(By.css('button[id="agreement-sign-btn"]'));
      expect(signBtn.nativeElement.disabled).toBe(false);
    });

    it('should be disabled when agreement has not load yet', () => {
      spyOnProperty(component, 'agreementType').and.returnValue(AgreementType.pre_authorized_debit);
      agreementBehaviorSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(defaultPadAgreement));
      spyOnProperty(component, 'agreementContent').and.returnValue('');

      fixture.detectChanges();

      const signBtn = fixture.debugElement.query(By.css('button[id="agreement-sign-btn"]'));
      expect(signBtn.nativeElement.disabled).toBe(true);
    });
  });

  describe('sign()', () => {
    it('should call loggingService.GTMUpdate with correct button label', () => {
        component.agreementType = AgreementType.business_partner;
        component.sign();

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Sign Agreement of type: ' + component.agreementType);
      });

    it('should set signingAgreement to false on failed re-auth', () => {
        spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.FAIL }));

        component.sign();

        expect(component.signingAgreement).toBeFalsy();
      });

    it('should set signingAgreement to false and display error dialog on re-auth error', () => {
        spyOn(reauthService, 'open').and.returnValue(throwError({}));

        component.sign();

        expect(component.signingAgreement).toBeFalsy();
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.signByReauth);
      });

    it('should not open reauth window if already signing agreement', () => {
        spyOn(reauthService, 'open');
        spyOnProperty(component, 'signingAgreement').and.returnValue(true);

        component.sign();

        expect(reauthService.open).not.toHaveBeenCalled();
      });

    it('should call accept and emit nextEvent on success', () => {
        spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.SUCCESS }));
        spyOn(agreementService, 'accept').and.returnValue(of(null));
        spyOn(component.nextEvent, 'emit');

        component.sign();

        expect(agreementService.accept).toHaveBeenCalledTimes(1);
        expect(component.nextEvent.emit).toHaveBeenCalledTimes(1);
      });

    it('should log with bugsnag when calling accept and hit error', () => {
        spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.SUCCESS }));

        spyOn(agreementService, 'accept').and.returnValue(throwError(new HttpErrorResponse({ status: 500, statusText: 'Error', url: 'https://example.org' })));
        spyOn(component.nextEvent, 'emit');

        component.sign();

        expect(agreementService.accept).toHaveBeenCalledTimes(1);
        expect(component.nextEvent.emit).toHaveBeenCalledTimes(0);
        expect(errorService.show).toHaveBeenCalledWith(UiError.general);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      });
  });

  describe('back()', () => {
    it('should emit from backEvent', () => {
      spyOn(component.backEvent, 'emit');

      component.back();

      expect(component.backEvent.emit).toHaveBeenCalledTimes(1);
    });
  });
});
