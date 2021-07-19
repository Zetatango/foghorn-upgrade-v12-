import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { OfferRefreshComponent } from 'app/offer/offer-refresh/offer-refresh.component';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { of, throwError } from 'rxjs';

describe('OfferRefreshComponent', () => {
  let component: OfferRefreshComponent;
  let fixture: ComponentFixture<OfferRefreshComponent>;

  /**
   * Configure: ErrorService
   */
  let errorService: ErrorService;

  /**
   * Configure: LoggingService
   */
  let loggingService: LoggingService;

  /**
   * Configure: MerchantService
   */
  let merchantService: MerchantService;

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
      declarations: [OfferRefreshComponent],
      providers: [
        ErrorService,
        TranslateService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        // --- inherited
        UtilityService
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferRefreshComponent);
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
     * Setup: MerchantService
     */
    // Inject:
    merchantService = TestBed.inject(MerchantService);

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

  describe('refreshOffers()', () => {
    describe('on success', () => {
      beforeEach(() => {
        spyOn(merchantService, 'refreshOffers$').and.returnValue(of(null));
      });

      it('should route to dashboard', () => {
        component.refreshOffers();

        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
      });
    }); // describe - on success

    describe('on failure', () => {
      it('should call ErrorService and log an error', () => {
        const err = internalServerErrorFactory.build();
        spyOn(merchantService, 'refreshOffers$').and.returnValue(throwError(new HttpErrorResponse(err)));

        component.refreshOffers();

        const logMessage: LogMessage = {message: `Refresh offers failed: ${err.message}`, severity: LogSeverity.warn};
        expect(loggingService.log).toHaveBeenCalledWith(logMessage);

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.refreshOffers);
      });
    }); // describe - on failure
  }); // describe - refreshOffers()
});
