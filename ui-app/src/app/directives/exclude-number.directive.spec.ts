import { ElementRef } from '@angular/core';
import { ExcludeNumberDirective } from './exclude-number.directive';

describe('ExcludeNumberDirective', () => {
  let directive: ExcludeNumberDirective;
  let elementRef: ElementRef;
  let input: HTMLInputElement;

  beforeEach(() => {
    input = document.createElement('input');
    input.type = 'text';
    elementRef = new ElementRef(input);
    directive = new ExcludeNumberDirective(elementRef);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should not allow numeric input', () => {
    // Verify 1-9 are not allowed
    for (let i = 1; i < 10; i++) {
      const event = new KeyboardEvent('keydown', {
        'key': String(i),
        cancelable: true,
        bubbles: true
      });

      directive.onKeyDown(event);

      // Default behaviour of the simulated key press is prevented (i.e. we are not allowed to type the value above)
      expect(event.defaultPrevented).toBeTruthy();
    }
  });

  it('should allow non-numeric input', () => {
    const charList = ['-', '+', '!', '&', '%', ',', 'a', 'b', 'c', 'Z', 'Y', 'X'];

    for (const i of charList) {
      const event = new KeyboardEvent('keydown', {
        'key': charList[i],
        cancelable: true,
        bubbles: true
      });

      directive.onKeyDown(event);

      // Default behaviour of the simulated key press is not prevented (i.e. we are allowed to type the value above)
      expect(event.defaultPrevented).toBeFalsy();
    }
  });
});
