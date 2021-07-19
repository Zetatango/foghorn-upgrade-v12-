import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ApprovalPendingComponent } from './approval-pending.component';

import { AppRoutes } from 'app/models/routes';

describe('ApprovalPendingComponent', () => {
  let component: ApprovalPendingComponent;
  let fixture: ComponentFixture<ApprovalPendingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ ApprovalPendingComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalPendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dashboard link defined', () => {
    expect(component.dashboardLink).toEqual(AppRoutes.dashboard.root_link);
  });
}); // describe - ApprovalPendingComponent
