import { ElementRef, QueryList } from '@angular/core';

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

export const fileInputStub: ElementRef = {
  nativeElement: {
    value: 'test.pdf'
  }
};


const fileInputs = new QueryList<ElementRef>();
fileInputs.reset([fileInputStub]);

export const fileInputsStub: QueryList<ElementRef> = fileInputs;
