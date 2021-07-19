import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TrimWhitespaceDirective } from './trim-whitespace.directive';

// COMPONENT STUBS

@Component({
  template: `<input type="text" zttTrimWhitespace />`
})
class TestComponent {}

describe('TrimWhitespaceDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let input: DebugElement;
  const event = new Event('focusout');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [TestComponent, TrimWhitespaceDirective]
    });

    fixture = TestBed.createComponent(TestComponent);

    input = fixture.debugElement.query(By.css('input'));
  });

  describe('on input', () => {
    it('should trim outter white spaces', () => {
      input.nativeElement.value = ' Bob ';
      input.nativeElement.dispatchEvent(event);

      expect(input.nativeElement.value).toEqual('Bob');
    });

    it('should leave inner white spaces intact', () => {
      input.nativeElement.value = ' Zeta Tango ';
      input.nativeElement.dispatchEvent(event);

      expect(input.nativeElement.value).toEqual('Zeta Tango');
    });

    it('should leave cursor in correct position', () => {
      const text = ' Zeta Tango ';
      input.nativeElement.value = text;
      input.nativeElement.dispatchEvent(event);

      expect(input.nativeElement.selectionStart).toEqual(text.trim().length);
      expect(input.nativeElement.selectionEnd).toEqual(text.trim().length);
    });

    it('should leave cursor in 1st position', () => {
      const text = 'A';
      input.nativeElement.value = text;
      input.nativeElement.dispatchEvent(event);

      expect(input.nativeElement.selectionStart).toEqual(1);
      expect(input.nativeElement.selectionEnd).toEqual(1);
    });

    it('should leave cursor in 0th position', () => {
      const text = ' ';
      input.nativeElement.value = text;
      input.nativeElement.dispatchEvent(event);

      expect(input.nativeElement.selectionStart).toEqual(0);
      expect(input.nativeElement.selectionEnd).toEqual(0);
    });

    it('should leave the value empty if there is none', () => {
      [null, ''].forEach(nullLikeValue => {
        input.nativeElement.value = nullLikeValue;
        input.nativeElement.dispatchEvent(event);

        expect(input.nativeElement.value).toEqual('');
      }); // forEach
    });
  }); // describe - 'on input'

  describe('For any other type of Event', () => {
    const othersFocusEventsTypes: string[] = ['blur', 'focus', 'focusin'];
    const otherFocusEvents = (): FocusEvent[] => othersFocusEventsTypes.map(type => new FocusEvent(type));

    it('should not alter the value', () => {
      input.nativeElement.value = ' Bob ';

      otherFocusEvents().forEach(focusEvent => {
        input.nativeElement.dispatchEvent(new FocusEvent(focusEvent.type));
      });

      expect(input.nativeElement.value).toEqual(' Bob ');
    });
  }); // describe - 'should not alter the value'
}); // describe - TrimWhitespaceDirective
