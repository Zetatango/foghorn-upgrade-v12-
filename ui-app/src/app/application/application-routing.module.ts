import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { CashFlowManualComponent } from 'app/components/containers/cash-flow-manual/cash-flow-manual.component';
import { CashFlowStartComponent } from 'app/components/containers/cash-flow-start/cash-flow-start.component';
import { UploadDocumentsComponent } from 'app/components/containers/upload-documents/upload-documents.component';
import { ApplicationFlowComponent } from 'app/components/routes/application-flow/application-flow.component';
import { LendingApplicationFlowComponent } from 'app/components/routes/application-flow/lending-application-flow/lending-application-flow.component';
import { AddGuarantorComponent } from 'app/components/states/add-guarantor/add-guarantor.component';
import { ApprovalPostComponent } from 'app/components/states/approval-post/approval-post.component';
import { ApprovalPrerequisitesComponent } from 'app/components/states/approval-prerequisites/approval-prerequisites.component';
import { CompletingLendingApplicationComponent } from 'app/components/states/completing-lending-application/completing-lending-application.component';
import { DirectDebitPrerequisitesComponent } from 'app/components/states/direct-debit-prerequisites/direct-debit-prerequisites.component';
import { LendingAgreementComponent } from 'app/components/states/lending-agreement/lending-agreement.component';
import { LendingApplicationDeclinedComponent } from 'app/components/states/lending-application-declined/lending-application-declined.component';
import { PadAgreementComponent } from 'app/components/states/pad-agreement/pad-agreement.component';
import { PafAgreementComponent } from 'app/components/states/paf-agreement/paf-agreement.component';
import { PreAuthorizedFinancingPrerequisitesComponent } from 'app/components/states/pre-authorized-financing-prerequisites/pre-authorized-financing-prerequisites.component';
import { ReviewLendingApplicationComponent } from 'app/components/states/review-lending-application/review-lending-application.component';
import { SelectLendingOfferComponent } from 'app/components/states/select-lending-offer/select-lending-offer.component';
import { SelectPayeeComponent } from 'app/components/states/select-payee/select-payee.component';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { AppRoutes, StateRoute } from 'app/models/routes';
import { BankingContext } from 'app/services/banking-flow.service';

const routes: Routes = [
  {
    path: '',
    component: ApplicationFlowComponent,
    data: { title_key: 'APPLICATION' },
    children: [
      { path: StateRoute.add_guarantor, component: AddGuarantorComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.approval_pending, component: ApprovalPendingComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.approval_post, component: ApprovalPostComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.approval_prerequisites, component: ApprovalPrerequisitesComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.cash_flow_manual, component: CashFlowManualComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.cash_flow_start, component: CashFlowStartComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.completing_lending_application, component: CompletingLendingApplicationComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.direct_debit_prerequisites, component: DirectDebitPrerequisitesComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.lending_agreement, component: LendingAgreementComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.lending_application_declined, component: LendingApplicationDeclinedComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.lending_application_flow, component: LendingApplicationFlowComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.pad_agreement, component: PadAgreementComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.paf_agreement, component: PafAgreementComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.pre_authorized_financing_prerequisites, component: PreAuthorizedFinancingPrerequisitesComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.review_lending_application, component: ReviewLendingApplicationComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.select_lending_offer, component: SelectLendingOfferComponent, data: { title_key: 'APPLICATION' } },
      { path: StateRoute.select_payee, component: SelectPayeeComponent, data: { title_key: 'APPLICATION' } },
      {
        path: StateRoute.set_up_bank,
        component: SetUpBankComponent,
        data: {
          title_key: 'APPLICATION',
          flinks_route: AppRoutes.application.root,
          context: BankingContext.application
        }
      },
      { path: StateRoute.upload_documents, component: UploadDocumentsComponent, data: { title_key: 'APPLICATION' } }
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class ApplicationRoutingModule { }
