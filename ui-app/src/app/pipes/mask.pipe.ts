import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mask'
})
export class MaskPipe implements PipeTransform {

  transform(value: any, args?: any): any { // eslint-disable-line
    const visibleDigits = 4;
    const maskedSection = value.slice(0, -visibleDigits);
    const visibleSection = value.slice(-visibleDigits);
    return maskedSection.replace(/./g, '*') + visibleSection;
  }

}
