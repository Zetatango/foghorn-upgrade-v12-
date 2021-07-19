import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { BankAccount, BankAccountSource } from 'app/models/bank-account';
import { BankAccountService } from 'app/services/bank-account.service';
import { InsightsService } from 'app/services/insights.service';
import { ErrorResponse } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-better-insights-card',
  templateUrl: './better-insights-card.component.html'
})
export class BetterInsightsCardComponent implements OnInit {
  @HostBinding('attr.id')
  componentID = 'ztt-better-insights-card';

  @Input() showConnectQuickBooks: boolean;


  bankAccounts: BankAccount[] = [];
  selectedBankAccount: BankAccount[] = [];
  selectedAccounts: string[] = [];

  saving = false;
  success = false;
  error = false;

  constructor(
    private bankAccountService: BankAccountService,
    private insightsService: InsightsService,
  ) { }

  ngOnInit(): void {
    this.bankAccountService.loadBankAccounts(BankAccountSource.flinks)
      .pipe(take(1))
      .subscribe(
        () => {
          this.bankAccounts = this.bankAccountService.bankAccounts;
          const selectedAccounts = this.bankAccountService.selectedInsightsBankAccountsIds;
          if (selectedAccounts.length) {
            this.selectedAccounts = selectedAccounts;
          }
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);
        });
  }

  onSubmitSelectedAccounts(): void {
    if (this.invalidSubmission()) return;
    this.saving = true;
    this.success = false;
    this.error = false;

    const insightsAccounts = (this.bankAccounts).filter(account => this.selectedAccounts.includes(account.id));
    this.setInsightsBankAccount(insightsAccounts);
  }

  private setInsightsBankAccount(insightsAccounts: BankAccount[]): void {
    this.bankAccountService.setSelectedInsightsBankAccounts(insightsAccounts)
      .pipe(take(1))
      .subscribe(
        () => {
          this.insightsService.fetchGraphData(this.bankAccountService.owner.flinks_account_uuids);
          this.success = true;
          this.saving = false;
        },
        () => {
          this.error = true;
          this.saving = false;
        }
      );
  }

  invalidSubmission(): boolean {
    return this.saving || !this.selectedAccounts?.length;
  }
}
