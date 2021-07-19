import { Component, Input, EventEmitter, Output, ViewChild, TemplateRef } from '@angular/core';
import { BusinessPartnerMerchant, AutoSendParams } from 'app/models/api-entities/business-partner-customer-summary';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { TranslateService } from '@ngx-translate/core';
import { ModalOptions, BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { SmallBusinessGrade } from 'app/models/api-entities/offer';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { ZttDataListType, ZttButtons } from 'app/models/data-list-config';
import { MerchantService } from 'app/services/merchant.service';
import { ExpandableListItem } from 'app/models/expandable-list';

@Component({
  selector: 'ztt-business-partner-customer-summary-v2',
  templateUrl: './business-partner-customer-summary-v2.component.html'
})
export class BusinessPartnerCustomerSummaryV2Component {
  @Input() merchantId: string;
  @Output() createInvoiceEvent = new EventEmitter<BusinessPartnerMerchant>();
  @Output() loadTrackedObjectHistoryEvent = new EventEmitter<BusinessPartnerMerchant>();

  @ViewChild('merchantTrackedObjectModal', { static: true })
  merchantTrackedObjectModal: TemplateRef<Element>;

  @ViewChild('businessGradeModal', { static: true })
  businessGradeModal: TemplateRef<Element>;

  trackedBusinessPartnerMerchant: BusinessPartnerMerchant;

  private _defaultModalConfig: ModalOptions = { class: 'modal-lg' };
  private _configType: ZttDataListType = ZttDataListType.BP_CUSTOMERS;
  private _grade: SmallBusinessGrade;
  private _modalRef: BsModalRef;

  private _masterSelected: boolean;
  private _editButtonLabel = ZttButtons.edit;

  constructor(private bpms: BusinessPartnerMerchantService,
              private bsModalService: BsModalService,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private translateService: TranslateService) {}

  createInvoice(merchant: BusinessPartnerMerchant): void {
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Create Invoice');
    this.createInvoiceEvent.emit(merchant);
  }

  getAutoPayStatus(merchant: BusinessPartnerMerchant): string {
    return this.bpms.getAutoPayStatus(merchant);
  }

  getAutoSendStatus(merchant: BusinessPartnerMerchant): string {
    return this.bpms.getAutoSendStatus(merchant);
  }

  getCurrentLang(): string {
    return this.translateService.currentLang;
  }

  getCustomerLastEvent(event: TrackedObjectState): string {
    return BusinessPartnerService.getLastEventFromTrackedObjectState(event);
  }

  getCustomerSource(merchant: BusinessPartnerMerchant): string {
    return this.bpms.getCustomerSource(merchant);
  }

  hasAutoPay(merchant: BusinessPartnerMerchant): boolean {
    return this.bpms.hasAutoPay(merchant);
  }

  hasAutoSend(merchant: BusinessPartnerMerchant): boolean {
    return this.bpms.hasAutoSend(merchant);
  }

  hasAvailableAmount(merchant: BusinessPartnerMerchant): boolean {
    return this.bpms.hasAvailableAmount(merchant);
  }

  hasDifferentSignupProperties(merchant: BusinessPartnerMerchant): boolean {
    return this.bpms.hasDifferentSignupProperties(merchant);
  }

  hasLinkedMerchant(merchant: BusinessPartnerMerchant): boolean {
    return this.bpms.hasLinkedMerchant(merchant);
  }

  hasSmallBusinessGrade(merchant: BusinessPartnerMerchant): boolean {
    return this.bpms.hasSmallBusinessGrade(merchant);
  }

  openCustomerHistoryModal(merchant: BusinessPartnerMerchant): void {
    this.trackedBusinessPartnerMerchant = merchant;
    this.modalRef = this.bsModalService.show(this.merchantTrackedObjectModal, this._defaultModalConfig);
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  selectAllButtonLabel(areAllSelected: boolean): ZttButtons {
    return areAllSelected ? ZttButtons.unselectAll : ZttButtons.selectAll;
  }

  showBusinessGradeModal(grade?: SmallBusinessGrade): void {
    this.grade = grade;
    const config: ModalOptions = { class: 'modal-lg' };
    this.modalRef = this.bsModalService.show(this.businessGradeModal, config);
  }

  subscribeToAutoSend(listItems: ExpandableListItem[], autoSend: boolean, updateEvent: EventEmitter<AutoSendParams>, editEvent: EventEmitter<void>): void {
    const bpmIds = listItems.filter((m) => !!m.isSelected).map((m) => m.data.id);
    updateEvent.emit({ business_partner_merchants_ids: bpmIds, auto_send: autoSend });
    this.toggleEdit(listItems, editEvent);
  }

  toggleEdit(listItems: ExpandableListItem[], editEvent: EventEmitter<void>): void {
    if (this.editButtonLabel === ZttButtons.edit) {
      this.editButtonLabel = ZttButtons.cancel;
    } else {
      this.resetButtonStates(listItems);
    }
    editEvent.emit();
  }

  toggleSelectAll(merchants: ExpandableListItem[]): void {
    this.masterSelected = !this.masterSelected;
    merchants.forEach((merchant) => merchant.isSelected = this.masterSelected);
  }

  private resetButtonStates(listItems: ExpandableListItem[]): void {
    this.editButtonLabel = ZttButtons.edit;
    listItems.forEach((merchant) => merchant.isSelected = false);
  }

  get configType(): ZttDataListType {
    return this._configType;
  }

  get grade(): SmallBusinessGrade {
    return this._grade;
  }

  set grade(value: SmallBusinessGrade) {
    this._grade = value;
  }

  get modalRef(): BsModalRef {
    return this._modalRef;
  }

  set modalRef(value: BsModalRef) {
    this._modalRef = value;
  }

  get masterSelected(): boolean {
    return this._masterSelected;
  }

  set masterSelected(value: boolean) {
    this._masterSelected = value;
  }

  get editButtonLabel(): ZttButtons {
    return this._editButtonLabel;
  }

  set editButtonLabel(value: ZttButtons) {
    this._editButtonLabel = value;
  }

  get isQuickBooksConnected(): boolean {
    return this.merchantService.isQuickBooksConnected();
  }
}
