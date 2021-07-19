import { Component, Input } from '@angular/core';
import { ZttDataListType } from 'app/models/data-list-config';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ztt-borrower-transaction-history',
  templateUrl: './borrower-transaction-history.component.html'
})
export class BorrowerTransactionHistoryComponent {
  constructor(private translateService: TranslateService) {}

  @Input() merchantId: string;
  private _configType: ZttDataListType = ZttDataListType.BORROWER_TRANSACTION_HISTORY;
  readonly missingDataMessage = 'DASHBOARD_TABLE.RECENT_ACTIVITY.EMPTY';

  get configType(): ZttDataListType {
    return this._configType;
  }

  get currentLang(): string {
    return this.translateService.currentLang;
  }
}
