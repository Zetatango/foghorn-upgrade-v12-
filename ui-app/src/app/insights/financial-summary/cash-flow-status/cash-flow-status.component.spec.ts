import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CashFlowStatusComponent } from './cash-flow-status.component';
import { InsightsService } from '../../../services/insights.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from '../../../services/utility.service';
import { TranslateModule } from '@ngx-translate/core';

describe('CashFlowStatusComponent', () => {
  let component: CashFlowStatusComponent;
  let fixture: ComponentFixture<CashFlowStatusComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        CashFlowStatusComponent
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        InsightsService,
        UtilityService
      ]
    });
    fixture = TestBed.createComponent(CashFlowStatusComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    // it('should make a request for the cash flow insights data', function() {
    //   spyOn(insightsService, 'getCashFlowData').and.returnValue(null);
    //   component.ngOnInit();
    //   expect(insightsService.getCashFlowData).toHaveBeenCalledTimes(1);
    // });
  });
});
