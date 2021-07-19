import { Component, Input } from '@angular/core';

@Component({
  selector: 'ztt-generic-error-page',
  templateUrl: './generic-error-page.component.html'
})
export class GenericErrorPageComponent {
  @Input() customDescription: string;
}
