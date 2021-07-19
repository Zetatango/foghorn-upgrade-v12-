import { Component } from '@angular/core';
import { AppRoutes } from 'app/models/routes';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ztt-about-cash-flow-advisor',
  templateUrl: './about-cash-flow-advisor.component.html'
})
export class AboutCashFlowAdvisorComponent {

  constructor(public  translateService: TranslateService) {}

  get cybLink(): string {
    return `/${AppRoutes.insights.set_up_bank}`;
  }
}
