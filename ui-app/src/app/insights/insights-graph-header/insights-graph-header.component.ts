import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from '../../services/insights.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-insights-graph-header',
  templateUrl: './insights-graph-header.component.html',
})
export class InsightsGraphHeaderComponent implements OnInit, OnDestroy {
  @Input() showCashFlowChart: boolean;
  @Output() onChartTypeChanged: EventEmitter<boolean> = new EventEmitter();

  lastTransactionDate: string;
  unsubscribe$ = new Subject<void>();

  constructor(
    private translateService: TranslateService,
    private insightsService: InsightsService) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.insightsService.getLastTransactionDate()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((lastTransactionDate: string) => {
        this.lastTransactionDate = lastTransactionDate;
      });
  }

  setCashFlowChartShow(value: boolean): void {
    this.showCashFlowChart = value;
    this.onChartTypeChanged.emit(value);
  }
}
