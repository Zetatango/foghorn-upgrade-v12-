import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { BankingContext } from 'app/services/banking-flow.service';
import { MerchantService } from 'app/services/merchant.service';
import { QuickbooksService } from 'app/services/quickbooks.service';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { ConfigurationService } from 'app/services/configuration.service';
import { OmniauthFlowResponse, QuickbooksFlowMessage } from 'app/models/api-entities/omniauth-flow-response';
import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import { Merchant, QuickBooksState } from 'app/models/api-entities/merchant';
import { BankAccountService } from 'app/services/bank-account.service';

@Component({
  selector: 'ztt-insights',
  templateUrl: './insights.component.html'
})
export class InsightsComponent implements OnDestroy, OnInit {
  readonly flinksFlowRoute: BankingContext = BankingContext.insights;
  isButtonVisible: boolean;

  @HostBinding('attr.id')
  componentID = 'ztt-insights';
  unsubscribe$ = new Subject<void>();
  merchant: Merchant = null;
  showBetterInsightsCard = false;
  showConnectQuickBooks = false;
  showCashFlowChart = false;
  alerts: UiAlert[] = [];

  constructor(
    private merchantService: MerchantService,
    private quickbooksService: QuickbooksService,
    private configurationService: ConfigurationService,
    private bankAccountService: BankAccountService) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.quickbooksService.finishOmniauthFlow(OmniauthProviderConnectEvent.cancel);
  }

  ngOnInit(): void {
    this.merchantService.merchantObs
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(merchant => {
        this.merchant = merchant;
      });

    this.showConnectQuickBooks = this.displayConnectToQuickBooks();

    this.quickbooksService.receiveConnectedEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (flowResponse: OmniauthFlowResponse) => {
          this.receiveQuickbooksConnectedEvent(flowResponse.status === true, flowResponse.message);
        },
        () => {
          this.receiveQuickbooksConnectedEvent(false);
        });

  }

  onClosed(dismissedAlert: UiAlert): void {
    this.alerts = (this.alerts || []).filter(alert => alert !== dismissedAlert);
  }

  displayConnectToQuickBooks(): boolean {
    return this.bankAccountService.owner.isMerchant() && this.configurationService.quickBooksConnectEnabled &&
      this.merchant.quickbooks_state !== QuickBooksState.connected;
  }

  private receiveQuickbooksConnectedEvent(isSuccessful: boolean, message?: string): void {
    if (
      message
      && message === QuickbooksFlowMessage.realmIdChangedError
      && this.merchant?.quickbooks_realm_id
    ) {
      this.alerts.push({
        type: UiAlertStatus.danger,
        msg: 'QUICKBOOKS.CONNECT_FAIL_REALMID',
        params: {realm_id: this.merchant.quickbooks_realm_id},
        timeout: 20000
      });
    } else if (isSuccessful) {
      this.handleSuccessQuickbooksConnectEvent('QUICKBOOKS.CONNECT_SUCCESS');
    } else {
      this.handleFailedQuickbooksConnectEvent('QUICKBOOKS.CONNECT_FAIL');
    }

    if (isSuccessful) {
      this.merchantService
        .loadMerchant()
        .pipe(take(1))
        .subscribe();

      this.startImportCheck();
    }
  }

  startImportCheck(): void {
    this.quickbooksService.importCheckObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        complete: () => this.receiveQuickbooksImportedEvent()
      });
  }

  handleSuccessQuickbooksConnectEvent(message?: string): void {
    this.alerts.push({
      type: UiAlertStatus.success,
      msg: message,
      timeout: 5000
    });
  }

  handleFailedQuickbooksConnectEvent(message?: string): void {
    this.alerts.push({
      type: UiAlertStatus.danger,
      msg: message,
      timeout: 5000
    });
  }

  receiveQuickbooksImportedEvent(): void {
    this.showConnectQuickBooks = this.displayConnectToQuickBooks();
  }

  onChartTypeChanged(showCashFlowChart: boolean): void {
    this.showCashFlowChart = showCashFlowChart;
  }
}
