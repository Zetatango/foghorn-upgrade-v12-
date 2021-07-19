import { Component, ViewChild, TemplateRef } from '@angular/core';
import { BsModalRef, ModalOptions, BsModalService } from 'ngx-bootstrap/modal';
import { PaymentPlan } from 'app/models/api-entities/payment_plan';
import { Invoice } from 'app/models/api-entities/invoice';
import { UiAssetService } from 'app/services/ui-asset.service';
import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ztt-paf-terms-modal',
  templateUrl: './paf-terms-modal.component.html',
  styleUrls: ['./paf-terms-modal.component.scss']
})

export class PafTermsModalComponent {

  @ViewChild('pafAgreementModal', { static: true }) pafAgreementModal: TemplateRef<any>; // eslint-disable-line
  paymentPlan: PaymentPlan;
  invoice: Invoice;
  pafAgreementModalRef: BsModalRef;
  pafAgreementModalOptions: ModalOptions = {
    class: 'modal-lg',
  };

  constructor(private modalService: BsModalService,
              private uiAssetService: UiAssetService,
              public translateService: TranslateService) {
  }

  show(invoice: Invoice): void {
    this.invoice = invoice;
    this.pafAgreementModalRef = this.modalService.show(this.pafAgreementModal, this.pafAgreementModalOptions);
  }

  hide(): void {
    this.pafAgreementModalRef.hide();
  }

  get repaymentScheduleLocalizationKey(): string {
    const repSched: RepaymentSchedule = this.invoice.payment_plan_entity.frequency;
    return this.uiAssetService.getRepaymentScheduleLocalizationKey(repSched);
  }

  get pafReviewFormulaLocalizationKey(): string {
    const repSched: RepaymentSchedule = this.invoice.payment_plan_entity.frequency;
    return this.uiAssetService.getPafReviewFormulaLocalizationKey(repSched);
  }

  get localizedLoanTermUnit(): string {
    return this.uiAssetService.getLocalizedLoanTermUnit(TermUnit.days);
  }
}
