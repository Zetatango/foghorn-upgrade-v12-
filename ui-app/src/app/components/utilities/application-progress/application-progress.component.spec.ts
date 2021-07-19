import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ApplicationProgressComponent } from './application-progress.component';


import { TranslateService, TranslateModule } from '@ngx-translate/core';

describe('ApplicationProgressComponent', () => {
  let component: ApplicationProgressComponent;
  let fixture: ComponentFixture<ApplicationProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ApplicationProgressComponent],
      providers: [TranslateService],
      schemas: []
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set initial values', () => {
      component.ngOnInit();

      expect(component.step).toBeTruthy();
      expect(component.stepLabels.first).toBeTruthy();
      expect(component.stepLabels.second).toBeTruthy();
      expect(component.stepLabels.third).toBeTruthy();
      expect(component.stepLabels.fourth).toBeTruthy();
    });

    it('should accept set stepLabels if passed to component', () => {
      const customStepLabels = { first: '123'};
      component.stepLabels = customStepLabels;
      component.ngOnInit();

      expect(component.stepLabels).toEqual(customStepLabels);
    });
  });

  describe('isWaiting', () => {
    it('should return true when step is 2.5', () => {
      component.step = 2.5;
      expect(component.isWaiting()).toBeTrue();
    });

    it('should return false when step is NOT 2.5', () => {
      const acceptedValues = [1, 2, 3, 4];
      acceptedValues.forEach(value => {
        component.step = value;
        expect(component.isWaiting()).toBeFalse();
      });
    });
  });

  describe('isActiveStep', () => {
    it('should return true when step is current step', () => {
      component.step = 2.5;
      expect(component.isActiveStep(component.step)).toBeTrue();
    });

    it('should return false when step is NOT current step', () => {
      const acceptedValues = [1, 2, 3, 4];
      acceptedValues.forEach(value => {
        component.step = value;
        expect(component.isActiveStep(2.5)).toBeFalse();
      });
    });
  });

  describe('isCompletedStep', () => {
    it('should return true when current step is after passed in step', () => {
      component.step = 2.5;
      expect(component.isCompletedStep(1)).toBeTrue();
    });

    it('should return false when current step is not after passed in step', () => {
      const acceptedValues = [1, 2, 3, 4];
      acceptedValues.forEach(value => {
        component.step = 1;
        expect(component.isCompletedStep(value)).toBeFalse();
      });
    });
  });
});
