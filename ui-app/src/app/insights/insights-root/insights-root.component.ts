import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AppRoutes } from 'app/models/routes';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { StateRoutingService } from 'app/services/state-routing.service';

@Component({
  selector: 'ztt-insights-root',
  templateUrl: './insights-root.component.html'
})

@UntilDestroy()
export class InsightsRootComponent implements OnInit {

  constructor(
    private bankingFlowService: BankingFlowService,
    private stateRoutingService: StateRoutingService
  ) {
    this.listenForRouteEvents();
  }

  ngOnInit(): void {
    this.setBankingFlowParameters();
  }

  private listenForRouteEvents(): void {
    this.stateRoutingService.ignoreRootEvents(AppRoutes.insights.root)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if (this.bankingFlowService.isBankFlowInProgress(BankingContext.insights)) {
          this.stateRoutingService.navigate(AppRoutes.insights.set_up_bank, true);
        } else {
          this.stateRoutingService.navigate(AppRoutes.insights.dashboard, true);
        }
      });
  }

  private setBankingFlowParameters() {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.cancelEvent
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.stateRoutingService.navigate(AppRoutes.insights.root, true);
      });

    this.bankingFlowService.completeEvent
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.stateRoutingService.navigate(AppRoutes.insights.root, true);
      });

    this.bankingFlowService.startEvent
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.stateRoutingService.navigate(AppRoutes.insights.set_up_bank, true);
      });
  }
}
