import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { ErrorService } from 'app/services/error.service';
import { ApplicationProgress, LendingApplicationsService } from 'app/services/lending-applications.service';
import { OfferService } from 'app/services/offer.service';
import { LoadingService } from 'app/services/loading.service';
import { LoggingService } from 'app/services/logging.service';
import { SupplierService } from 'app/services/supplier.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { invoiceResponseResponseFactory } from 'app/test-stubs/factories/invoice';
import { AgreementService } from 'app/services/agreement.service';
import {
  ALL_lendingApplications,
  COMPLETED_lendingApplications,
  DISREGARDED_lendingApplications,
  lendingApplicationFactory,
  lendingApplicationsResponseFactory
} from 'app/test-stubs/factories/lending-application';
import { offer, offerFactory, offerWca } from 'app/test-stubs/factories/lending/offers';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { supplierInfoBeerStore } from 'app/test-stubs/factories/supplier';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { LendingApplicationFlowComponent } from './lending-application-flow.component';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingComponent } from 'app/components/utilities/loading/loading.component';
import { offer$, offers$, offerWca$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { Offer } from 'app/models/api-entities/offer';
import Bugsnag from '@bugsnag/js';
import { Merchant } from 'app/models/api-entities/merchant';
import { ZttResponse } from 'app/models/api-entities/response';
import { Invoice } from 'app/models/api-entities/invoice';

describe('LendingApplicationFlowComponent', () => {
  let component: LendingApplicationFlowComponent;
  let fixture: ComponentFixture<LendingApplicationFlowComponent>;

  /**
   * Configure: AgreementService
   */
  let agreementService: AgreementService;

  // Spies:
  let hasActivePafAgreementForMerchantSpy: jasmine.Spy;

  /**
   * Configure: BankingFlowService
   */
  let bankingFlowService: BankingFlowService;

  // Spies:
  let merchantHasSelectedBankAccountSpy: jasmine.Spy;

  /**
   * Configure: BorrowerInvoiceService
   */
  let borrowerInvoiceService: BorrowerInvoiceService;

  // Variables:
  let invoiceResponse: ZttResponse<Invoice>;
  let invoice: Invoice;

  // Spies:
  let fetchInvoiceSpy: jasmine.Spy;
  let getActiveInvoiceSpy: jasmine.Spy;
  let getBorrowerInvoiceSpy: jasmine.Spy;
  let hasActiveInvoiceSetSpy: jasmine.Spy;

  /**
   * Configure: ConfigurationService
   */
  let configurationService: ConfigurationService;

  // Spies:
  let disableInvoiceUiPropertySpy: jasmine.Spy;

  /**
   * Configure: DirectPaymentService
   */
  let directPaymentService: DirectPaymentService;

  // Spies:
  let hasActiveDirectDebitSetPropertySpy: jasmine.Spy;

  /**
   * Configure: ErrorService
   */
  let errorService: ErrorService;

  /**
   * Configure: LendingApplicationsService
   */
  let lendingApplicationsService: LendingApplicationsService;

  // Variables:
  let lendingApplicationsResponse: ZttResponse<LendingApplication[]>;
  let lendingApplications: LendingApplication[];
  let lendingApplication: LendingApplication;

  // Spies:
  let loadApplicationsSpy: jasmine.Spy;
  let lendingApplicationsPropertySpy: jasmine.Spy;
  let lendingApplicationPropertySpy: jasmine.Spy;

  /**
   * Configure: LoggingService
   */
  let loggingService: LoggingService;

  /**
   * Configure: LoadingService
   */
  let loadingService: LoadingService;

  /**
   * Configure: MerchantService
   */
  let merchantService: MerchantService;

  // Variables:
  let merchant: Merchant;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let locOfferPropertySpy: jasmine.Spy;
  let offerPropertySpy: jasmine.Spy;
  let selectedOfferPropertySpy: jasmine.Spy;

  /**
   * Configure: StateRoutingService
   */
  let stateRoutingService: StateRoutingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [ LendingApplicationFlowComponent, LoadingComponent ],
      providers: [
        AgreementService,
        BankingFlowService,
        BorrowerInvoiceService,
        BorrowerInvoiceService,
        ConfigurationService,
        CookieService,
        DirectPaymentService,
        ErrorService,
        LendingApplicationsService,
        LoadingService,
        LoggingService,
        MerchantService,
        OfferService,
        StateRoutingService,
        SupplierService,
        UtilityService
      ]
    });

    fixture = TestBed.createComponent(LendingApplicationFlowComponent);
    component = fixture.componentInstance;

    /**
     * =========================
     * HAPPY PATH CONFIGURATION:
     * =========================
     */

    /**
     * Setup: AgreementService
     */
    agreementService = TestBed.inject(AgreementService);

    // Set spies:
    hasActivePafAgreementForMerchantSpy = spyOn(agreementService, 'hasActivePafAgreementForMerchant').and.returnValue(false);

    /**
     * Setup: BankingFlowService
     */
    bankingFlowService = TestBed.inject(BankingFlowService);

    // Set spies:
    spyOn(bankingFlowService, 'setAttributes');

    /**
     * Setup: BorrowerInvoiceService
     */
    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);

    // Set variables:
    invoiceResponse = invoiceResponseResponseFactory.build();
    invoice = invoiceResponse.data;

    // Set spies:
    fetchInvoiceSpy = spyOn(borrowerInvoiceService, 'fetchInvoice').and.returnValue(of(invoiceResponse));
    getActiveInvoiceSpy = spyOn(borrowerInvoiceService, 'getActiveInvoice').and.returnValue(invoice);
    getBorrowerInvoiceSpy = spyOn(borrowerInvoiceService, 'getBorrowerInvoice').and.returnValue(new BehaviorSubject(invoice));
    hasActiveInvoiceSetSpy = spyOn(borrowerInvoiceService, 'hasActiveInvoiceSet').and.returnValue(false);

    /**
     * Setup: Bugsnag
     */
    spyOn(Bugsnag, 'notify');

    /**
     * Setup: ConfigurationService
     */
    configurationService = TestBed.inject(ConfigurationService);

    // Set spies:
    disableInvoiceUiPropertySpy = spyOnProperty(configurationService, 'disableInvoiceUi').and.returnValue(true);

    /**
     * Setup: DirectPaymentService
     */
    directPaymentService = TestBed.inject(DirectPaymentService);

    // Set spies:
    hasActiveDirectDebitSetPropertySpy = spyOnProperty(directPaymentService, 'hasActiveDirectDebitSet').and.returnValue(false);

    /**
     * Setup: ErrorService
     */
    errorService = TestBed.inject(ErrorService);

    // Set spies:
    spyOn(errorService, 'show');

    /**
     * Setup: LendingApplicationsService
     */
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);

    // Set variables:
    lendingApplicationsResponse = lendingApplicationsResponseFactory.build({
      data: [lendingApplicationFactory.build({
        payee_invoice_num: invoice.invoice_number
      })]
    });
    lendingApplications = lendingApplicationsResponse.data;
    lendingApplication = lendingApplications[0];

    // Set spies:
    loadApplicationsSpy = spyOn(lendingApplicationsService, 'loadApplications').and.returnValue(of(lendingApplicationsResponse));
    lendingApplicationsPropertySpy = spyOnProperty(lendingApplicationsService, 'lendingApplications$').and.returnValue(new BehaviorSubject(lendingApplications));
    lendingApplicationPropertySpy = spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(lendingApplication));

    /**
     * Setup: LoadingService
     */
    loadingService = TestBed.inject(LoadingService);

    // Set spies:
    spyOn(loadingService, 'showMainLoader');
    spyOn(loadingService, 'hideMainLoader');

    /**
     * Setup: LoggingService
     */
    loggingService = TestBed.inject(LoggingService);

    // Set spies:
    spyOn(loggingService, 'log');

    /**
     * Setup: MerchantService
     */
    merchantService = TestBed.inject(MerchantService);

    // Set variables:
    merchant = merchantDataFactory.build();

    // Set spies:
    merchantHasSelectedBankAccountSpy = spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(true);
    spyOn(merchantService, 'getMerchant').and.returnValue(merchant);

    /**
     * Setup: OfferService
     */
    offerService = TestBed.inject(OfferService);

    // Set spies:
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
    locOfferPropertySpy = spyOnProperty(offerService, 'locOffer').and.returnValue(offer);
    offerPropertySpy = spyOnProperty(offerService, 'offer$').and.returnValue(offer$);
    spyOnProperty(offerService, 'currentOfferId').and.returnValue(offer.id);
    selectedOfferPropertySpy = spyOnProperty(offerService, 'selectedOffer').and.returnValue(offer);
    spyOn(offerService, 'loadSelectedOffer').and.callThrough();

    /**
     * Setup: StateRoutingService
     */
    stateRoutingService = TestBed.inject(StateRoutingService);

    // Set spies:
    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the mainLoader', () => {
    component.ngOnInit();

    expect(component.mainLoader).toBeDefined();
  });

  describe('get offer()', () => {
    describe('WITH a set offer$', () => {
      it('should set the offer', () => {
        expect(offerService.offer$.value).toEqual(offer);
        expect(component.offer).toEqual(offer);
      });
    }); // describe - with set offer

    describe('WITHOUT a set offer$', () => {
      beforeEach(() => {
        offerPropertySpy.and.callThrough();
        expect(offerService.offer$.value).toBeNull();
      });

      describe('WITH a locally stored Offer.id', () => {
        afterEach(() => {
          expect(selectedOfferPropertySpy).toHaveBeenCalledTimes(2); // determineOffer(), offerService.loadSelectedOffer()
          expect(offerService.loadSelectedOffer).toHaveBeenCalledTimes(1);
          expect(locOfferPropertySpy).not.toHaveBeenCalled();
          expect(offerService.offer$.value).toEqual(offer);
        });

        it('should load the selected Offer', () => {
          expect(component.offer).toEqual(offer);
        });
      }); // describe - WITH a locally stored Offer.id

      describe('WITHOUT a locally stored Offer.id', () => {
        beforeEach(() => {
          selectedOfferPropertySpy.and.returnValue(undefined);
        });

        afterEach(() => {
          expect(selectedOfferPropertySpy).toHaveBeenCalledTimes(1);
          expect(offerService.loadSelectedOffer).not.toHaveBeenCalled();
          expect(locOfferPropertySpy).toHaveBeenCalledTimes(1);
        });

        describe('WITH a valid LoC Offer', () => {
          it('should return the LoC Offer by default', () => {
            expect(component.offer).toEqual(offer);
            expect(offerService.offer$.value).toEqual(offer);
          });
        }); // describe - WITH a valid LoC offer

        describe('WITHOUT a valid LoC Offer', () => {
          beforeEach(() => {
            locOfferPropertySpy.and.returnValue(undefined);
          });

          it('should return undefined', () => {
            expect(component.offer).toBeUndefined();
            expect(offerService.offer$.value).toBeUndefined();
          });
        }); // describe - WITH a valid LoC offer
      }); // describe - WITHOUT a locally stored Offer.id
    }); // describe - WITHOUT a set offer$
  }); // describe - get offer()

  describe('ngOnInit()', () => {
    it('should initialize merchantHasBankAccount', () => {
      component.ngOnInit();

      expect(component.merchantHasBankAccount).toEqual(true);
    });

    it('should call showMainLoader', () => {
      component.ngOnInit();

      expect(loadingService.showMainLoader).toHaveBeenCalledTimes(1);
    });

    describe('initGetBorrowerInvoiceSubscription()', () => {
      describe('when getBorrowerInvoice returns a valid invoice', () => {
        it('should set the invoice properly', () => {
          component.ngOnInit();

          expect(component.invoice).toEqual(invoice);
        });

        describe('initFetchInvoiceSubscription()', () => {
          afterEach(() => {
            expect(borrowerInvoiceService.fetchInvoice).toHaveBeenCalledTimes(1);
          });

          it('should not throw an error when borrowerInvoiceService.fetchInvoice succeeds', () => {
            component.ngOnInit();

            expect(errorService.show).not.toHaveBeenCalled();
          });

          it('should throw an error when borrowerInvoiceService.fetchInvoice fails', () => {
            fetchInvoiceSpy.and.returnValue(throwError(internalServerErrorFactory.build()));

            component.ngOnInit();

            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadInvoiceError);
          });
        }); // describe - initFetchInvoiceSubscription()
      }); // describe - when getBorrowerInvoice returns a valid invoice

      describe('when getBorrowerInvoice returns an invalid invoice', () => {
        beforeEach(() => {
          getBorrowerInvoiceSpy.and.returnValue(new BehaviorSubject(null));
        });

        it('should set invoice to null, not call fetchInvoice()', () => {
          component.ngOnInit();

          expect(component.invoice).toBeNull();
          expect(borrowerInvoiceService.fetchInvoice).not.toHaveBeenCalled();
        });
      }); // describe - hasActiveInvoiceSet is false
    }); // describe - initGetBorrowerInvoiceSubscription()

    describe('initLoadApplicationsSubscription()', () => {
      describe('WITHOUT a valid component offer', () => {
        beforeEach(() => {
          offerPropertySpy.and.returnValue(new BehaviorSubject(null));
          selectedOfferPropertySpy.and.returnValue(undefined);
          locOfferPropertySpy.and.returnValue(undefined);
        });

        afterEach(() => {
          expect(component.offer).toEqual(undefined);
        });

        it('should trigger an error', () => {
          component.ngOnInit();

          const logMessage: LogMessage = { message: `Selecting an offer for application has failed.`, severity: LogSeverity.error };
          expect(loggingService.log).toHaveBeenCalledWith(logMessage);
          expect(errorService.show).toHaveBeenCalledWith(UiError.getOffers);
        });
      }); // describe - WITHOUT a valid component offer

      describe('WITH a valid component offer', () => {
        describe('when loadApplications() is SUCCESSFUL', () => {
          it('should set loadApplications subscriptions', () => {
            component.ngOnInit();

            expect(lendingApplicationsService.loadApplications).toHaveBeenCalledTimes(1);
          });

          describe('initGetLendingApplicationsSubscription()', () => {
            it('should assign lending applications', () => {
              component.ngOnInit();

              expect(lendingApplicationsPropertySpy).toHaveBeenCalledTimes(1);
              expect(component.applications).toEqual(lendingApplications);
            });

            describe('when lending applications exist', () => {
              it('should try to assign current processing lending application', () => {
                spyOn(lendingApplicationsService, 'setProcessingApplicationForOffer');

                component.ngOnInit();

                expect(lendingApplicationsService.setProcessingApplicationForOffer).toHaveBeenCalledOnceWith(lendingApplications, offer.id);
              });
            }); // describe - when lending applications exist

            describe('when lending applications do not exist', () => {
              beforeEach(() => {
                lendingApplicationsPropertySpy.and.returnValue(new BehaviorSubject(null));
              });

              it('should not try to assign current processing lending application', () => {
                spyOn(lendingApplicationsService, 'setProcessingApplicationForOffer');

                component.ngOnInit();

                expect(lendingApplicationsService.setProcessingApplicationForOffer).not.toHaveBeenCalled();
              });
            }); // describe - when lending applications do not exist
          }); // describe - initGetLendingApplicationsSubscription()

          describe('initGetLendingApplicationSubscription()', () => {
            it('should assign current lending application', () => {
              component.ngOnInit();

              expect(lendingApplicationPropertySpy).toHaveBeenCalledTimes(1);
              expect(component.application).toEqual(lendingApplication);
            });
          }); // describe - initGetLendingApplicationSubscription()

          describe('redirect()', () => {
            describe('when direct debit is set', () => {
              beforeEach(() => {
                hasActiveDirectDebitSetPropertySpy.and.returnValue(true);
              });

              it('should navigate to direct_debit_prerequisites', () => {
                component.ngOnInit();

                expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.direct_debit_prerequisites, true);
              });
            }); // describe - when direct debit is set

            describe('when no direct debit is set', () => {
              describe('when merchant has active PAF agreement', () => {
                beforeEach(() => {
                  hasActivePafAgreementForMerchantSpy.and.returnValue(true);
                });

                it('should navigate to pre_authorized_financing_prerequisites', () => {
                  component.ngOnInit();

                  expect(agreementService.hasActivePafAgreementForMerchant).toHaveBeenCalledWith(merchant.id);
                  expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.pre_authorized_financing_prerequisites, true);
                });
              }); // describe - when merchant has active PAF agreement

              describe('when merchant does not have active PAF agreement', () => {
                describe('when application is set', () => {
                  describe('when has an active invoice set', () => {
                    beforeEach(() => {
                      hasActiveInvoiceSetSpy.and.returnValue(true);
                    });

                    it('should not call errorService when the active invoices matches the set application', () => {
                      component.ngOnInit();

                      expect(borrowerInvoiceService.getActiveInvoice).toHaveBeenCalledOnceWith();
                      expect(errorService.show).not.toHaveBeenCalled();
                    });

                    it('should call errorService when the active invoices does not match the set application', () => {
                      const activeInvoice = lendingApplicationFactory.build({ id: 'lap_99' });
                      getActiveInvoiceSpy.and.returnValue(activeInvoice);

                      component.ngOnInit();

                      expect(borrowerInvoiceService.getActiveInvoice).toHaveBeenCalledWith();
                      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.appInProgressError);
                    });
                  }); // describe - when has an active invoice set

                  describe('handleCurrentApplication()', () => {
                    function checkApplyForOfferHandling(lendingApplicationStates: LendingApplication[], offer: Offer) {
                      const applyForOfferSpy = spyOn<any>(component, 'applyForOffer'); // eslint-disable-line

                      lendingApplicationStates.forEach(lendingApplication => {
                        lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));

                        component.ngOnInit();

                        expect(applyForOfferSpy).toHaveBeenCalledOnceWith(offer);

                        applyForOfferSpy.calls.reset();
                      }); // lendingApplicationStates.forEach
                    }

                    describe('if application belongs to current offer,', () => {
                      describe('and is in progress', () => {
                        beforeEach(() => {
                          spyOn(lendingApplicationsService, 'isApplicationInProgress').and.returnValue(true);
                        });

                        it('should call handleInProgressApplication()', () => {
                          const handleInProgressApplicationSpy = spyOn<any>(component, 'handleInProgressApplication'); // eslint-disable-line

                          component.ngOnInit();

                          expect(lendingApplicationsService.isApplicationInProgress).toHaveBeenCalledWith(lendingApplication.state);
                          expect(handleInProgressApplicationSpy).toHaveBeenCalledOnceWith(lendingApplication.state);
                        });

                        describe('when handleInProgressApplication() is called', () => {
                          function checkInProgressApplicationHandling(applicationProgress: ApplicationProgress, destination: string) {
                            spyOn(lendingApplicationsService, 'getApplicationProgress').and.returnValue(applicationProgress);

                            component.ngOnInit();

                            expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(destination, true);
                          }

                          it('should navigate to approval_prerequisites when it is ApplicationProgress.before_approved', () => {
                            checkInProgressApplicationHandling(ApplicationProgress.before_approved, AppRoutes.application.approval_prerequisites);
                          });

                          it('should navigate to approval_post when it is ApplicationProgress.approved', () => {
                            checkInProgressApplicationHandling(ApplicationProgress.approved, AppRoutes.application.approval_post);
                          });

                          it('should navigate to completing_lending_application when it is ApplicationProgress.completing', () => {
                            checkInProgressApplicationHandling(ApplicationProgress.completing, AppRoutes.application.completing_lending_application);
                          });

                          it('should log and trigger an error when ApplicationProgress.invalid', () => {
                            spyOn(lendingApplicationsService, 'getApplicationProgress').and.returnValue(ApplicationProgress.invalid);

                            component.ngOnInit();

                            expect(stateRoutingService.navigate).not.toHaveBeenCalled();

                            const logMessage: LogMessage = { message: `In progress application did not match any in progress states.`, severity: LogSeverity.error };
                            expect(loggingService.log).toHaveBeenCalledWith(logMessage);

                            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.appInProgressError);
                          });
                        }); // describe - handleInProgressApplication()
                      });

                      it('should call applyForOffer with correct offer when COMPLETED state', () => {
                        checkApplyForOfferHandling(COMPLETED_lendingApplications, offer);
                      });

                      it('should call applyForOffer with correct offer when DISREGARDED', () => {
                        checkApplyForOfferHandling(DISREGARDED_lendingApplications, offer);
                      });

                      it('should call applyForOffer with correct offer when in an unsupported state, ', () => {
                        checkApplyForOfferHandling([undefined], offer);
                      });
                    }); // describe - if application belongs to current offer

                    describe('if application does not belongs to current offer,', () => {
                      const testOffer = offerFactory.build({ id: 'lo_3' });

                      beforeEach(() => {
                        offerPropertySpy.and.returnValue(new BehaviorSubject(testOffer));
                      });

                      it('should call applyForOffer with correct offer, regardless of the state of the application', () => {
                        checkApplyForOfferHandling(ALL_lendingApplications, testOffer);
                      });
                    }); // describe = if application does not belongs to current offer
                  }); // describe - handleCurrentApplication()
                }); // describe - when application is set

                describe('when application is not set', () => {
                  beforeEach(() => {
                    lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(null));
                  });

                  it('should apply for offer (and log it)', () => {
                    component.ngOnInit();

                    const merchant = merchantDataFactory.build();
                    const message = `[MERCHANT_INITIATING_LOC_APPLICATION,${ merchant.id },${ offer.id }] Merchant ${ merchant.name } is initiating a new Line of Credit application`;
                    const logMessage: LogMessage = { message: message, severity: LogSeverity.info };
                    expect(loggingService.log).toHaveBeenCalledOnceWith(logMessage);
                  });
                }); // describe - when application is not set
              }); // describe - when merchant does not have active PAF agreement
            }); // describe - when direct debit is not set
          }); // describe - redirect()
        }); // describe - when loadApplications() is successful

        describe('when loadApplications() is unsuccessful', () => {
          beforeEach(() => {
            loadApplicationsSpy.and.returnValue(throwError(internalServerErrorFactory.build()));
          });

          it('should hide the loader, and show a UI error', () => {
            component.ngOnInit();

            expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadLendingApplications);
          });
        }); // describe - when loadApplications() is unsuccessful
      }); // describe - WITH a valid component offer
    }); // describe - initLoadApplicationsSubscription()
  }); // describe - ngOnInit()

  describe('ngOnDestroy()', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()

  describe('applyForOffer()', () => {
    beforeEach(() => {
      lendingApplicationsPropertySpy.and.returnValue(new BehaviorSubject(null));
      lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(null));
    });

    describe('OfferType.LineOfCredit', () => {
      describe('applyForLocOffer()', () => {
        it('should call logApplyForOffer(), and generate a proper message', () => {
          component.ngOnInit();

          const expectedAppType = 'Line of Credit';
          const expectedTag = 'MERCHANT_INITIATING_LOC_APPLICATION';
          const expectedMessage = `[${ expectedTag },${ merchant.id },${ offer.id }] Merchant ${ merchant.name } is initiating a new ${ expectedAppType } application`;
          const expectedLogMessage: LogMessage = {
            message: expectedMessage, severity: LogSeverity.info
          };

          expect(loggingService.log).toHaveBeenCalledOnceWith(expectedLogMessage);
        });

        describe('when active invoice is set', () => {
          beforeEach(() => {
            hasActiveInvoiceSetSpy.and.returnValue(true);
          });

          it('should navigate to select lending offer when invoice is found', inject([SupplierService], (supplierService: SupplierService) => {
            spyOn(borrowerInvoiceService, 'invoiceAsSupplierInformation').and.returnValue(supplierInfoBeerStore);
            spyOn(supplierService, 'setCurrentSupplierInformation');

            component.ngOnInit();

            expect(borrowerInvoiceService.hasActiveInvoiceSet).toHaveBeenCalledTimes(1);
            expect(supplierService.setCurrentSupplierInformation).toHaveBeenCalledOnceWith(supplierInfoBeerStore);
            expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
          }));
        }); // describe - when active invoice is set

        describe('when KYC fails', () => {
          beforeEach(() => {
            spyOn(merchantService, 'isKycFailed').and.returnValue(true);
          });

          describe('when blockOnKycFailure is true', () => {
            beforeEach(() => {
              spyOn(offerService, 'blockOnKycFailure').and.returnValue(true);
            });

            it('should navigate to kyc_failed', () => {
              component.ngOnInit();

              expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.error.kyc_failed, true);
            });
          }); // describe - when blockOnKycFailure is false

          describe('when blockOnKycFailure is false', () => {
            beforeEach(() => {
              spyOn(offerService, 'blockOnKycFailure').and.returnValue(false);
            });

            it('should not navigate to kyc_failed', () => {
              component.ngOnInit();

              expect(stateRoutingService.navigate).not.toHaveBeenCalledWith(AppRoutes.error.kyc_failed);
            });
          }); // describe - when blockOnKycFailure is false
        });// describe - when KYC fails

        describe('when invoice UI is enabled', () => {
          beforeEach(() => {
            disableInvoiceUiPropertySpy.and.returnValue(false);
          });

          it('should navigate to select_payee', () => {
            component.ngOnInit();

            expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_payee, true);
          });
        }); // describe - when invoice UI is enabled

        it('should navigate to select_lending_offer', () => {
          component.ngOnInit();

          expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
        });
      }); // describe - applyForLocOffer();
    }); // describe - OfferType.LineOfCredit

    describe('OfferType.WorkingCapitalAdvance', () => {
      beforeEach(() => {
        offerPropertySpy.and.returnValue(offerWca$);
      });

      describe('applyForWcaOffer()', () => {
        it('should call logApplyForOffer(), and generate a proper message', () => {
          component.ngOnInit();

          const expectedAppType = 'Working Capital Advance';
          const expectedTag = 'MERCHANT_INITIATING_WCA_APPLICATION';
          const expectedMessage = `[${ expectedTag },${ merchant.id },${ offerWca.id }] Merchant ${ merchant.name } is initiating a new ${ expectedAppType } application`;
          const expectedLogMessage: LogMessage = {
            message: expectedMessage, severity: LogSeverity.info
          };

          expect(loggingService.log).toHaveBeenCalledOnceWith(expectedLogMessage);
        });

        describe('when merchant has no selected bank account', () => {
          beforeEach(() => {
            merchantHasSelectedBankAccountSpy.and.returnValue(false);
          });

          describe('setBankingFlowSubscriptions()', () => {
            it('should go to dashboard when cancel event is triggered', () => {
              component.ngOnInit();

              expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.set_up_bank, true);

              bankingFlowService.triggerCancelEvent();

              expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
              expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
            });

            it('should go to select_lending_offer when complete event is triggered', () => {
              component.ngOnInit();
              bankingFlowService.triggerCompleteEvent();

              expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.set_up_bank, true); // first time
              expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.select_lending_offer, true); // second time
              expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
            });
          }); // describe - setBankingFlowSubscriptions()

          it('should set banking parameters and navigate to set_up_bank', () => {
            component.ngOnInit();

            expect(bankingFlowService.setAttributes).toHaveBeenCalledWith(false);
            expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.set_up_bank, true);
          });
        }); // describe - when merchant has no selected bank account

        describe('when merchant has selected bank account', () => {
          it('should navigate to select_lending_offer', () => {
            component.ngOnInit();

            expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
          });
        }); // describe - when merchant has selected bank account
      }); // describe - applyForWcaOffer();
    }); // describe - OfferType.WorkingCapitalAdvance

    describe('OfferType is invalid', () => {
      it('should show a specific error', () => {
        const invalidOffer = offerFactory.build({
          application_prerequisites: {
            payee: null,
            offer_type: null,
          }
        });
        offerPropertySpy.and.returnValue(new BehaviorSubject(invalidOffer));

        component.ngOnInit();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
        expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      });
    }); // describe - for unsupported offer
  }); // describe - applyForOffer()
});
