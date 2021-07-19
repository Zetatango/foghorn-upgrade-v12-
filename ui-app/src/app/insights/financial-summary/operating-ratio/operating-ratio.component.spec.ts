import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperatingRatioComponent } from './operating-ratio.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InsightsService } from 'app/services/insights.service';
import { UtilityService } from 'app/services/utility.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('OperatingRatioComponent', () => {
  let component: OperatingRatioComponent;
  let fixture: ComponentFixture<OperatingRatioComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [OperatingRatioComponent],
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
    fixture = TestBed.createComponent(OperatingRatioComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    // it('should populate operatingRatioData', function () {
    //   const operatingRatioData: BehaviorSubject<OperatingRatioData> = new BehaviorSubject<OperatingRatioData>({
    //     operatingRatio: 0.78,
    //     credits: 1222,
    //     debits: 3425,
    //     operatingRatioChange: 11
    //   });
    //   spyOnProperty(insightsService, 'operatingRatioData', 'get').and.returnValue(operatingRatioData);
    //   component.ngOnInit();
    //   expect(component.operatingRatioData$).toBe(operatingRatioData);
    // });

    // it('should not populate operatingRatioData', function () {
    //   const subject: BehaviorSubject<OperatingRatioData> = new BehaviorSubject<OperatingRatioData>(null);
    //   spyOnProperty(insightsService, 'operatingRatioData', 'get').and.returnValue(subject);
    //   component.ngOnInit();
    //   expect(component.operatingRatioData$).toBe(subject);
    // });
  });
});
