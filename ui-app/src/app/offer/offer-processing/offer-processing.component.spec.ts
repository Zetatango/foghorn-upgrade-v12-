import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { OfferState } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { loadOffers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { offerFactory } from 'app/test-stubs/factories/lending/offers';
import { throwError } from 'rxjs';
import { OfferProcessingComponent } from './offer-processing.component';

describe('OfferProcessingComponent', () => {
  let component: OfferProcessingComponent;
  let fixture: ComponentFixture<OfferProcessingComponent>;

  /**
   * Configure: ErrorService
   */
  let errorService: ErrorService;

  /**
   * Configure: LoggingService
   */
  let loggingService: LoggingService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  /**
   * Configure: StateRoutingService
   */
  let stateRoutingService: StateRoutingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [OfferProcessingComponent],
      providers: [
        ErrorService,
        LoggingService,
        OfferService,
        StateRoutingService,
        TranslateService,
        // --- inherited
        UtilityService
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferProcessingComponent);
    component = fixture.componentInstance;

    /**
     * Setup: ErrorService
     */
    // Inject:
    errorService = TestBed.inject(ErrorService);

    // Spies:
    spyOn(errorService, 'show');

    /**
     * Setup: LoggingService
     */
    // Inject:
    loggingService = TestBed.inject(LoggingService);

    // Spies:
    spyOn(loggingService, 'log');

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    /**
     * Setup: StateRoutingService
     */
    // Inject:
    stateRoutingService = TestBed.inject(StateRoutingService);

    // Spies:
    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnDestroy()', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()

  describe('ngOnInit()', () => {
    describe('offerService.loadOffers$() success', () => {
      it('should not navigate when the offer state is processing', () => {
        spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
        spyOnProperty(offerService, 'locOffer').and.returnValue(offerFactory.build({state: OfferState.processing}));

        component.ngOnInit();

        expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      });

      it('should not navigate when the offer state is undefined', () => {
        spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
        spyOnProperty(offerService, 'locOffer').and.returnValue(offerFactory.build({state: undefined}));

        component.ngOnInit();

        expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      });

      it('should not navigate when the offer is undefined', () => {
        spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
        spyOnProperty(offerService, 'locOffer').and.returnValue(undefined);

        component.ngOnInit();

        expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      });

      it('should navigate when the offer state is not processing', () => {
        spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
        spyOnProperty(offerService, 'locOffer').and.returnValue(offerFactory.build({state: OfferState.approved}));

        component.ngOnInit();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    }); // describe - offerService.loadOffers$() success

    describe('offerService.loadOffers$() failed', () => {
      it('should retry 3 times, and log errors when loadOffers$ fails', () => {
        const err = new HttpErrorResponse({
          status: 500,
          statusText: 'Internal server error'
        });
        spyOn(offerService, 'loadOffers$').and.returnValue(throwError(new HttpErrorResponse(err)));

        component.ngOnInit();

        const logMessage1: LogMessage = {message: `Load offers failed: ${err.message}`, severity: LogSeverity.warn};
        expect(loggingService.log).toHaveBeenCalledWith(logMessage1);

        const logMessage2: LogMessage = {
          message: `Polling for offers failed: ${err.message}`,
          severity: LogSeverity.warn
        };
        expect(loggingService.log).toHaveBeenCalledWith(logMessage2);

        expect(loggingService.log).toHaveBeenCalledTimes(4);

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOffers);
      });
    }); // describe - offerService.loadOffers$() failed
  }); // describe - ngOnInit()
});
