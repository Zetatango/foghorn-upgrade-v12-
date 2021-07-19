import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { CashFlowManualComponent } from 'app/components/containers/cash-flow-manual/cash-flow-manual.component';
import { CashFlowStartComponent } from 'app/components/containers/cash-flow-start/cash-flow-start.component';
import { UploadDocumentsComponent } from 'app/components/containers/upload-documents/upload-documents.component';
import { ApplicationFlowComponent } from 'app/components/routes/application-flow/application-flow.component';
import { LendingApplicationFlowComponent } from 'app/components/routes/application-flow/lending-application-flow/lending-application-flow.component';
import { AddGuarantorComponent } from 'app/components/states/add-guarantor/add-guarantor.component';
import { AgreementComponent } from 'app/components/states/agreement/agreement.component';
import { ApprovalPostComponent } from 'app/components/states/approval-post/approval-post.component';
import { ApprovalPostDirective } from 'app/components/states/approval-post/approval-post.directive';
import { ApprovalPrerequisitesComponent } from 'app/components/states/approval-prerequisites/approval-prerequisites.component';
import { ApprovalPrerequisitesDirective } from 'app/components/states/approval-prerequisites/approval-prerequisites.directive';
import { CompletingLendingApplicationComponent } from 'app/components/states/completing-lending-application/completing-lending-application.component';
import { DirectDebitPrerequisitesComponent } from 'app/components/states/direct-debit-prerequisites/direct-debit-prerequisites.component';
import { DirectDebitPrerequisitesDirective } from 'app/components/states/direct-debit-prerequisites/direct-debit-prerequisites.directive';
import { LendingAgreementComponent } from 'app/components/states/lending-agreement/lending-agreement.component';
import { LendingApplicationDeclinedComponent } from 'app/components/states/lending-application-declined/lending-application-declined.component';
import { PadAgreementComponent } from 'app/components/states/pad-agreement/pad-agreement.component';
import { PafAgreementComponent } from 'app/components/states/paf-agreement/paf-agreement.component';
import { PreAuthorizedFinancingPrerequisitesComponent } from 'app/components/states/pre-authorized-financing-prerequisites/pre-authorized-financing-prerequisites.component';
import { PreAuthorizedFinancingDirective } from 'app/components/states/pre-authorized-financing-prerequisites/pre-authorized-financing.directive';
import { ReviewDirectDebitComponent } from 'app/components/states/review-direct-debit/review-direct-debit.component';
import { ReviewGuaranteeComponent } from 'app/components/states/review-guarantee/review-guarantee.component';
import { ReviewLendingApplicationComponent } from 'app/components/states/review-lending-application/review-lending-application.component';
import { SelectLendingOfferComponent } from 'app/components/states/select-lending-offer/select-lending-offer.component';
import { SelectPayeeComponent } from 'app/components/states/select-payee/select-payee.component';
import { SharedModule } from 'app/shared/shared.module';
import { ApplicationRoutingModule } from './application-routing.module';


@NgModule({
  declarations: [
    AddGuarantorComponent,
    AgreementComponent,
    ApplicationFlowComponent,
    ApprovalPendingComponent,
    ApprovalPostComponent,
    ApprovalPostDirective,
    ApprovalPrerequisitesComponent,
    ApprovalPrerequisitesDirective,
    DirectDebitPrerequisitesComponent,
    DirectDebitPrerequisitesDirective,
    CashFlowManualComponent,
    CashFlowStartComponent,
    CompletingLendingApplicationComponent,
    LendingApplicationFlowComponent,
    LendingAgreementComponent,
    LendingApplicationDeclinedComponent,
    LendingApplicationFlowComponent,
    PadAgreementComponent,
    PafAgreementComponent,
    ReviewLendingApplicationComponent,
    PreAuthorizedFinancingDirective,
    PreAuthorizedFinancingPrerequisitesComponent,
    ReviewDirectDebitComponent,
    ReviewGuaranteeComponent,
    SelectLendingOfferComponent,
    SelectPayeeComponent,
    UploadDocumentsComponent
  ],
  imports: [
    ApplicationRoutingModule,
    SharedModule,
    TranslateModule.forChild()
  ]
})
export class ApplicationModule {}
