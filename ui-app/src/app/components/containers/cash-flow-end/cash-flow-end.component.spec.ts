import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CashFlowEndComponent } from './cash-flow-end.component';

import { TranslateModule } from '@ngx-translate/core';
import { AppRoutes } from 'app/models/routes';

describe('CashFlowEndComponent', () => {
  let component: CashFlowEndComponent;
  let fixture: ComponentFixture<CashFlowEndComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ CashFlowEndComponent ],
      providers: []
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashFlowEndComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dashboard link defined', () => {
    expect(component.dashboardLink).toEqual(AppRoutes.dashboard.root_link);
  });
});
