import { CurrencyPipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Models
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
// --- parent
// Helpers
import { ApplicationState, OfferState, OfferType } from 'app/models/api-entities/utility';
import { SupportedLanguage } from 'app/models/languages';
import { AppRoutes } from 'app/models/routes';
import { OfferComponent, OfferCtaState } from 'app/offer/offer.component';
import { LocalizeDatePipe } from 'app/pipes/localize-date.pipe';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingStatus } from 'app/services/banking-flow.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';

// Services
import { OfferService } from 'app/services/offer.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { applicationSummaryFactory } from 'app/test-stubs/factories/application-summary';
import { loadOffer$, noOffers$, offers$ } from 'app/test-stubs/factories/lending/offer-stubs';

// Fixtures
import { offer, offerFactory } from 'app/test-stubs/factories/lending/offers';

// Modules
import { TooltipModule } from 'ngx-bootstrap/tooltip';
// --- inherited
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

describe('OfferComponent', () => {
  let component: OfferComponent;
  let fixture: ComponentFixture<OfferComponent>;
  let htmlElement: HTMLElement;

  let ublService: UblService;
  let configurationService: ConfigurationService;

  /**
   * Configure: BankingFlowService
   */
  let bankAccountService: BankAccountService;
  let bankingFlowService: BankingFlowService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let offersSpy: jasmine.Spy;

  /**
   * Configure: LoggingService
   */
  let loggingService: LoggingService;

  /**
   * Configure: MerchantService
   */
  let merchantService: MerchantService;

  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot()
      ],
      declarations: [
        OfferComponent,
        LocalizeDatePipe,
        ZttCurrencyPipe
      ],
      providers: [
        BankAccountService,
        BankingFlowService,
        TranslateService,
        OfferService,
        LoggingService,
        ConfigurationService,
        UblService,
        MerchantService,
        // --- inherited
        CookieService,
        UtilityService,
        ErrorService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferComponent);
    component = fixture.componentInstance;
    htmlElement = fixture.nativeElement;

    /**
     * Setup: bankingFlowService
     */
    // Inject:
    bankAccountService = TestBed.inject(BankAccountService);
    bankingFlowService = TestBed.inject(BankingFlowService);

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);
    ublService = TestBed.inject(UblService);
    configurationService = TestBed.inject(ConfigurationService);

    // Set spies:
    spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    offersSpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    /**
     * Setup: LoggingService
     */
    // Inject:
    loggingService = TestBed.inject(LoggingService);

    // Set spies:
    spyOn(loggingService, 'log');

    /**
     * Setup: MerchantService
     */
    // Inject:
    merchantService = TestBed.inject(MerchantService);
    spyOn(merchantService, 'getMerchantOutstandingBalance').and.returnValue(0);

    translateService = TestBed.inject(TranslateService);
    spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.en);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should have flag attributes initialized', () => {
      component.ngOnInit();

      expect(component.offerType).toEqual(OfferType.LineOfCredit);
      expect(component.offerMetrics).toBeTrue();
    });
  }); // describe - ngOnInit()

  describe('ngOnDestroy()', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()

  describe('updateOffer()', () => {
    function checkOfferFlagsUndefined() {
      expect(component.covidFinancingDisabled).toBeUndefined();
      expect(component.hasInProgressApplication).toBeUndefined();
      expect(component.hasActionableInProgressApplication).toBeUndefined();
      expect(component.isOfferAvailable).toBeUndefined();
      expect(component.offerFundsAccessible).toBeUndefined();
      expect(component.offerCtaState).toBeUndefined();
    }

    function checkOfferMetricsUndefined() {
      expect(component.balanceOutstanding).toBeUndefined();
      expect(component.offerAvailableAmount).toBeUndefined();
      expect(component.offerMaxAmount).toBeUndefined();
      expect(component.offerMinAmount).toBeUndefined();
      expect(component.offerCapacity).toBeUndefined();
      expect(component.offerPendingAmount).toBeUndefined();
      expect(component.offerExpiryDate).toBeUndefined();
    }

    beforeEach(() => {
      spyOn(offerService, 'checkOfferTypeValid').and.callThrough();
    });

    describe('checkOfferTypeValid() returns true', () => {
      beforeEach(() => {
        component.offerType = OfferType.LineOfCredit;
      });

      describe('when checkOfferValid() returns true', () => {
        beforeEach(() => {
          spyOn(offerService, 'checkOfferValid').and.returnValue(true);
        });

        describe('setOfferMetrics()', () => {
          describe('when offerMetrics is true', () => {
            beforeEach(() => {
              component.offerMetrics = true;
            });

            it('should set balanceOutstanding', () => {
              component.ngOnInit();

              expect(merchantService.getMerchantOutstandingBalance).toHaveBeenCalledOnceWith();
              expect(component.balanceOutstanding).toBeDefined();
            });

            it('should set offerAvailableAmount', () => {
              spyOn(offerService, 'getOfferAvailableAmount').and.callThrough();

              component.ngOnInit();

              expect(offerService.getOfferAvailableAmount).toHaveBeenCalledWith(offer);
              expect(offerService.getOfferAvailableAmount).toHaveBeenCalledTimes(3);
              expect(component.offerAvailableAmount).toBeDefined();
            });

            it('should set offerCapacity', () => {
              spyOn(offerService, 'getOfferCapacity').and.callThrough();

              component.ngOnInit();

              expect(offerService.getOfferCapacity).toHaveBeenCalledOnceWith(offer);
              expect(component.offerCapacity).toBeDefined();
            });

            describe('offerMaxAmount', () => {
              let maxAmountElement: DebugElement['nativeElement'];

              beforeEach(() => {
                maxAmountElement = htmlElement.querySelector('[data-ng-id="offerMaxAmount"]');
              });

              it('should set offerMaxAmount', () => {
                component.ngOnInit();

                expect(component.offerMaxAmount).toBeDefined();
              });

              it('should show the max amount when showOffer is true', () => {
                spyOnProperty(bankingFlowService, 'status').and.returnValue(BankingStatus.bank_status_optimal);

                fixture.detectChanges();

                const currencyPipe = new CurrencyPipe('EN');
                const maxAmount = currencyPipe.transform(offer.max_principal_amount, 'CAD', 'symbol-narrow', '1.2-2');

                expect(maxAmountElement.innerHTML).toContain(maxAmount);
              });

              it('should show -- -- when showOffer is false', () => {
                const offerProcessing = offerFactory.build({state: OfferState.processing});
                spyOnProperty(offerService, 'locOffer').and.returnValue(offerProcessing);

                fixture.detectChanges();

                expect(maxAmountElement.innerHTML).toContain('-- --');
              });
            }); // describe - offerMaxAmountDisplay

            it('should set offerMinAmount', () => {
              component.ngOnInit();

              expect(component.offerMinAmount).toBeDefined();
            });

            it('should set offerPendingAmount', () => {
              component.ngOnInit();

              expect(component.offerPendingAmount).toBeDefined();
            });

            it('should set offerExpiryDate', () => {
              const date = new Date();
              spyOn(offerService, 'getExpiryDate').and.returnValue(date);

              component.ngOnInit();

              expect(offerService.getExpiryDate).toHaveBeenCalledOnceWith(offer);
              expect(component.offerExpiryDate).toEqual(date);
            });
          }); // describe - offerMetrics is true

          describe('when offerMetrics is false', () => {
            it('should not set any metrics', () => {
              component.offerMetrics = false;

              component.ngOnInit();

              checkOfferMetricsUndefined();
            });
          }); // describe - when offerMetrics is false
        }); // describe - setOfferMetrics()

        describe('setOfferStates()', () => {
          describe('getOfferCtaState()', () => {
            describe('OfferCtaState.connect', () => {
              afterEach(() => {
                component.ngOnInit();

                expect(component.offerCtaState).toEqual(OfferCtaState.connect);
              });

              it('should return OfferCtaState.connect when BankingStatus is need_bank_account and offer is rejected', () => {
                const offerRejected = offerFactory.build({state: OfferState.rejected});
                spyOnProperty(offerService, 'locOffer').and.returnValue(offerRejected);

                spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.need_bank_account);
              });

              it('should return OfferCtaState.connect when BankingStatus is need_bank_account and offer is expired', () => {
                const offerExpired = offerFactory.build({state: OfferState.expired});
                spyOnProperty(offerService, 'locOffer').and.returnValue(offerExpired);

                spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.need_bank_account);
              });

              it('should return OfferCtaState.connect when BankingStatus is need_sales_volume and offer is rejected', () => {
                const offerRejected = offerFactory.build({state: OfferState.rejected});
                spyOnProperty(offerService, 'locOffer').and.returnValue(offerRejected);
                spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.need_sales_volume);
              });

              it('should return OfferCtaState.connect when BankingStatus is need_sales_volume and offer is expired', () => {
                const offerExpired = offerFactory.build({state: OfferState.expired});
                spyOnProperty(offerService, 'locOffer').and.returnValue(offerExpired);

                spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.need_sales_volume);
              });
            }); // describe - OfferCtaState.connect

            describe('OfferCtaState.reconnect', () => {
              beforeEach(() => {
                spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.need_connection_refresh);
              });

              afterEach(() => {
                component.ngOnInit();

                expect(component.offerCtaState).toEqual(OfferCtaState.reconnect);
              });

              it('should return OfferCtaState.reconnect when the offer is expired, and BankingStatus is need_connection_refresh', () => {
                const expiredOffer = offerFactory.build({state: OfferState.expired});
                spyOnProperty(offerService, 'locOffer').and.returnValue(expiredOffer);
              });

              it('should return OfferCtaState.reconnect when the offer is rejected, and BankingStatus is need_connection_refresh', () => {
                const rejectedOffer = offerFactory.build({state: OfferState.rejected});
                spyOnProperty(offerService, 'locOffer').and.returnValue(rejectedOffer);
              });
            }); // describe - OfferCtaState.reconnect

            describe('OfferCtaState.refresh', () => {
              beforeEach(() => {
                spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.bank_status_optimal);
              });

              afterEach(() => {
                component.ngOnInit();

                expect(component.offerCtaState).toEqual(OfferCtaState.refresh);
              });

              it('should return OfferCtaState.refresh when OfferState is expired', () => {
                const expiredOffer = offerFactory.build({state: OfferState.expired});
                spyOnProperty(offerService, 'locOffer').and.returnValue(expiredOffer);
              });
            }); // describe - OfferCtaState.refresh

            describe('OfferCtaState.processing', () => {
              afterEach(() => {
                component.ngOnInit();

                expect(component.offerCtaState).toEqual(OfferCtaState.processing);
              });

              it('should return OfferCtaState.processing when OfferState is pending', () => {
                const pendingOffer = offerFactory.build({state: OfferState.pending});
                spyOnProperty(offerService, 'locOffer').and.returnValue(pendingOffer);
              });

              it('should return OfferCtaState.processing when OfferState is processing', () => {
                const processingOffer = offerFactory.build({state: OfferState.processing});
                spyOnProperty(offerService, 'locOffer').and.returnValue(processingOffer);
              });

              it('should return OfferCtaState.processing when OfferState is undefined', () => {
                const undefinedOffer = offerFactory.build({state: undefined});
                spyOnProperty(offerService, 'locOffer').and.returnValue(undefinedOffer);
              });
            }); // describe - OfferCtaState.processing

            describe('OfferCtaState.not_needed', () => {
              afterEach(() => {
                component.ngOnInit();

                expect(component.offerCtaState).toEqual(OfferCtaState.not_needed);
              });

              describe('BankingStatus.need_connection_refresh with good Offer', () => {

                it('should return OfferCtaState.not_needed when OfferState is accepted', () => {
                  const acceptedOffer = offerFactory.build({state: OfferState.accepted});
                  spyOnProperty(offerService, 'locOffer').and.returnValue(acceptedOffer);
                });

                it('should return OfferCtaState.not_needed when OfferState is active', () => {
                  const activeOffer = offerFactory.build({state: OfferState.active});
                  spyOnProperty(offerService, 'locOffer').and.returnValue(activeOffer);
                });

                it('should return OfferCtaState.not_needed when OfferState is approved', () => {
                  const approvedOffer = offerFactory.build({state: OfferState.approved});
                  spyOnProperty(offerService, 'locOffer').and.returnValue(approvedOffer);
                });
              });

              describe('BankingStatus.bank_status_optimal when offer state is rejected ', () => {
                beforeEach(() => {
                  spyOn(bankAccountService, 'getBankingStatus').and.returnValue(BankingStatus.bank_status_optimal);
                });

                it('should return OfferCtaState.not_needed when OfferState is rejected', () => {
                    const rejectedOffer = offerFactory.build({state: OfferState.rejected});
                    spyOnProperty(offerService, 'locOffer').and.returnValue(rejectedOffer);
                });
              }); // describe - BankingStatus.bank_status_optimal
            }); // describe - OfferCtaState.processing
          }); // describe - getOfferCtaState()
        }); // describe - setOfferStates()

        describe('setOfferFlags()', () => {
          it('should set covidFinancingDisabled', () => {
            const covidFinancingDisabledSpy = spyOnProperty(configurationService, 'covidFinancingDisabled').and.callThrough();

            component.ngOnInit();

            expect(covidFinancingDisabledSpy).toHaveBeenCalledTimes(1);
            expect(component.covidFinancingDisabled).toBeDefined();
          });

          it('should set hasPaymentPlan$', () => {
            spyOnProperty(ublService, 'hasPaymentPlan$').and.returnValue(new BehaviorSubject(false));

            component.ngOnInit();

            expect(component.hasPaymentPlan).toBeFalse();
          });

          it('should set isDelinquent', () => {
            spyOnProperty(merchantService, 'isDelinquent$').and.returnValue(new BehaviorSubject(false));

            component.ngOnInit();

            expect(component.isDelinquent).toBeFalse();
          });

          describe('hasInProgressApplication', () => {
            it('should return true if applications_in_progress.length is greater than 0', () => {
              const appSummary = applicationSummaryFactory.build();
              const testOffer = offerFactory.build({applications_in_progress: [appSummary]});
              spyOnProperty(offerService, 'locOffer').and.returnValue(testOffer);

              component.ngOnInit();

              expect(component.hasInProgressApplication).toBeTrue();
            });

            it('should return false if applications_in_progress.length is 0', () => {
              component.ngOnInit();

              expect(component.hasInProgressApplication).toBeFalse();
            });

            it('should return false if applications_in_progress is undefined', () => {
              const testOffer = offerFactory.build({applications_in_progress: undefined});
              spyOnProperty(offerService, 'locOffer').and.returnValue(testOffer);

              component.ngOnInit();

              expect(component.hasInProgressApplication).toBeFalse();
            });
          }); // describe - hasInProgressApplication

          describe('hasActionableInProgressApplication', () => {
            it('should return true if applications_in_progress.length is greater than 0 that are in approved state', () => {
              const appSummary = applicationSummaryFactory.build();
              const testOffer = offerFactory.build({applications_in_progress: [appSummary]});
              spyOnProperty(offerService, 'locOffer').and.returnValue(testOffer);

              component.ngOnInit();

              expect(component.hasActionableInProgressApplication).toBeTrue();
            });

            it('should return false if applications_in_progress.length is 0', () => {
              component.ngOnInit();

              expect(component.hasActionableInProgressApplication).toBeFalse();
            });

            it('should return false if applications_in_progress is undefined', () => {
              const testOffer = offerFactory.build({applications_in_progress: undefined});
              spyOnProperty(offerService, 'locOffer').and.returnValue(testOffer);

              component.ngOnInit();

              expect(component.hasActionableInProgressApplication).toBeFalse();
            });

            it('should return false if applications_in_progress is defined but not actionable', () => {
              const appSummary = applicationSummaryFactory.build({state: ApplicationState.laasing});
              const testOffer = offerFactory.build({applications_in_progress: [appSummary]});
              spyOnProperty(offerService, 'locOffer').and.returnValue(testOffer);

              component.ngOnInit();

              expect(component.hasActionableInProgressApplication).toBeFalse();
            });
          }); // describe - hasActionableInProgressApplication

          it('should set isOfferAvailable', () => {
            spyOn(offerService, 'isOfferAvailable').and.callThrough();

            component.ngOnInit();

            expect(offerService.isOfferAvailable).toHaveBeenCalledOnceWith(offer);
            expect(component.isOfferAvailable).toBeDefined();
          });

          it('should set offerFundsAccessible', () => {
            spyOn(offerService, 'getOfferFundsAccessible').and.callThrough();

            component.ngOnInit();

            expect(offerService.getOfferFundsAccessible).toHaveBeenCalledOnceWith(offer);
            expect(component.offerFundsAccessible).toBeDefined();
          });

          it('should set blockOnKycFailure', () => {
            spyOn(offerService, 'blockOnKycFailure').and.callThrough();

            component.ngOnInit();

            expect(offerService.blockOnKycFailure).toHaveBeenCalledOnceWith(offer);
            expect(component.blockOnKycFailure).toBeDefined();
          });

          describe('showOffer', () => {
            it('should return false when OfferState is rejected', () => {
              const rejectedOffer = offerFactory.build({state: OfferState.rejected});
              spyOnProperty(offerService, 'locOffer').and.returnValue(rejectedOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeFalse();
            });

            it('should return false when OfferState is expired', () => {
              const expiredOffer = offerFactory.build({state: OfferState.expired});
              spyOnProperty(offerService, 'locOffer').and.returnValue(expiredOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeFalse();
            });

            it('should return false when OfferState is processing', () => {
              const processingOffer = offerFactory.build({state: OfferState.processing});
              spyOnProperty(offerService, 'locOffer').and.returnValue(processingOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeFalse();
            });

            it('should return false when OfferState is pending', () => {
              const pendingOffer = offerFactory.build({state: OfferState.pending});
              spyOnProperty(offerService, 'locOffer').and.returnValue(pendingOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeFalse();
            });

            it('should return false when OfferState is undefined', () => {
              const undefinedOffer = offerFactory.build({state: undefined});
              spyOnProperty(offerService, 'locOffer').and.returnValue(undefinedOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeFalse();
            });

            it('should return true when OfferState is approved', () => {
              const approvedOffer = offerFactory.build({state: OfferState.approved});
              spyOnProperty(offerService, 'locOffer').and.returnValue(approvedOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeTrue();
            });

            it('should return true when OfferState is accepted', () => {
              const acceptedOffer = offerFactory.build({state: OfferState.accepted});
              spyOnProperty(offerService, 'locOffer').and.returnValue(acceptedOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeTrue();
            });

            it('should return true when OfferState is active', () => {
              const activeOffer = offerFactory.build({state: OfferState.active});
              spyOnProperty(offerService, 'locOffer').and.returnValue(activeOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeTrue();
            });

            it('should return true when OfferState is approved', () => {
              const approvedOffer = offerFactory.build({state: OfferState.approved});
              spyOnProperty(offerService, 'locOffer').and.returnValue(approvedOffer);

              component.ngOnInit();

              expect(component.showOffer).toBeTrue();
            });
          }); // describe - showOffer

          describe('showOfferExpiry', () => {
            it('should be FALSE if offer has no expiry date', () => {
              const invalidExpiryOffer = offerFactory.build({expires_at: null});
              spyOnProperty(offerService, 'locOffer').and.returnValue(invalidExpiryOffer);

              component.ngOnInit();

              expect(component.showOfferExpiry).toBeFalse();
            });

            it('should be FALSE if showOffer is FALSE', () => {
              const rejectedOffer = offerFactory.build({state: OfferState.rejected});
              spyOnProperty(offerService, 'locOffer').and.returnValue(rejectedOffer);

              component.ngOnInit();

              expect(component.showOfferExpiry).toBeFalse();
            });

            it('should be TRUE if offer has expiry date and showOffer is TRUE', () => {
              spyOnProperty(offerService, 'locOffer').and.returnValue(offer);

              component.ngOnInit();

              expect(component.showOfferExpiry).toBeTrue();
            });
          }); // describe - showOfferExpiry
        }); // describe - setOfferFlags

        describe('setIsOfferDisabled()', () => {
          let isOfferAvailableSpy: jasmine.Spy;
          let getOfferFundsAccessibleSpy: jasmine.Spy;
          let hasPaymentPlanSpy$: jasmine.Spy;
          let isDelinquentSpy$: jasmine.Spy;
          let locOfferSpy: jasmine.Spy;
          let covidFinancingDisabledSpy: jasmine.Spy;

          beforeEach(() => {
            spyOnProperty(bankingFlowService, 'status').and.returnValue(BankingStatus.bank_status_optimal);
            isOfferAvailableSpy = spyOn(offerService, 'isOfferAvailable').and.returnValue(true);
            getOfferFundsAccessibleSpy = spyOn(offerService, 'getOfferFundsAccessible').and.returnValue(true);
            hasPaymentPlanSpy$ = spyOnProperty(ublService, 'hasPaymentPlan$').and.returnValue(new BehaviorSubject(false));
            isDelinquentSpy$ = spyOnProperty(merchantService, 'isDelinquent$').and.returnValue(new BehaviorSubject(false));
            locOfferSpy = spyOnProperty(offerService, 'locOffer').and.returnValue(offer);
            covidFinancingDisabledSpy = spyOnProperty(configurationService, 'covidFinancingDisabled').and.returnValue(false);
          });

          it('should return false if all checks pass', () => {
            component.ngOnInit();

            expect(component.isOfferDisabled).toBeFalse();
          });

          it('should set true if showOffer is false', () => {
            const offerProcessing = offerFactory.build({state: OfferState.processing});
            locOfferSpy.and.returnValue(offerProcessing);

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });

          it('should return true if isOfferAvailable is false', () => {
            isOfferAvailableSpy.and.returnValue(false);

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });

          it('should return true if offerFundsAccessible is false', () => {
            getOfferFundsAccessibleSpy.and.returnValue(false);

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });

          it('should return true if hasPaymentPlan$ is true', () => {
            hasPaymentPlanSpy$.and.returnValue(new BehaviorSubject(true));

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });

          it('should return true if isDelinquent$ is true', () => {
            isDelinquentSpy$.and.returnValue(new BehaviorSubject(true));

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });

          it('should return true if applications_in_progress is greater than 0', () => {
            const appSummary = applicationSummaryFactory.build();
            const testOffer = offerFactory.build({applications_in_progress: [appSummary]});
            locOfferSpy.and.returnValue(testOffer);

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });

          it('should return true if covidFinancingDisabled is true', () => {
            covidFinancingDisabledSpy.and.returnValue(true);

            component.ngOnInit();

            expect(component.isOfferDisabled).toBeTrue();
          });
        }); // describe - setIsOfferDisabled()
      }); // describe - when checkOfferValid() returns true

      describe('when checkOfferValid() returns false', () => {
        beforeEach(() => {
          offersSpy.and.returnValue(noOffers$);
          spyOn(offerService, 'checkOfferValid').and.callThrough();
        });

        it('should not set offer flags, or metrics', () => {
          component.ngOnInit();

          checkOfferFlagsUndefined();
          checkOfferMetricsUndefined();
        });
      }); // describe - when checkOfferValid() returns false
    }); // describe - when checkOfferValid() returns false

    describe('checkOfferTypeValid() returns false', () => {
      beforeEach(() => {
        component.offerType = undefined;
      });

      it('should trigger a checkOfferTypeValid() warning log when instanced without a valid OfferType', () => {
        component.ngOnInit();

        const logMessage: LogMessage = {
          message: 'Component initialized with undefined OfferType.',
          severity: LogSeverity.warn
        };

        expect(offerService.checkOfferTypeValid).toHaveBeenCalledWith(undefined);
        expect(loggingService.log).toHaveBeenCalledOnceWith(logMessage);
      });

      it('should not set any flags or metrics', () => {
        component.ngOnInit();

        checkOfferFlagsUndefined();
        checkOfferMetricsUndefined();
      });
    }); // describe - checkOfferTypeValid() returns false
  }); // describe - updateOffer()

  describe('initLendingSubscription()', () => {
    it('should get offers from service and call updateOffer()', () => {
      const updateOfferSpy = spyOn<any>(component, 'updateOffer'); // eslint-disable-line

      component.ngOnInit();

      expect(updateOfferSpy).toHaveBeenCalledOnceWith();
    });
  }); // describe - initLendingSubscription()

  // Note: [Graham] look into replacing getOffer spies with forcing return values on locOffer, and wcaOffer from OfferService
  describe('getOffer()', () => {
    it('should return the proper Offer based on OfferType.LineOfCredit', () => {
      const locOfferSpy = spyOnProperty(offerService, 'locOffer');

      component.offerType = OfferType.LineOfCredit;
      component.ngOnInit();

      expect(locOfferSpy).toHaveBeenCalledTimes(1);
    });

    it('should return the proper Offer based on OfferType.WorkingCapitalAdvance', () => {
      const wcaOfferSpy = spyOnProperty(offerService, 'wcaOffer');

      component.offerType = OfferType.WorkingCapitalAdvance;
      component.ngOnInit();

      expect(wcaOfferSpy).toHaveBeenCalledTimes(1);
    });
  }); // describe - getOffer()

  describe('applicationRouterLink', () => {
    it('should be set', () => {
      expect(component.applicationRouterLink).toBe(AppRoutes.application.root_link);
    });
  });
});
