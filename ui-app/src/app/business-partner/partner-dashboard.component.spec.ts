import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { PartnerDashboardComponent } from './partner-dashboard.component';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { LogSeverity } from 'app/models/api-entities/log';
import { AppRoutes } from 'app/models/routes';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { LoadingService } from 'app/services/loading.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { businessPartnerApplication, businessPartnerApplicationComplete } from 'app/test-stubs/factories/business-partner';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { LoggingService } from 'app/services/logging.service';
import { RouterTestingModule } from '@angular/router/testing';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';

describe('PartnerDashboardComponent', () => {
  let component: PartnerDashboardComponent;
  let fixture: ComponentFixture<PartnerDashboardComponent>;
  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        PartnerDashboardComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        BusinessPartnerService,
        CookieService,
        LoadingService,
        MerchantService,
        LoggingService,
        StateRoutingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartnerDashboardComponent);
    component = fixture.componentInstance;

    stateRoutingService = TestBed.inject(StateRoutingService);

    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('main loader is set to default value from the LoadingService on create', inject([LoadingService], (loadingService: LoadingService) => {
    expect(component.mainLoader).toEqual(loadingService.getMainLoader());
  }));

  describe('ngOnInit', () => {
    it('should set loaded to true on successful init', inject(
      [BusinessPartnerService, MerchantService], (businessPartnerService: BusinessPartnerService, merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
          new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplicationComplete));

      component.ngOnInit();

      expect(component.loaded).toBeTruthy();
    }));

    it('should load merchant if merchant is not initially set in service', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
        spyOn(merchantService, 'getMerchant').and.returnValues(undefined, merchantDataFactory.build());
        spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));

        component.ngOnInit();

        expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      }));

    it('should not load merchant if merchant is set in service', inject(
      [ MerchantService ], (merchantService: MerchantService) => {
        spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
        spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));

        component.ngOnInit();

        expect(merchantService.loadMerchant).not.toHaveBeenCalled();
      }));

    it('should trigger log if load merchant fails', inject(
      [ LoggingService, MerchantService ], (loggingService: LoggingService, merchantService: MerchantService) => {
        const expectedMessage = 'mymsg';
        spyOn(merchantService, 'getMerchant').and.returnValue(undefined);
        spyOn(merchantService, 'loadMerchant').and.returnValue(throwError({ message: expectedMessage }));
        spyOn(loggingService, 'log');

        component.ngOnInit();

        expect(loggingService.log).toHaveBeenCalledOnceWith({ message: expectedMessage, severity: LogSeverity.error });
      }));

    it('should redirect to business partner dashboard on successful init', inject([BusinessPartnerService, MerchantService],
      (businessPartnerService: BusinessPartnerService, merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
          new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplicationComplete));

      component.ngOnInit();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_dashboard.business_partner_dashboard, true);
    }));

    it('should redirect to borrower dashboard if partner application is not complete', inject([BusinessPartnerService, MerchantService],
          (businessPartnerService: BusinessPartnerService, merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
          new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplication));

      component.ngOnInit();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
    }));

    it('should redirect to borrower dashboard if partner application cannot be loaded', inject([BusinessPartnerService, MerchantService, StateRoutingService],
      (businessPartnerService: BusinessPartnerService, merchantService: MerchantService, stateRouter: StateRoutingService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(throwError(internalServerErrorFactory.build()));

      component.ngOnInit();

      expect(stateRouter.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from business partner application subscription if subscription is set',
        inject([BusinessPartnerService, MerchantService], (businessPartnerService: BusinessPartnerService, merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
          new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplication));

      component.ngOnInit();

      expect(component.businessPartnerApplicationSubscription$.closed).toBeFalsy();
      component.ngOnDestroy();
      expect(component.businessPartnerApplicationSubscription$.closed).toBeTruthy();
    }));

    it('should not unsubscribe from business partner application subscription if subscription is already closed',
        inject([BusinessPartnerService, MerchantService], (businessPartnerService: BusinessPartnerService, merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
          new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplication));

      component.ngOnInit();

      component.businessPartnerApplicationSubscription$.unsubscribe();
      spyOn(component.businessPartnerApplicationSubscription$, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.businessPartnerApplicationSubscription$.unsubscribe).toHaveBeenCalledTimes(0);
    }));
  });
});
