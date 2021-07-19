import { Component } from '@angular/core';
import { MerchantService } from 'app/services/merchant.service';
import { Merchant } from 'app/models/api-entities/merchant';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'ztt-quickbooks-connect-summary',
  templateUrl: './quickbooks-connect-summary.component.html'
})
export class QuickbooksConnectSummaryComponent {
  constructor(private _merchantService: MerchantService,
              public translateService: TranslateService) {}

  isQuickBooksConnected(): boolean {
    return this._merchantService.isQuickBooksConnected();
  }

  get merchant(): Merchant {
    return this._merchantService.getMerchant();
  }
}
