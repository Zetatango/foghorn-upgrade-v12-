import { DatePickerValidator } from './date-picker.validator';
import { Component, forwardRef, ViewChild, OnDestroy, DoCheck, ElementRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, Validators, FormGroup, NG_VALIDATORS } from '@angular/forms';
import { DateFormatter, BsDatepickerDirective, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { isValid, parse } from 'date-fns';
import { DatePickerConfig } from 'app/models/date-picker';
import { DD_MM_YYYY_DATEPICKER_CONFIG } from 'app/constants/formatting.constants';

@Component({
  selector: 'ztt-date-picker',
  templateUrl: './date-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(/* istanbul ignore next */() => DatePickerComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useClass: DatePickerValidator,
      multi: true
    }
  ]
})
export class DatePickerComponent implements ControlValueAccessor, DoCheck, OnInit, OnDestroy {
  constructor(private elementRef: ElementRef) {}

  @Input() customConfig: DatePickerConfig;
  unsubscribe$ = new Subject<void>();

  private date: Date;
  private dateValueChangesSubscription: Subscription;
  @Input() name: string;
  @ViewChild(BsDatepickerDirective, { static: true }) bsDatePicker: BsDatepickerDirective;

  dateFormGroup: FormGroup;
  config: Partial<BsDatepickerConfig>;
  format: string;
  formatDateFns: string;
  mask: { mask: string };
  placeholder = '';
  regex: RegExp;
  isInvalid = false;

  /* istanbul ignore next */
  propagateChange = (fn: any): void => undefined; // eslint-disable-line
  /* istanbul ignore next */
  propagateTouch = (): void => undefined;

  ngOnInit(): void {
    this.customConfig = this.customConfig || DD_MM_YYYY_DATEPICKER_CONFIG;
    this.format = this.customConfig.format;
    this.formatDateFns = this.customConfig.formatDateFns;
    this.config = this.customConfig.config;
    this.mask = this.customConfig.mask;
    this.regex = this.customConfig.regex;
    this.placeholder = this.customConfig.placeholder;

    this.dateFormGroup = new FormGroup({
      'dateFormControl': new FormControl(
        '',
        [
          Validators.required,
          Validators.pattern(this.regex)
        ]
      )
    });

    this.dateValueChangesSubscription = this.dateFormGroup.controls['dateFormControl'].valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((v) => {
        const date = parse(v, this.formatDateFns, new Date());
        if (this.dateFormGroup.controls['dateFormControl'].valid && isValid(date)) {
          this.bsDatePicker.bsValue = date;
          this.propagateChange(date);
        } else {
          this.propagateChange(undefined);
        }
      });
  }

  ngDoCheck(): void {
    const classList = this.elementRef.nativeElement.classList as DOMTokenList;
    const isDatepickerInvalid = classList.contains('ng-invalid');
    const isDatepickerTouched = classList.contains('ng-touched');
    const isDateFormControlTouched = this.dateFormGroup.controls['dateFormControl'].touched;

    /* istanbul ignore else */
    if (isDateFormControlTouched !== isDatepickerTouched) {
      this.dateFormGroup.controls['dateFormControl'].markAsTouched();
    }
    /* istanbul ignore else */
    if (this.isInvalid !== isDatepickerInvalid) {
      this.isInvalid = isDatepickerInvalid;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  writeValue(obj: any): void { // eslint-disable-line
    this.date = obj;
    this.bsDatePicker.bsValue = this.date;
  }

  registerOnChange(fn: any): void { // eslint-disable-line
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void { // eslint-disable-line
    this.propagateTouch = fn;
  }

  onBsValueChange(date: Date): void {
    const dateFormatter = new DateFormatter();
    const dateString = dateFormatter.format(date, this.format, 'en');
    const currentValue = this.dateFormGroup.controls['dateFormControl'].value;

    if (dateString !== currentValue) {
      this.dateFormGroup.controls['dateFormControl'].setValue(dateString);
      this.propagateChange(date);
    }
  }

  onDatePickerHidden(): void {
    this.propagateTouch();
  }

  toggle($event: Event): void {
    this.bsDatePicker.toggle();
    $event.preventDefault();
    $event.stopPropagation();
  }
}
