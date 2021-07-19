import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UserSessionService } from 'app/services/user-session.service';
import { UtilityService } from 'app/services/utility.service';

import { InsightsEmailToggleComponent } from './insights-email-toggle.component';

describe('InsightsEmailToggleComponent', () => {
  let component: InsightsEmailToggleComponent;
  let fixture: ComponentFixture<InsightsEmailToggleComponent>;

  let userSessionService: UserSessionService;
  let stateRoutingService: StateRoutingService;
  let performRedirectSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        InsightsEmailToggleComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        UserSessionService,
        LoggingService,
        UtilityService,
        StateRoutingService,
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InsightsEmailToggleComponent);
    component = fixture.componentInstance;

    userSessionService = TestBed.inject(UserSessionService);
    stateRoutingService = TestBed.inject(StateRoutingService);

    performRedirectSpy = spyOn(stateRoutingService, 'performRedirect');
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

  describe('ngOnInit', () => {
    it('should default the opt in input to false if opted out', () => {
      spyOnProperty(userSessionService, 'insightsPreference', 'get').and.returnValue(false);
      component.ngOnInit();

      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const optInToggle = htmlElement.querySelector('input[formControlName="isOptedIn"]');

      expect(optInToggle.checked).toBe(false);
    });

    it('should default the opt in input to true if opted in', () => {
      spyOnProperty(userSessionService, 'insightsPreference', 'get').and.returnValue(true);
      component.ngOnInit();

      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const optInToggle = htmlElement.querySelector('input[formControlName="isOptedIn"]');

      expect(optInToggle.checked).toBe(true);
    });

    it('should default the opt in input to false if insights email preference is not set', () => {
      spyOnProperty(userSessionService, 'insightsPreference', 'get').and.returnValue(null);
      component.ngOnInit();

      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const optInToggle = htmlElement.querySelector('input[formControlName="isOptedIn"]');

      expect(optInToggle.checked).toBe(false);
    });
  });

  describe('savePreference', () => {
    it('should request an update to the user insights email preference', async () => {
      const updateInsightsPreferenceSpy = spyOn(userSessionService, 'updateInsightsPreference').and.returnValue(null);

      fixture.detectChanges();
      component.insightsPreferenceForm.patchValue({ isOptedIn: true });
      fixture.detectChanges();

      await component.savePreference();

      expect(updateInsightsPreferenceSpy).toHaveBeenCalledOnceWith(true);
    });

    it('should set a success message on successful insights email preference update', async () => {
      spyOn(userSessionService, 'updateInsightsPreference').and.returnValue(null);

      fixture.detectChanges();
      component.insightsPreferenceForm.patchValue({ isOptedIn: true });
      fixture.detectChanges();

      await component.savePreference();
      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const successMessage = htmlElement.querySelector('div.text-success');
      const errorMessage = htmlElement.querySelector('div.text-danger');
      expect(successMessage).toBeTruthy();
      expect(errorMessage).toBeFalsy();
    });

    it('should set an error message on failed insights email preference update', async () => {
      spyOn(userSessionService, 'updateInsightsPreference').and.returnValue(Promise.reject(null));

      fixture.detectChanges();
      component.insightsPreferenceForm.patchValue({ isOptedIn: true });
      fixture.detectChanges();

      await component.savePreference();
      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const successMessage = htmlElement.querySelector('div.text-success');
      const errorMessage = htmlElement.querySelector('div.text-danger');
      expect(successMessage).toBeFalsy();
      expect(errorMessage).toBeTruthy();
    });

    it('refreshes the page on successful email preference update', async () => {
      spyOn(userSessionService, 'updateInsightsPreference').and.returnValue(null);

      fixture.detectChanges();
      component.insightsPreferenceForm.patchValue({ isOptedIn: true });
      fixture.detectChanges();

      await component.savePreference();
      fixture.detectChanges();

      expect(performRedirectSpy).toHaveBeenCalledTimes(1);
    });
  });
});
