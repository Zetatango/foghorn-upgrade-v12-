import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ExcludeEmojiDirective } from './exclude-emoji.directive';

@Component({
  template: `<input type="text" zttExcludeEmoji/>`
})

class TestComponent {}

describe('ExcludeEmojiDirective', () => {
  let input: DebugElement;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, ExcludeEmojiDirective],
      imports: []
    });
    fixture = TestBed.createComponent(TestComponent);
    input = fixture.debugElement.query(By.css('input'));
    input.nativeElement.selectionStart = 0;
    input.nativeElement.selectionEnd = 0;
  });

  it('should allow all printable ASCII characters', () => {
    let inputValue = '';
    for (let i = 32; i < 127; i++) {
      input.nativeElement.value += String.fromCharCode(i);
      inputValue += String.fromCharCode(i);
      input.triggerEventHandler('input', null);

      // The input field value does not change after the event is triggered (i.e. nothing stripped out).
      expect(input.nativeElement.value).toEqual(inputValue);
    }
  });

  it('should not allow emoji characters in blank field', () => {
    input.nativeElement.value = 'ππππ€£ππππππππππ₯°πππ';
    input.triggerEventHandler('input', null);

    // The input field value strips out emojis.
    expect(input.nativeElement.value).toEqual('');
  });

  it('should not allow emoji characters at the end of a string', () => {
    input.nativeElement.value = 'testππππ€£ππππππππππ₯°πππ';
    input.triggerEventHandler('input', null);

    // The input field value strips out emojis.
    expect(input.nativeElement.value).toEqual('test');
  });

  it('should not allow emoji characters at the start of a string', () => {
    input.nativeElement.value = 'ππππ€£ππππππππππ₯°πππtest';
    input.triggerEventHandler('input', null);

    // The input field value strips out emojis.
    expect(input.nativeElement.value).toEqual('test');
  });

  it('should not allow emoji characters in the middle of a string', () => {
    input.nativeElement.value = 'teππππ€£ππππππππππ₯°πππst';
    input.triggerEventHandler('input', null);

    // The input field value strips out emojis.
    expect(input.nativeElement.value).toEqual('test');
  });

  it('should allow accented Unicode characters', () => {
    input.nativeElement.value = 'ΓΓ³ΓΓ΄ΓΓ²ΓΓ±ΓΓΆΒ‘ΒΏΓΓ§ΕΕΓΓΓΈΓΓ₯ΓΓ¦ΓΓ°';
    input.triggerEventHandler('input', null);

    // The input field value strips out emojis.
    expect(input.nativeElement.value).toEqual('ΓΓ³ΓΓ΄ΓΓ²ΓΓ±ΓΓΆΒ‘ΒΏΓΓ§ΕΕΓΓΓΈΓΓ₯ΓΓ¦ΓΓ°');
  });

  it('should leave cursor in correct position', () => {
    const text = 'teππππ€£ππππππππππ₯°πππst';
    input.nativeElement.value = text;
    input.nativeElement.dispatchEvent(new Event('input'));

    expect(input.nativeElement.selectionStart).toEqual(4);
    expect(input.nativeElement.selectionEnd).toEqual(4);
  });
});
