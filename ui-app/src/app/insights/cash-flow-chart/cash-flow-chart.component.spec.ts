import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashFlowChartComponent } from './cash-flow-chart.component';
import { InsightsService } from '../../services/insights.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UtilityService } from '../../services/utility.service';
import { of } from 'rxjs';
import { LocalizeDatePipe } from '../../pipes/localize-date.pipe';

describe('CashFlowChartComponent', () => {
  let component: CashFlowChartComponent;
  let fixture: ComponentFixture<CashFlowChartComponent>;

  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        CashFlowChartComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        InsightsService,
        LocalizeDatePipe,
        UtilityService,
        TranslateService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(CashFlowChartComponent);
    component = fixture.componentInstance;

    translateService = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize currentLang', () => {
      spyOnProperty(translateService, 'currentLang').and.returnValue('en');

      component.ngOnInit();

      expect(component.currentLang).toBe('en');
    });

    it('should change the current lang', () => {
      spyOnProperty(translateService, 'onLangChange', 'get').and.returnValue(of({ lang: 'fr' }));

      component.ngOnInit();

      expect(component.currentLang).toBe('fr');
    });

  });

  describe('formatXAxisTicksFN', () => {
    it('should format X Axis labels', () => {
      const date = '01.01.2021';
      component.currentLang = 'en';
      expect(component.formatXAxisTicksFN(date)).toBe('1-Jan');
    });
  });
});
