import { Component } from '@angular/core';
import { InsightsService } from 'app/services/insights.service';
import { TranslateService } from '@ngx-translate/core';
import { faChevronDoubleUp, faQuestionCircle } from "@fortawesome/pro-solid-svg-icons";
import { faChevronDoubleDown } from "@fortawesome/pro-light-svg-icons";

@Component({
  selector: 'ztt-operating-ratio',
  templateUrl: './operating-ratio.component.html'
})
export class OperatingRatioComponent {

  operatingRatioDownIcon = faChevronDoubleDown;
  operatingRatioUpIcon = faChevronDoubleUp;
  questionMark = faQuestionCircle;

  constructor(
    public insightsService: InsightsService,
    public translateService: TranslateService
  ) {}
}
