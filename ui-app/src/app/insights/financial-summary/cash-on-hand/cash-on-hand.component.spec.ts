import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsightsService } from 'app/services/insights.service';
import { CashOnHandComponent } from './cash-on-hand.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from '../../../services/utility.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('CashOnHandComponent', () => {
  let component: CashOnHandComponent;
  let fixture: ComponentFixture<CashOnHandComponent>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [CashOnHandComponent],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        InsightsService,
        UtilityService,
        TranslateService
      ]
    });
    fixture = TestBed.createComponent(CashOnHandComponent);
    component = fixture.componentInstance;
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    // Should we test async calls in template?
    // it('should populate cashOnHandData', function () {
    //   const cashOnHandData: CashOnHandData = {
    //     currentBalance: 67543,
    //     cashBufferDays: 10,
    //     balanceChange: 0.99
    //   };
    //   spyOnProperty(insightsService, 'cashOnHandData', 'get').and.returnValue(new BehaviorSubject(cashOnHandData));
    //   component.ngOnInit();
    //   expect(component.cashOnHandData).toBe(cashOnHandData);
    // });

    // it('should not populate cashOnHandData', function () {
    //   spyOnProperty(insightsService, 'cashOnHandData', 'get').and.returnValue(new BehaviorSubject(null));
    //   component.ngOnInit();
    //   expect(component.cashOnHandData).toBe(null);
    // });
  });

  describe('isOpenChange', () => {
    it('should reverse the value of isCashReserveDropdownOpen', function () {
      component.isCashReserveDropdownOpen = false;
      component.isOpenChange();
      expect(component.isCashReserveDropdownOpen).toBe(true);
    });
  });
});
