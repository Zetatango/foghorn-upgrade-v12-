import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { InsightsService } from 'app/services/insights.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantService } from 'app/services/merchant.service';
import { LoggingService } from 'app/services/logging.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { QuickbooksConnectCardComponent } from './quickbooks-connect-card.component';

describe('QuickbooksConnectCardComponent', () => {
  let component: QuickbooksConnectCardComponent;
  let fixture: ComponentFixture<QuickbooksConnectCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuickbooksConnectCardComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        InsightsService,
        MerchantService,
        LoggingService,
        UtilityService,
        FormBuilder
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickbooksConnectCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });
});
