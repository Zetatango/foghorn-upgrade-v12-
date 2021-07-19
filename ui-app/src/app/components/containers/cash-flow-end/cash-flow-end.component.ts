import { Component } from '@angular/core';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-cash-flow-end',
  templateUrl: './cash-flow-end.component.html'
})
export class CashFlowEndComponent {
  get dashboardLink(): string {
    return AppRoutes.dashboard.root_link;
  }
}
