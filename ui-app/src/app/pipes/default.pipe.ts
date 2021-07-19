import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'default'
})
export class DefaultPipe implements PipeTransform {
  transform(value: any, defaultValue: any): any { // eslint-disable-line
    const ret = (value || defaultValue);
    return ret;
  }
}
