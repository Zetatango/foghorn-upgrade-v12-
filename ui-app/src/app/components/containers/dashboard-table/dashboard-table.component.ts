import { Component, HostBinding } from '@angular/core';
import { DashboardTable } from 'app/models/dashboard-table';
import { ConfigurationService } from 'app/services/configuration.service';

@Component({
  selector: 'ztt-dashboard-table',
  templateUrl: './dashboard-table.component.html'
})

export class DashboardTableComponent {
  @HostBinding('class') readonly componentClass = 'ztt-dashboard-table';
  constructor(private configurationService: ConfigurationService) {}

  active = DashboardTable.ACTIVITY;
  DashboardTable = DashboardTable;

  switchToActivity(): void {
    this.active = DashboardTable.ACTIVITY;
  }

  switchToInvoices(): void {
    this.active = DashboardTable.INVOICES;
  }

  getClass(option: DashboardTable): string {
    return this.active === option ? 'active' : '';
  }

  get isActivityActive(): boolean {
    return this.active === DashboardTable.ACTIVITY;
  }

  get isInvoicesActive(): boolean {
    return !this.isInvoiceUiDisabled && this.active === DashboardTable.INVOICES;
  }

  get isInvoiceUiDisabled(): boolean {
    return this.configurationService.disableInvoiceUi;
  }
}
