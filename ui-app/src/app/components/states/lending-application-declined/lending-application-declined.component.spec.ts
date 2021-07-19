import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LendingApplicationDeclinedComponent } from './lending-application-declined.component';

import { AppRoutes } from 'app/models/routes';

describe('LendingApplicationDeclinedComponent', () => {
  let component: LendingApplicationDeclinedComponent;
  let fixture: ComponentFixture<LendingApplicationDeclinedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule],
      declarations: [ LendingApplicationDeclinedComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LendingApplicationDeclinedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dashboard link defined', () => {
    expect(component.dashboardLink).toEqual(AppRoutes.dashboard.root_link);
  });
}); // describe - LendingApplicationDeclinedComponent
