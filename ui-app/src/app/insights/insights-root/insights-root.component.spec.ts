import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppRoutes } from 'app/models/routes';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { of } from 'rxjs';
import { InsightsRootComponent } from './insights-root.component';

describe('InsightsRootComponent', () => {
  let component: InsightsRootComponent;
  let fixture: ComponentFixture<InsightsRootComponent>;

  let bankingFlowService: BankingFlowService;
  let stateRoutingService: StateRoutingService;

  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        InsightsRootComponent
      ],
      providers: [
        BankingFlowService,
        StateRoutingService,
        ErrorService,
        LoggingService,
        TranslateService,
        UtilityService
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    bankingFlowService = TestBed.inject(BankingFlowService);
    stateRoutingService = TestBed.inject(StateRoutingService);

    navigateSpy = spyOn(stateRoutingService, 'navigate');
    spyOn(stateRoutingService, 'ignoreRootEvents').and.returnValue(of(null));
    
    fixture = TestBed.createComponent(InsightsRootComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle event from router', () => {
    expect(stateRoutingService.ignoreRootEvents).toHaveBeenCalledTimes(1);
    expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.dashboard, true);
  });

  it('should handle event from router and re-route to CYB if in progress', () => {
    navigateSpy.calls.reset();
    spyOn(bankingFlowService, 'isBankFlowInProgress').and.returnValue(true);
    fixture = TestBed.createComponent(InsightsRootComponent);
    component = fixture.componentInstance;

    expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.set_up_bank, true);
  });

  describe('Banking flow parameters', () => {
    it('should set attributes in BankingFlowService', () => {
      fixture.detectChanges();

      expect(bankingFlowService.skippable).toEqual(false);
    });

    describe('BankingFlowService events handling', () => {
      it('should go to insights root when cancel event is triggered', () => {
        fixture.detectChanges();
        bankingFlowService.triggerCancelEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.insights.root, true);
      });

      it('should go to insights root when complete event is triggered', () => {
        fixture.detectChanges();
        bankingFlowService.triggerCompleteEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.insights.root, true);
      });

      it('should go to set_up_bank when start event is triggered', () => {
        fixture.detectChanges();
        bankingFlowService.triggerStartEvent();
        expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.insights.set_up_bank, true);
      });
    });
  });
});
