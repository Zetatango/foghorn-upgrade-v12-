import { Component } from '@angular/core';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-lending-application-declined',
  templateUrl: './lending-application-declined.component.html',
})
export class LendingApplicationDeclinedComponent {
  get dashboardLink(): string {
    return AppRoutes.dashboard.root_link;
  }
}
