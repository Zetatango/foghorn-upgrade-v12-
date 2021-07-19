import { BusinessPartnerCustomerHistoryComponent } from './business-partner-customer-history/business-partner-customer-history.component';
import { BusinessPartnerCustomerSummaryV2Component } from './business-partner-customer-summary-v2/business-partner-customer-summary-v2.component';
import { BusinessPartnerDashboardComponent } from './business-partner-dashboard/business-partner-dashboard.component';
import { BusinessPartnerInviteComponent } from './business-partner-invite/business-partner-invite.component';
import { BusinessPartnerInvoiceHistoryComponent } from './business-partner-invoice-history/business-partner-invoice-history.component';
import { BusinessPartnerInvoiceUploadComponent } from './business-partner-invoice-upload/business-partner-invoice-upload.component';
import { BusinessPartnerProfileProgressComponent } from './business-partner-profile-progress/business-partner-profile-progress.component';
import { BusinessPartnerRoutingModule } from './business-partner-routing.module';
import { BusinessPartnerSentInvoicesV2Component } from './business-partner-sent-invoices-v2/business-partner-sent-invoices-v2.component';
import { BusinessPartnerSocialSharingComponent } from './business-partner-social-sharing/business-partner-social-sharing.component';
import { FabMenuComponent } from 'app/components/utilities/fab-menu/fab-menu.component';
import { NgModule } from '@angular/core';
import { PartnerDashboardComponent } from './partner-dashboard.component';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { SharedModule } from 'app/shared/shared.module';
import { SmallBusinessGradeComponent } from 'app/components/containers/small-business-grade/small-business-grade.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    BusinessPartnerCustomerHistoryComponent,
    BusinessPartnerCustomerSummaryV2Component,
    BusinessPartnerDashboardComponent,
    BusinessPartnerInviteComponent,
    BusinessPartnerInvoiceHistoryComponent,
    BusinessPartnerInvoiceUploadComponent,
    BusinessPartnerProfileProgressComponent,
    BusinessPartnerSentInvoicesV2Component,
    BusinessPartnerSocialSharingComponent,
    FabMenuComponent,
    PartnerDashboardComponent,
    SmallBusinessGradeComponent
  ],
  imports: [
    BusinessPartnerRoutingModule,
    TranslateModule.forChild(),
    ShareButtonsModule,
    SharedModule
  ]
})
export class BusinessPartnerModule {}
