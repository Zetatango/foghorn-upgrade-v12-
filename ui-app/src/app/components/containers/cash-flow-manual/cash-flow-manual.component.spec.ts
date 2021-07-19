import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CashFlowManualComponent } from './cash-flow-manual.component';

import { TranslateModule } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CashFlowManualComponent', () => {
  let component: CashFlowManualComponent;
  let fixture: ComponentFixture<CashFlowManualComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ CashFlowManualComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashFlowManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
