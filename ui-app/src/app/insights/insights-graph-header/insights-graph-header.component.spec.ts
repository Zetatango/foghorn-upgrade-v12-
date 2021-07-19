import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsightsGraphHeaderComponent } from './insights-graph-header.component';
import { TranslateModule } from '@ngx-translate/core';
import { InsightsService } from '../../services/insights.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from '../../services/utility.service';
import { BehaviorSubject } from "rxjs";

describe('InsightsGraphHeaderComponent', () => {
  let component: InsightsGraphHeaderComponent;
  let fixture: ComponentFixture<InsightsGraphHeaderComponent>;
  let insightsService: InsightsService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        InsightsGraphHeaderComponent
      ],
      providers: [
        InsightsService,
        UtilityService
      ]
    });

    fixture = TestBed.createComponent(InsightsGraphHeaderComponent);
    component = fixture.componentInstance;

    insightsService = TestBed.inject(InsightsService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set lastTransactionDate', function () {
      const lastTransactionDate = '01-01-2021';
      const lastTransactionDateSubject = new BehaviorSubject<string>(lastTransactionDate);
      spyOn(insightsService, 'getLastTransactionDate').and.returnValue(lastTransactionDateSubject);

      component.ngOnInit();

      expect(component.lastTransactionDate).toBe(lastTransactionDate);
    });
  });

  describe('setCashFlowChartShow', () => {
    it('should set component isCashFlowChartShow property value', function () {
      const showCashFlowChart = true;
      component.setCashFlowChartShow(showCashFlowChart);
      expect(component.showCashFlowChart).toBe(showCashFlowChart);
    });
  });
});
