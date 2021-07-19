import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { isSupportedLanguage } from 'app/models/languages';

@Pipe({
  name: 'zttCurrency'
})
export class ZttCurrencyPipe implements PipeTransform {
  transform(value: string | number, locale: string, digitsInfo = '1.2-2'): string | null {
    if (!isSupportedLanguage(locale)) {
      return '';
    }
    return new CurrencyPipe(locale).transform(value, 'CAD', 'symbol-narrow', digitsInfo);
  }
}
