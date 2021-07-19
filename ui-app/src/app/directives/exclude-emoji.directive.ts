import { Directive, ElementRef, HostListener} from '@angular/core';
import emojiRegex from 'emoji-regex/es2015';

@Directive({
  selector: '[zttExcludeEmoji]'
})
export class ExcludeEmojiDirective {
  constructor(private _el: ElementRef) {}

  @HostListener('input') onEvent(): void {
    /* istanbul ignore next */
    const currentValue = this._el?.nativeElement?.value;
    if (!currentValue) return;

    const input = this._el.nativeElement;
    let value = input.value;
    const re = emojiRegex();
    let match;

    // Compile the list of all emojis in the field
    const matches = [];
    while (match = re.exec(value)) { 
      matches.push(match);
    }

    // Replace instances of emojis with empty string
    let length = 0;
    for (let i = 0; i < matches.length; i++) {
      value = value.replace(matches[i][0], '');
      length += matches[i][0].length;
    }
    const start = input.selectionStart - length;
    const end = input.selectionEnd - length;

    input.value = value;

    input.selectionStart = start;
    input.selectionEnd = end;
  }
}
