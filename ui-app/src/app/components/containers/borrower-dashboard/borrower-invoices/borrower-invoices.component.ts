import { Component, ViewChild } from '@angular/core';
import { ZttDataListType } from 'app/models/data-list-config';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { Invoice } from 'app/models/api-entities/invoice';
import { TranslateService } from '@ngx-translate/core';
import { AppRoutes } from 'app/models/routes';
import { StateRoutingService } from 'app/services/state-routing.service';
import { PafTermsModalComponent } from 'app/components/utilities/paf-terms-modal/paf-terms-modal.component';

@Component({
  selector: 'ztt-borrower-invoices',
  templateUrl: './borrower-invoices.component.html'
})
export class BorrowerInvoicesComponent {
  constructor(private borrowerInvoiceService: BorrowerInvoiceService,
              private translateService: TranslateService,
              private stateRouter: StateRoutingService) {}
  @ViewChild(PafTermsModalComponent, {static: true })
  pafTermsModalComponent: PafTermsModalComponent;

  private _configType: ZttDataListType = ZttDataListType.BORROWER_INVOICES;

  get configType(): ZttDataListType {
    return this._configType;
  }

  get currentLang(): string {
    return this.translateService.currentLang;
  }

  canInvoiceBePaid(invoice: Invoice): boolean {
    return this.borrowerInvoiceService.canInvoiceBePaid(invoice);
  }

  getInvoiceDisplayStatusClass(invoice: Invoice): string {
    return this.borrowerInvoiceService.getInvoiceDisplayStatusClass(invoice);
  }

  isPaidByPaf(invoice: Invoice): boolean {
    return this.borrowerInvoiceService.isScheduled(invoice);
  }

  payInvoice(invoice: Invoice): void {
    this.borrowerInvoiceService.saveActiveInvoiceId(invoice ? invoice.id : null);
    this.stateRouter.navigate(AppRoutes.application.root);
  }

  showPaymentPlanReview(invoice: Invoice): void {
    this.pafTermsModalComponent.show(invoice);
  }
}
