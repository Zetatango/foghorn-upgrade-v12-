import { Validator, AbstractControl } from '@angular/forms';
import { DateFormatter } from 'ngx-bootstrap/datepicker';
import { Injectable } from '@angular/core';
import { DD_MM_YYYY_FORMAT, DD_MM_YYYY_REGEX } from 'app/constants/formatting.constants';

@Injectable()
export class DatePickerValidator implements Validator {
  validate(c: AbstractControl): { [key: string]: any; } { // eslint-disable-line
    if (!c.value) {
        return { 'error': 'Invalid Date' };
    }

    const date = c.value as Date;
    const dateFormatter = new DateFormatter();
    const dateString = dateFormatter.format(date, DD_MM_YYYY_FORMAT, 'en');

    return DD_MM_YYYY_REGEX.test(dateString) ? null : { 'error': 'Invalid Date' };
  }
}
