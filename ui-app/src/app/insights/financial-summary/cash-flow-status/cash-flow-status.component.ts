import { Component } from '@angular/core';
import { InsightsService } from 'app/services/insights.service';

@Component({
  selector: 'ztt-cash-flow-status',
  templateUrl: './cash-flow-status.component.html'
})
export class CashFlowStatusComponent {
  constructor(public insightsService: InsightsService) {}
}
