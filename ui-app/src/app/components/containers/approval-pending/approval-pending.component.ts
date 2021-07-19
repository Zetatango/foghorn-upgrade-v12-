import { Component } from '@angular/core';
import { AppRoutes } from 'app/models/routes';


@Component({
  selector: 'ztt-approval-pending',
  templateUrl: './approval-pending.component.html'
})
export class ApprovalPendingComponent {
  static className = 'approval_pending';

  get dashboardLink(): string {
    return AppRoutes.dashboard.root_link;
  }
}
