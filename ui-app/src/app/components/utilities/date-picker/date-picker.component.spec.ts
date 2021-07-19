import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IMaskModule } from 'angular-imask';
import { BsDatepickerModule, DateFormatter } from 'ngx-bootstrap/datepicker';
import { DatePickerComponent } from './date-picker.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MM_YYYY_DATEPICKER_CONFIG } from 'app/constants/formatting.constants';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        BsDatepickerModule.forRoot(),
        ReactiveFormsModule,
        IMaskModule,
        TranslateModule.forRoot()
      ],
      declarations: [DatePickerComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
  });

  describe('default config', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('constructor', () => {
      beforeEach(() => {
        spyOn(component, 'propagateChange');
      });

      it('should propagate value change when valid date is set', () => {
        const date = '12-12-2019';
        component.dateFormGroup.controls['dateFormControl'].setValue(date);
        expect(component.propagateChange).toHaveBeenCalledTimes(1);
      });

      it('should propagate value change when invalid date is set', () => {
        component.dateFormGroup.controls['dateFormControl'].setValue('0');
        expect(component.propagateChange).toHaveBeenCalledOnceWith(undefined);
      });
    });

    describe('onDatePickerHidden', () => {
      it('should call propagateTouch', () => {
        spyOn(component, 'propagateTouch');
        component.onDatePickerHidden();
        expect(component.propagateTouch).toHaveBeenCalledTimes(1);
      });
    });

    describe('ngOnDestroy', () => {
      beforeEach(() => {
        spyOn(component.unsubscribe$, 'next').and.callThrough();
        spyOn(component.unsubscribe$, 'complete').and.callThrough();
      });

      it('should call next and unsubscribe from destroy subject', () => {
        component.ngOnDestroy();
        expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
        expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
      });
    });

    describe('onBsValueChange', () => {
      it('should call propagateChange and set value in dateFormControl', () => {
        const date = new Date();
        const dateString = new DateFormatter().format(date, component.format, 'en');
        spyOn(component, 'propagateChange');
        component.onBsValueChange(date);

        expect(component.propagateChange).toHaveBeenCalledWith(date);
        expect(component.dateFormGroup.value.dateFormControl).toEqual(dateString);
      });

      it('should not call propagateChange if dates are the same in the formControl and datepicker', () => {
        const dateString = '10-10-2019';
        const date = new Date(2019, 9, 10);
        component.dateFormGroup.controls['dateFormControl'].setValue(dateString);

        spyOn(component, 'propagateChange');
        component.onBsValueChange(date);

        expect(component.propagateChange).not.toHaveBeenCalled();
      });
    });

    describe('toggle', () => {
      it('should call bsDatePicker toggle and prevent event dispatching', () => {
        const event = new MouseEvent('click');
        spyOn(event, 'preventDefault');
        spyOn(event, 'stopPropagation');
        spyOn(component.bsDatePicker, 'toggle');

        component.toggle(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
        expect(component.bsDatePicker.toggle).toHaveBeenCalledTimes(1);
      });
    });

    describe('writeValue', () => {
      it('should set bsDatepicker bsValue', () => {
        const bsDatePickerBsValueSetter = spyOnProperty(component.bsDatePicker, 'bsValue', 'set');
        const date = new Date();
        component.writeValue(date);

        expect(bsDatePickerBsValueSetter).toHaveBeenCalledOnceWith(date);
      });
    });

    describe('registerOnChange', () => {
      it('should set propagateChange', () => {
        const fn = () => undefined;
        component.registerOnChange(fn);
        expect(component.propagateChange).toEqual(fn);
      });
    });

    describe('ngDoCheck', () => {
      it('should set propagateTouch', () => {
        const fn = () => undefined;
        component.registerOnTouched(fn);
        expect(component.propagateTouch).toEqual(fn);
      });
    });

    describe('ngDoCheck', () => {
      it('should call markAsTouched if there is a mismatch between formControl and datepicker', () => {
        component.dateFormGroup.controls['dateFormControl'].markAsTouched();
        spyOn(component.dateFormGroup.controls['dateFormControl'], 'markAsTouched');
        component.ngDoCheck();
        expect(component.dateFormGroup.controls['dateFormControl'].markAsTouched).toHaveBeenCalledTimes(1);
      });

      it('should not call markAsTouched if formControl and datepicker have same validity', () => {
        spyOn(component.dateFormGroup.controls['dateFormControl'], 'markAsTouched');
        component.ngDoCheck();
        expect(component.dateFormGroup.controls['dateFormControl'].markAsTouched).not.toHaveBeenCalled();
      });

      it('should set isInvalid should be set when there is a mismatch between formControl and datepicker', () => {
        component.isInvalid = true;
        component.ngDoCheck();
        expect(component.isInvalid).toBeFalse();
      });

      it('should not set isInvalid if isInvalid and datepicker have same validity', () => {
        component.isInvalid = true;
        component.bsDatePicker.bsValue = new Date();
        component.ngDoCheck();
        expect(component.isInvalid).toBeFalse();
      });
    });
  });

  describe('custom config', () => {
    const config = MM_YYYY_DATEPICKER_CONFIG;
    beforeEach(() => {
      component.customConfig = config;
      component.ngOnInit();
    });

    it('should set values to custom config', () => {
      expect(component.format).toEqual(config.format);
      expect(component.mask).toEqual(config.mask);
      expect(component.regex).toEqual(config.regex);
      expect(component.placeholder).toEqual(config.placeholder);
    });
  });
});
