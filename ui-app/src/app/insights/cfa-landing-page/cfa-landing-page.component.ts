import { Component } from '@angular/core';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-cfa-landing-page',
  templateUrl: './cfa-landing-page.component.html',
})
export class CfaLandingPageComponent {

  get cybLink(): string {
    return `/${AppRoutes.insights.set_up_bank}`;
  }

}
