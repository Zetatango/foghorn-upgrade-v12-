import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { isSupportedLanguage } from 'app/models/languages';

@Pipe({
  name: 'localizeDate'
})
export class LocalizeDatePipe implements PipeTransform {
  transform(value: string | number | Date, locale?: string, format?: string, timezone?: string): string | null {
    if (!isSupportedLanguage(locale)) return '';

    return new DatePipe(locale).transform(value, format || 'longDate', timezone);
  }
}
