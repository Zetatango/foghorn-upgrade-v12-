import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { curveMonotoneX } from 'd3-shape';
import { InsightsData } from 'app/models/insights-data';
import { InsightsService } from 'app/services/insights.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { CustomLineChartService } from '../../services/line-chart.service';
import { LineChartComponent } from '@swimlane/ngx-charts';
import { LocalizeDatePipe } from '../../pipes/localize-date.pipe';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankAccountOwner } from 'app/models/bank-account';

@Component({
  selector: 'ztt-account-balance-chart',
  templateUrl: './account-balance-chart.component.html'
})

@UntilDestroy()
export class AccountBalanceChartComponent implements OnInit {

  @ViewChild('chart', { read: LineChartComponent })
  chart: LineChartComponent;
  @HostBinding('attr.id')

  componentID = 'ztt-account-balance-chart';
  unsubscribe$ = new Subject<void>();

  // Graph Configuration
  accountBalanceData: InsightsData[] = [];
  curve = curveMonotoneX;
  xAxis = true;
  yAxis = true;
  showYAxisLabel = false;
  roundDomains = true;
  rotateXAxisTicks = true;
  customColors = [
    { name: 'INSIGHTS.CHART_LABEL_ACCOUNT_BALANCE', value: '#454545' }, // Charcoal
    { name: 'INSIGHTS.CHART_LABEL_PROJECTIONS', value: '#454545' } // Charcoal
  ];

  refLines = [];
  showRefLines = true;
  currentLang: string;

  // bind current context
  formatYAxisTick = this.formatYAxisTicksFN.bind(this);
  formatXAxisTick = this.formatXAxisTicksFN.bind(this);


  constructor(
    public translateService: TranslateService,
    private insightsService: InsightsService,
    private lineChartService: CustomLineChartService,
    private bankAccountService: BankAccountService,
    private localizeDatePipe: LocalizeDatePipe
  ) { }



  ngOnInit(): void {
    this.currentLang = this.translateService.currentLang;

    this.insightsService.accountBalanceData$
      .pipe(untilDestroyed(this))
      .subscribe((data: InsightsData[]) => {
        this.accountBalanceData = data;
        this.setThreshold();
        this.addDataPoints();
      });

    // on lang change, to localize the labels, rerender the chart
    this.translateService.onLangChange
      .pipe(untilDestroyed(this))
      .subscribe((langChangeEvent: LangChangeEvent) => {
        this.currentLang = langChangeEvent.lang;
        this.renderChart();
      });
  }

  // Add data points after chart with data has been initialized
  addDataPoints(): void {
    setTimeout(() => {
      this.lineChartService.showDots(this.chart);
    }, 0);
  }


  formatYAxisTicksFN(value: number): string {
    return this.currentLang === 'en' ? `$${value}` : `${value}$`;
  }

  formatXAxisTicksFN(value: string): string {
    return this.localizeDatePipe.transform(value, this.currentLang, 'd-MMM');
  }


  renderChart(): void {
    this.accountBalanceData = this.accountBalanceData ? [...this.accountBalanceData] : [];
  }

  setThreshold(): void {
    // find max and min to hide threshold if it is beyond the range

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    this.accountBalanceData.forEach((insightsData: InsightsData) => {
      insightsData.series.forEach(data => {
        min = Math.min(data.value, min);
        max = Math.max(data.value, max);
      });
    });

    // cover extra 10% range
    max += (max * 0.01);
    min -= (min * 0.01);

    // set account balance threshold
    this.bankAccountService.owner$
      .pipe(untilDestroyed(this))
      .subscribe((owner: BankAccountOwner) => {
        this.refLines = [];
        if (owner.desired_bank_account_balance >= min && owner.desired_bank_account_balance <= max) {
          this.refLines = [{
            value: owner.desired_bank_account_balance,
            name: '' // no label for threshold line
          }];
        }
        this.renderChart();
      });
  }
}
