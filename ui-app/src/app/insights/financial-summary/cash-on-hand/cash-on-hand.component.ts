import { Component } from '@angular/core';
import { InsightsService } from 'app/services/insights.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ztt-cash-on-hand',
  templateUrl: './cash-on-hand.component.html'
})
export class CashOnHandComponent {
  isCashReserveDropdownOpen = false;

  constructor(
    public insightsService: InsightsService,
    public translateService: TranslateService
  ) {}

  isOpenChange(): void {
    this.isCashReserveDropdownOpen = !this.isCashReserveDropdownOpen;
  }
}
