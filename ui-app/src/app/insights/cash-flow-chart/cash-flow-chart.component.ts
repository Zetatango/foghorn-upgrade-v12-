import { Component, OnInit } from '@angular/core';
import { InsightsService } from '../../services/insights.service';
import { LocalizeDatePipe } from '../../pipes/localize-date.pipe';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ztt-cash-flow-chart',
  templateUrl: './cash-flow-chart.component.html',
})
export class CashFlowChartComponent implements OnInit {
  componentID = 'ztt-cash-flow-chart';
  currentLang!: string;
  // Bar chart config
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  animations = true;
  roundDomains = true;
  barPadding = 20;
  // colors: DEBIT (Green), CREDIT (Grey), PROJECTION DEBIT (light green), PROJECTION CREDIT (light gray)
  colorScheme = {
    domain: ['#119d6f', '#afafaf', '#88ceb7', '#d7d7d7']
  };

  constructor(
    public insightsService: InsightsService,
    public translateService: TranslateService,
    private localizeDatePipe: LocalizeDatePipe
  ) {}

  // bind current context
  formatXAxisTick = this.formatXAxisTicksFN.bind(this);

  ngOnInit(): void {
    this.currentLang = this.translateService.currentLang;

    /** on lang change, to localize the labels, rerender the chart */
    this.translateService.onLangChange
      .pipe(untilDestroyed(this))
      .subscribe((langChangeEvent: LangChangeEvent) => {
        this.currentLang = langChangeEvent.lang;
      });
  }

  // get the date and first three letters of months
  formatXAxisTicksFN(value: string): string {
    return this.localizeDatePipe.transform(value, this.currentLang, 'd-MMM');
  }

}
