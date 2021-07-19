import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { EditMerchantComponent } from 'app/components/states/edit-merchant/edit-merchant.component';
import { UiError } from 'app/models/ui-error';
import { MerchantUpdateThrottling } from 'app/services/business-logic/merchant-update-throttling';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { OfferService } from 'app/services/offer.service';
import { UblService } from 'app/services/ubl.service';
import { LoadingService } from 'app/services/loading.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { TransactionsService } from 'app/services/transactions.service';
import { UtilityService } from 'app/services/utility.service';

import { BsModalRef, BsModalService, ModalModule, ModalOptions } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActiveUblsComponent } from './active-ubls.component';

describe('ActiveUblsComponent', () => {
  let component: ActiveUblsComponent;
  let fixture: ComponentFixture<ActiveUblsComponent>;

  /**
   * Configure: UblService
   */
  let ublService: UblService;

  // Spies:
  let loadEmptyUbls$: jasmine.Spy;
  let loadEmptyMerchantSpy: jasmine.Spy;

  // Stubs:
  const loadUbls$ = of(null);
  const loadMerchant$ = of(null);

  let offerService: OfferService;
  let merchantService: MerchantService;
  let configurationService: ConfigurationService;
  let modalService: BsModalService;

  // Spies
  let isKycFailedSpy: jasmine.Spy;
  let isCOECheckFailed: jasmine.Spy;
  let merchantSelfEditEnabledSpy: jasmine.Spy;
  let showModalSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        ModalModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [ ActiveUblsComponent, EditMerchantComponent ],
      providers: [
        BsModalService,
        BusinessPartnerService,
        ConfigurationService,
        CookieService,
        ErrorService,
        OfferService,
        UblService,
        LoadingService,
        LoggingService,
        MerchantService,
        TransactionsService,
        UtilityService,
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveUblsComponent);
    component = fixture.componentInstance;

    configurationService = TestBed.inject(ConfigurationService);
    offerService = TestBed.inject(OfferService);
    merchantService = TestBed.inject(MerchantService);
    modalService = TestBed.inject(BsModalService);

    /**
     * Setup: UblService
     */
    // Inject:
    ublService = TestBed.inject(UblService);

    // Set spies:
    loadEmptyUbls$ = spyOn(ublService, 'loadUbls$').and.returnValue(loadUbls$);
    loadEmptyMerchantSpy = spyOn(merchantService, 'loadMerchant').and.returnValue(loadMerchant$);

    // Spies
    isKycFailedSpy = spyOn(merchantService, 'isKycFailed');
    isCOECheckFailed = spyOn(merchantService, 'isCOECheckFailed');
    merchantSelfEditEnabledSpy = spyOnProperty(configurationService, 'merchantSelfEditEnabled');
    showModalSpy = spyOn(modalService, 'show').and.returnValue(new BsModalRef());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should call loadUbls$()', () => {
      component.ngOnInit();

      expect(ublService.loadUbls$).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnInit()

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()

  describe('loadUbls$()', () => {
    it('should have hasPaymentPlan flag initialized to false as default value', () => {
      expect(component.hasPaymentPlan).toBeFalse();
    });

    it('should call loadUbls$ and hasPaymentPlan$ in service and set hasPaymentPlan to false if no ubl has an active payment plan', () => {
      spyOnProperty(ublService, 'hasPaymentPlan$').and.returnValue(new BehaviorSubject(false));

      fixture.detectChanges();

      expect(ublService.loadUbls$).toHaveBeenCalledTimes(1);
      expect(component.hasPaymentPlan).toBeFalse();
    });

    it('should call loadUbls$ and hasPaymentPlan$ in service and set hasPaymentPlan to true if a ubl has an active payment plan', () => {
      spyOnProperty(ublService, 'hasPaymentPlan$').and.returnValue(new BehaviorSubject(true));

      fixture.detectChanges();

      expect(ublService.loadUbls$).toHaveBeenCalledTimes(1);
      expect(component.hasPaymentPlan).toBeTrue();
    });

    it('should call ErrorService when loadUbls$ returns an error', () => {
      const errorService = TestBed.inject(ErrorService);
      spyOn(errorService, 'show');
      loadEmptyUbls$.and.returnValue(throwError(new HttpErrorResponse({})));

      fixture.detectChanges();

      expect(errorService.show).toHaveBeenCalledWith(UiError.loadUbls);
    });
  }); // describe - loadUbls$()

  describe('loadMerchant()', () => {
    it('should have isDelinquent flag initialized to false as default value', () => {
      expect(component.isDelinquent).toBeFalse();
    });

    it('should call loadMerchant$ and isDelinquent$ in service and set isDelinquent to false if merchant is not delinquent', () => {
      spyOnProperty(merchantService, 'isDelinquent$').and.returnValue(new BehaviorSubject(false));

      fixture.detectChanges();

      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      expect(component.isDelinquent).toBeFalse();
    });

    it('should call loadMerchant$ and isDelinquent$ in service and set isDelinquent to true if merchant is delinquent', () => {
      spyOnProperty(merchantService, 'isDelinquent$').and.returnValue(new BehaviorSubject(true));

      fixture.detectChanges();

      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      expect(component.isDelinquent).toBeTrue();
    });

    it('should call ErrorService when loadMerchant returns an error', () => {
      const errorService = TestBed.inject(ErrorService);
      spyOn(errorService, 'show');
      loadEmptyMerchantSpy.and.returnValue(throwError(new HttpErrorResponse({})));

      fixture.detectChanges();

      expect(errorService.show).toHaveBeenCalledWith(UiError.general);
    });
  }); // describe - loadUbls$()

  describe('isCovidDisabled()', () => {
    it('isCovidDisabled should return true if it is configured as true', () => {
      spyOnProperty(configurationService, 'covidFinancingDisabled', 'get').and.returnValue(true);

      const result = component.isCovidDisabled;

      expect(result).toEqual(true);
    });

    it('isCovidDisabled should return false if it is configured as false', () => {
      spyOnProperty(configurationService, 'covidFinancingDisabled', 'get').and.returnValue(false);

      const result = component.isCovidDisabled;

      expect(result).toEqual(false);
    });
  });

  describe('isWcaCardDisabled()', () => {
    it('disableWcaCard should return true if it is configured as true', () => {
      spyOnProperty(configurationService, 'disableWcaCard', 'get').and.returnValue(true);

      const result = component.isWcaCardDisabled;

      expect(result).toEqual(true);
    });

    it('isWcaCardDisabled should return false if it is configured as false', () => {
      spyOnProperty(configurationService, 'disableWcaCard', 'get').and.returnValue(false);

      const result = component.isWcaCardDisabled;

      expect(result).toEqual(false);
    });
  });

  describe('isInvoiceUiDisabled()', () => {
    it('isInvoiceUiDisabled should return true if it is configured as true', () => {
      spyOnProperty(configurationService, 'disableInvoiceUi', 'get').and.returnValue(true);

      const result = component.isInvoiceUiDisabled;

      expect(result).toEqual(true);
    });

    it('isInvoiceUiDisabled should return false if it is configured as false', () => {
      spyOnProperty(configurationService, 'disableInvoiceUi', 'get').and.returnValue(false);

      const result = component.isInvoiceUiDisabled;

      expect(result).toEqual(false);
    });
  });

  describe('isKycFailed getter', () => {
    it('should return true if merchantService helper is true', () => {
      isKycFailedSpy.and.returnValue(true);

      expect(component.isKycFailed).toBeTrue();
      expect(isKycFailedSpy).toHaveBeenCalledTimes(1);
    });

    it('should return false if merchantService helper is false', () => {
      isKycFailedSpy.and.returnValue(false);

      expect(component.isKycFailed).toBeFalse();
      expect(isKycFailedSpy).toHaveBeenCalledTimes(1);
    });
  }); // describe - isKycFailed getter

  describe('isNonFixableKycFailure getter', () => {
    describe('when COE check failed', () => {
      let canUpdateMerchantSpy: jasmine.Spy;
      let isMerchantUpdateInProgressSpy: jasmine.Spy;
      let blockOnKycFailureSpy: jasmine.Spy;

      beforeEach(() => {
        canUpdateMerchantSpy = spyOn(MerchantUpdateThrottling, 'canUpdateMerchant');
        isMerchantUpdateInProgressSpy = spyOn(MerchantUpdateThrottling, 'isMerchantUpdateInProgress');
        isCOECheckFailed.and.returnValue(true);
        blockOnKycFailureSpy = spyOn(offerService, 'blockOnKycFailure');
        fixture.detectChanges();
      });

      it('should return false if merchant can self-update and has KYC in progress', () => {
        // Note: Technically this one isn't possible because canUpdateMerchant would return false if isMerchantUpdateInProgress
        canUpdateMerchantSpy.and.returnValue(true);
        isMerchantUpdateInProgressSpy.and.returnValue(true);

        expect(component.isNonFixableKycFailure).toBeFalse();
      });

      it('should return false if merchant can self-update and has no KYC in progress', () => {
        canUpdateMerchantSpy.and.returnValue(true);
        isMerchantUpdateInProgressSpy.and.returnValue(false);

        expect(component.isNonFixableKycFailure).toBeFalse();
      });

      it('should return false if merchant cannot self-update and has KYC in progress', () => {
        canUpdateMerchantSpy.and.returnValue(false);
        isMerchantUpdateInProgressSpy.and.returnValue(true);

        expect(component.isNonFixableKycFailure).toBeFalse();
      });

      it('should return true if merchant cannot self-update and has block on Kyc true', () => {
        canUpdateMerchantSpy.and.returnValue(false);
        isMerchantUpdateInProgressSpy.and.returnValue(false);
        blockOnKycFailureSpy.and.returnValue(true);

        expect(component.isNonFixableKycFailure).toBeTrue();
      });

      it('should return false if merchant cannot self-update and has blockOnKyc false', () => {
        canUpdateMerchantSpy.and.returnValue(false);
        isMerchantUpdateInProgressSpy.and.returnValue(false);
        blockOnKycFailureSpy.and.returnValue(false);

        expect(component.isNonFixableKycFailure).toBeFalse();
      });
    }); // describe - 'when COE check failed'

    describe('when COE check passed', () => {
      let blockOnKycFailureSpy: jasmine.Spy;
      beforeEach(() => {
        isCOECheckFailed.and.returnValue(false);
        blockOnKycFailureSpy = spyOn(offerService, 'blockOnKycFailure');
        fixture.detectChanges();
      });

      it('should return true if merchant is Kyc failed and blockOnKycFailure is true', () => {
        isKycFailedSpy.and.returnValue(true);
        blockOnKycFailureSpy.and.returnValue(true);

        expect(component.isNonFixableKycFailure).toBeTrue();
      });

      it('should return false if merchant is Kyc failed and blockOnKycFailure is false', () => {
        isKycFailedSpy.and.returnValue(true);
        blockOnKycFailureSpy.and.returnValue(false);

        expect(component.isNonFixableKycFailure).toBeFalse();
      });

      it('should return false if merchant is passed KYC', () => {
        isKycFailedSpy.and.returnValue(false);

        expect(component.isNonFixableKycFailure).toBeFalse();
      });
    }); // describe - 'when COE check passed'
  }); // describe - isNonFixableKycFailure getter

  describe('isSelfFixableKycFailure getter', () => {
    describe('when merchantSelfEditEnabled feature is enabled', () => {
      let canUpdateMerchantSpy: jasmine.Spy;

      beforeEach(() => {
        canUpdateMerchantSpy = spyOn(MerchantUpdateThrottling, 'canUpdateMerchant');
        merchantSelfEditEnabledSpy.and.returnValue(true);
        fixture.detectChanges();
      });

      it('should return true if the merchant is Kyc failed for COE reason & can self-update', () => {
        isCOECheckFailed.and.returnValue(true);
        canUpdateMerchantSpy.and.returnValue(true);

        expect(component.isSelfFixableKycFailure).toBeTrue();
      });

      it('should return false if the merchant is not Kyc failed for COE reason & can self-update', () => {
        isCOECheckFailed.and.returnValue(false);
        canUpdateMerchantSpy.and.returnValue(true);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });

      it('should return false if the merchant is Kyc failed for COE reason & cannot self-update', () => {
        isCOECheckFailed.and.returnValue(true);
        canUpdateMerchantSpy.and.returnValue(false);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });

      it('should return false if the merchant is not Kyc failed for COE reason & cannot self-update', () => {
        isCOECheckFailed.and.returnValue(false);
        canUpdateMerchantSpy.and.returnValue(false);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });
    }); // describe - 'When feature is enabled'

    describe('when merchantSelfEditEnabled feature is disabled', () => {
      let canUpdateMerchantSpy: jasmine.Spy;

      beforeEach(() => {
        canUpdateMerchantSpy = spyOn(MerchantUpdateThrottling, 'canUpdateMerchant');
        merchantSelfEditEnabledSpy.and.returnValue(false);
        fixture.detectChanges();
      });

      it('should return false if the merchant is Kyc failed for COE reason & can self-update', () => {
        isCOECheckFailed.and.returnValue(true);
        canUpdateMerchantSpy.and.returnValue(true);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });

      it('should return false if the merchant is not Kyc failed for COE reason & can self-update', () => {
        isCOECheckFailed.and.returnValue(false);
        canUpdateMerchantSpy.and.returnValue(true);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });

      it('should return false if the merchant is Kyc failed for COE reason & cannot self-update', () => {
        isCOECheckFailed.and.returnValue(true);
        canUpdateMerchantSpy.and.returnValue(false);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });

      it('should return false if the merchant is not Kyc failed for COE reason & cannot self-update', () => {
        isCOECheckFailed.and.returnValue(false);
        canUpdateMerchantSpy.and.returnValue(false);

        expect(component.isSelfFixableKycFailure).toBeFalse();
      });
    }); // describe - 'When feature is disabled'
  }); // describe - isSelfFixableKycFailure getter

  describe('isKycSelfFixInProgress getter', () => {
    let isMerchantUpdateInProgressSpy: jasmine.Spy;

    beforeEach(() => {
      isMerchantUpdateInProgressSpy = spyOn(MerchantUpdateThrottling, 'isMerchantUpdateInProgress');
      fixture.detectChanges();
    });

    it('should return true if there is a merchant update in progress', () => {
      isMerchantUpdateInProgressSpy.and.returnValue(true);

      expect(component.isKycSelfFixInProgress).toBeTrue();
    });

    it('should return false if there is no merchant update in progress', () => {
      isMerchantUpdateInProgressSpy.and.returnValue(false);

      expect(component.isKycSelfFixInProgress).toBeFalse();
    });
  }); // describe - isKycSelfFixInProgress getter

  // MODALS

  describe('editMerchantModal', () => {
    it('showEditMerchant() should show the editMerchantModal', () => {
      expect(component.editMerchantModal).toBeDefined(); // Because ngOnInit has already run
      expect(component.editMerchantModalRef).toBeUndefined();

      component.showEditMerchant();

      const expectModalConfig: ModalOptions = {
        class: 'zt-modal mt-3 modal-xl modal-dialog-centered',
      };
      expect(component.editMerchantModal).toBeDefined();
      expect(component.editMerchantModalRef).toBeDefined();
      expect(showModalSpy).toHaveBeenCalledOnceWith(component.editMerchantModal, expectModalConfig);
    });

    it('hideEditMerchant() should hide the editMerchantModal', () => {
      component.showEditMerchant(); // Setup: Show the modal
      const hideModalSpy = spyOn(component.editMerchantModalRef, 'hide');

      component.hideEditMerchant();

      expect(hideModalSpy).toHaveBeenCalledTimes(1);
    });
  }); // describe - editMerchantModal
}); // describe - ActiveUblsComponent
