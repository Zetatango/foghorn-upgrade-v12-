import { Component, Input } from '@angular/core';

/** @deprecated This component isn't used anywhere */
@Component({
  selector: 'ztt-message-card',
  templateUrl: './message-card.component.html'
})
export class MessageCardComponent {
  @Input() message: string;
}
