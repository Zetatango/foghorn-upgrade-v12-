import { Component } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/pro-light-svg-icons';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-insights-error',
  templateUrl: './insights-error.component.html',
})
export class InsightsErrorComponent {
  faExclamation = faExclamationCircle;
  insightsDashboardLink =  AppRoutes.insights.root_link;
}
