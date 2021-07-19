import { Component, Input, ViewChild, TemplateRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { Invoice, InvoiceStatus } from 'app/models/api-entities/invoice';
import { InvoiceService } from 'app/services/invoice.service';
import { ZttDataListType } from 'app/models/data-list-config';
import { BsModalService, ModalOptions, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'ztt-business-partner-sent-invoices-v2',
  templateUrl: './business-partner-sent-invoices-v2.component.html'
})
export class BusinessPartnerSentInvoicesV2Component {
  @Input() merchantId: string;

  @ViewChild('invoiceTrackedObjectModal', { static: true })
  invoiceTrackedObjectModal: TemplateRef<Element>;

  modalRef: BsModalRef;
  trackedInvoice: Invoice;

  private _configType: ZttDataListType = ZttDataListType.BP_INVOICES;
  private _defaultModalConfig: ModalOptions = { class: 'modal-lg' };

  constructor(private bsModalService: BsModalService,
              private invoiceService: InvoiceService,
              private translateService: TranslateService) {}

  getCurrentLang(): string {
    return this.translateService.currentLang;
  }

  getInvoiceLastEvent(event: TrackedObjectState): string {
    return BusinessPartnerService.getLastEventFromTrackedObjectState(event);
  }

  getInvoiceStatus(invoice: Invoice): string {
    return this.invoiceService.getInvoiceStatus(invoice);
  }

  getInvoiceSource(invoice: Invoice): string {
    return this.invoiceService.getInvoiceSource(invoice);
  }

  hasDifferentEmails(invoice: Invoice): boolean {
    return this.invoiceService.hasDifferentEmails(invoice);
  }

  isPaid(invoice: Invoice): boolean {
    return invoice.status === InvoiceStatus.paid;
  }

  isSentAndNotPaid(invoice: Invoice): boolean {
    return invoice.status === InvoiceStatus.unpaid && invoice.sent;
  }

  openInvoiceHistoryModal(invoice: Invoice): void {
    this.trackedInvoice = invoice;
    this.modalRef = this.bsModalService.show(this.invoiceTrackedObjectModal, this._defaultModalConfig);
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  get configType(): ZttDataListType {
    return this._configType;
  }
}
