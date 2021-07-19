import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { OfferModule } from 'app/offer/offer.module';
import { ActiveUblsComponent } from 'app/components/states/active-ubls/active-ubls.component';
import { EditMerchantComponent } from 'app/components/states/edit-merchant/edit-merchant.component';
import { BorrowerInvoicesComponent } from 'app/components/containers/borrower-dashboard/borrower-invoices/borrower-invoices.component';
import { BorrowerTransactionHistoryComponent } from 'app/components/containers/borrower-dashboard/borrower-transaction-history/borrower-transaction-history.component';
import { BorrowerDashboardDirective } from 'app/directives/borrower-dashboard.directive';
import { DashboardComponent } from 'app/components/routes/dashboard/dashboard.component';
import { DashboardTableComponent } from 'app/components/containers/dashboard-table/dashboard-table.component';
import { DashboardRoutingModule } from 'app/dashboard/dashboard-routing.module';

@NgModule({
  declarations: [
    ActiveUblsComponent,
    EditMerchantComponent,
    BorrowerDashboardDirective,
    BorrowerInvoicesComponent,
    BorrowerTransactionHistoryComponent,
    DashboardComponent,
    DashboardTableComponent
  ],
  imports: [
    DashboardRoutingModule,
    TranslateModule.forChild(),
    OfferModule,
    SharedModule
  ]
})
export class DashboardModule {}
