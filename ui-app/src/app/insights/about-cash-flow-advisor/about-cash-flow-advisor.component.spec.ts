import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutCashFlowAdvisorComponent } from './about-cash-flow-advisor.component';
import { TranslateModule } from '@ngx-translate/core';
import { AppRoutes } from 'app/models/routes';

describe('AboutCashFlowAdvisorComponent', () => {
  let component: AboutCashFlowAdvisorComponent;
  let fixture: ComponentFixture<AboutCashFlowAdvisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AboutCashFlowAdvisorComponent],
      imports: [TranslateModule.forRoot()]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutCashFlowAdvisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dashboardLink', () => {
    it('should return dashboard root link', function () {
      expect(component.cybLink).toEqual(`/${AppRoutes.insights.set_up_bank}`);
    });
  });
});
