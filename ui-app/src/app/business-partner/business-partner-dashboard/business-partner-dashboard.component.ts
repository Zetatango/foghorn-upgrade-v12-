import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import Bugsnag from '@bugsnag/js';
import { TranslateService } from '@ngx-translate/core';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerCustomerSummary, BusinessPartnerMerchant } from 'app/models/api-entities/business-partner-customer-summary';
import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { DatatablesRequestParameters } from 'app/models/api-entities/datatables-request-parameters';
import { Invoice } from 'app/models/api-entities/invoice';
import { InvoiceList } from 'app/models/api-entities/invoice-list';
import { Merchant } from 'app/models/api-entities/merchant';
import { OmniauthFlowResponse, QuickbooksFlowMessage } from 'app/models/api-entities/omniauth-flow-response';
import { ErrorResponse } from "app/models/error-response";
import { UpdateProfileEvent } from 'app/models/api-entities/update-profile-event';
import { CustomerSummaryParams } from 'app/models/customer-summary-params';
import { DatatablesParams } from 'app/models/datatables';
import { InviteParams } from 'app/models/invite-params';
import { InvoiceListParams } from 'app/models/invoice-list-params';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoadingService } from 'app/services/loading.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { QuickbooksService } from 'app/services/quickbooks.service';
import { UserSessionService } from 'app/services/user-session.service';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { TabDirective } from 'ngx-bootstrap/tabs';
import { Subject } from 'rxjs';
import { finalize, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-business-partner-dashboard',
  templateUrl: './business-partner-dashboard.component.html'
})
export class BusinessPartnerDashboardComponent implements OnDestroy, OnInit {
  unsubscribe$ = new Subject<void>();
  alerts: UiAlert[] = [];

  private _merchant: Merchant;
  private _mainLoader: string;
  private _loaded: boolean;
  private _currentDate: number;
  private _businessPartnerMerchants: BusinessPartnerMerchant[];
  private _inviting: boolean;
  private _modalRef: BsModalRef;
  private _trackedBusinessPartnerMerchant: BusinessPartnerMerchant;
  private _payor: BusinessPartnerMerchant;
  private _datatablesSentInvoicesRequestParams: DatatablesRequestParameters;
  private _datatablesCustomerSummaryRequestParams: DatatablesRequestParameters;
  private _invoiceList: Invoice[];
  private _trackedInvoice: Invoice;
  private _businessPartnerProfile: BusinessPartnerProfile;
  private _partnerTrainingScheduledSubject$: Subject<boolean> = new Subject<boolean>();
  private _businessPartnerApplication: BusinessPartnerApplication;
  private _defaultModalConfig: ModalOptions = { class: 'modal-lg' };

  @ViewChild('merchantTrackedObjectModal', { static: true })
  merchantTrackedObjectModal: TemplateRef<Element>;

  @ViewChild('createInvoiceModal', { static: true })
  createInvoiceModal: TemplateRef<Element>;

  @ViewChild('invoiceTrackedObjectModal', { static: true })
  invoiceTrackedObjectModal: TemplateRef<Element>;

  @ViewChild('sentInvoicesTabV2', { static: true })
  sentInvoicesTabV2: TemplateRef<Element>;

  @ViewChild('customerSummaryTabV2', { static: true })
  customerSummaryTabV2: TemplateRef<Element>;

  @ViewChild('shareModal', { static: true })
  shareModal: TemplateRef<Element>;

  @ViewChild('quickBooksModal', { static: true })
  quickBooksModal: TemplateRef<Element>;

  @ViewChild('fabMenuModal', { static: true })
  fabMenuModal: TemplateRef<Element>;

  @ViewChild('invitePartnerModal', { static: true })
  invitePartnerModal: TemplateRef<Element>;

  @ViewChild('tab1')
  tab1: TabDirective;

  @ViewChild('tab2')
  tab2: TabDirective;

  constructor(private bsModalService: BsModalService,
              private businessPartnerService: BusinessPartnerService,
              private configurationService: ConfigurationService,
              private loadingService: LoadingService,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private quickbooksService: QuickbooksService,
              private _translateService: TranslateService,
              private userSessionService: UserSessionService) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.quickbooksService.finishOmniauthFlow(OmniauthProviderConnectEvent.cancel);
  }

  ngOnInit(): void {
    this.currentDate = Date.now();
    this.merchant = this.merchantService.getMerchant();
    this.fetchBusinessPartnerProfile();
    this.loaded = true;
    this.fetchBusinessPartnerApplication();

    this.quickbooksService.receiveConnectedEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (flowResponse: OmniauthFlowResponse) => {
          this.receiveQuickbooksConnectedEvent(flowResponse.status === true, flowResponse.message);
        },
        () => {
          this.receiveQuickbooksConnectedEvent(false);
        });
  }

  receiveSendInviteEvent($event: InviteParams): void {
    this.performSendInvite($event.name, $event.email);
    this.refreshBusinessPartnerProfile();
  }

  reloadBusinessPartnerMerchantsEvent(): void {
    this.getCustomerSummary(null, null);
  }

  receiveSendInvoiceCompleteEvent(): void {
    this.hideModal();
    this.alerts.push({
      type: UiAlertStatus.success,
      msg: 'INVOICE.SUCCESS',
      timeout: 5000
    });
    this.getSentInvoices(null, null);
    this.getCustomerSummary(null, null);
    this.refreshBusinessPartnerProfile();
  }

  private receiveQuickbooksConnectedEvent(isSuccessful: boolean, message?: string): void {
    if (
      message
      && message === QuickbooksFlowMessage.realmIdChangedError
      && this.merchant?.quickbooks_realm_id
    ) {
      this.alerts.push({
        type: UiAlertStatus.danger,
        msg: 'QUICKBOOKS.CONNECT_FAIL_REALMID',
        params: { realm_id: this.merchant.quickbooks_realm_id },
        timeout: 20000
      });
    } else if (isSuccessful) {
      this.handleSuccessQuickbooksConnectEvent('QUICKBOOKS.CONNECT_SUCCESS');
    } else {
      this.handleFailedQuickbooksConnectEvent('QUICKBOOKS.CONNECT_FAIL');
    }

    if (isSuccessful) {
      this.merchantService
        .loadMerchant()
        .pipe(take(1))
        .subscribe();

      this.startImportCheck();
    }
  }

  handleSuccessQuickbooksConnectEvent(message?: string):  void {
    this.alerts.push({
      type: UiAlertStatus.success,
      msg: message,
      timeout: 5000
    });
  }

  handleFailedQuickbooksConnectEvent(message?: string): void {
    this.alerts.push({
      type: UiAlertStatus.danger,
      msg: message,
      timeout: 5000
    });
  }

  startImportCheck(): void {
    this.quickbooksService.importCheckObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        complete: () => this.receiveQuickbooksImportedEvent()
      });
  }

  receiveQuickbooksImportedEvent(): void {
    this.getCustomerSummary(null, null);
    this.getSentInvoices(null, null);
  }

  receiveCustomerSummaryEvent($event: CustomerSummaryParams): void {
    this.getCustomerSummary($event.dataTablesParameters, $event.callback);
  }

  receiveOpenInviteEvent(): void {
    this.showPartnerInviteModal();
  }

  receiveShareEvent(): void {
    this.showShareModal();
  }

  receiveQuickBooksOpenEvent(): void {
    this.hideFabMenu();
    this.quickbooksService.initiateAuthFlow();
  }

  receiveCreateInvoiceEvent($event: BusinessPartnerMerchant): void {
    this.createInvoice($event);
  }

  receiveLoadTrackedCustomerHistoryEvent($event: BusinessPartnerMerchant): void {
    this.trackedBusinessPartnerMerchant = $event;
    this.showMerchantTrackedObjectHistoryModal();
  }

  receiveHideModal(): void {
    this.hideModal();
  }

  receiveFetchInvoiceListEvent($event: InvoiceListParams): void {
    this.getSentInvoices($event.dataTablesParameters, $event.callback);
  }

  receiveLoadTrackedInvoiceHistoryEvent($event: Invoice): void {
    this.trackedInvoice = $event;
    this.showInvoiceTrackedObjectHistoryModal();
  }

  receiveUpdateProfileEvent($event: UpdateProfileEvent): void {
    this.updateProfile($event.params);
  }

  getCustomerSummary(datatablesParams: DatatablesParams, datatablesCallback: any): void { // eslint-disable-line
    if (!datatablesParams && !this.datatablesCustomerSummaryRequestParams) {
      return;
    }

    if (datatablesParams) {
      this.datatablesCustomerSummaryRequestParams = {
        filter: datatablesParams.search.value,
        limit: datatablesParams.length,
        offset: datatablesParams.start,
        order_by: datatablesParams.columns[datatablesParams.order[0].column].name,
        order_direction: datatablesParams.order[0].dir
      };
    }

    this.businessPartnerService.getCustomerSummary(this.merchant.id, this.datatablesCustomerSummaryRequestParams)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
      () => {
        this.setBusinessPartnerCustomerSummarySubscription(datatablesCallback);
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);
      }
    );
  }

  createInvoice(merchant: BusinessPartnerMerchant): void {
    this.payor = merchant;
    this.modalRef = this.bsModalService.show(this.createInvoiceModal, this._defaultModalConfig);
  }

  openFabMenu(): void {
    this.showFabMenu();
  }

  merchantDisplayName(): string {
    return this.merchant.doing_business_as ? this.merchant.doing_business_as : this.merchant.name;
  }

  onClosed(dismissedAlert: UiAlert): void {
    this.alerts = (this.alerts || []).filter(alert => alert !== dismissedAlert);
  }

  schedulePartnerTrainingWithCalendly(): void {
    window['Calendly'].initPopupWidget({
      url: this.configurationService.calendlyUrl,
      prefill: {
        name: this.userSessionService.userSession.name,
        email: this.userSessionService.userSession.email
      }
    });

    this.setupCalendlyEventListeners();
  }

  onSelectTab(tab: TabDirective): void {
    this.loggingService.GTMUpdate(GTMEvent.TAB_CLICKED, tab.heading);
  }

  private setupCalendlyEventListeners(): void {
    this.partnerTrainingScheduledSubject$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.setPartnerTrainingScheduledCompleted();
    });

    window.addEventListener('message', (e) => {
      if (e.data.event === 'calendly.event_scheduled') {
        this.partnerTrainingScheduledSubject$.next(true);
      }
    });
  }

  private performSendInvite(name: string, emailAddress: string): void {
    this.inviting = true;
    this.businessPartnerService.inviteBorrower(this.merchant.id, emailAddress, name)
      .pipe(
        finalize(() => this.inviting = false),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        () => {
          this.alerts.push({
            type: UiAlertStatus.success,
            msg: 'INVITE.SUCCESS',
            timeout: 5000
          });
          this.getCustomerSummary(null, null);
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.alerts.push({
            type: UiAlertStatus.danger,
            msg: 'INVITE.ERROR',
            timeout: 5000
          });
        }
      );
  }

  private setBusinessPartnerCustomerSummarySubscription(datatablesCallback: any): void { // eslint-disable-line
    this.businessPartnerService.getBusinessPartnerCustomerSummary().pipe(takeUntil(this.unsubscribe$)).subscribe(
      (businessPartnerCustomerSummary: BusinessPartnerCustomerSummary) => {
        if (businessPartnerCustomerSummary) {
          this.businessPartnerMerchants = businessPartnerCustomerSummary.business_partner_merchants;
          if (datatablesCallback) {
            datatablesCallback({
              recordsTotal: businessPartnerCustomerSummary.total_count,
              recordsFiltered: businessPartnerCustomerSummary.filtered_count,
              data: [] // Set this to empty so we use Angular's renderer/two way data binding to display the data instead of Datatables renderer
            });
          }
        }
      });
  }

  private showMerchantTrackedObjectHistoryModal() {
    this.modalRef = this.bsModalService.show(this.merchantTrackedObjectModal, this._defaultModalConfig);
  }

  private showInvoiceTrackedObjectHistoryModal() {
    this.modalRef = this.bsModalService.show(this.invoiceTrackedObjectModal, this._defaultModalConfig);
  }

  private showPartnerInviteModal(): void {
    this.hideFabMenu();
    this.modalRef = this.bsModalService.show(this.invitePartnerModal, this._defaultModalConfig);
  }

  private showShareModal(): void {
    this.hideFabMenu();
    this.modalRef = this.bsModalService.show(this.shareModal, this._defaultModalConfig);
  }

  private showFabMenu(): void {
    const config: ModalOptions = {
      backdrop: 'static',
      animated: false
    };
    this.modalRef = this.bsModalService.show(this.fabMenuModal, config);
  }

  private hideFabMenu(): void {
    this.hideModal();
  }

  private getSentInvoices(datatablesParams: DatatablesParams, datatablesCallback: any): void { // eslint-disable-line
    if (!datatablesParams && !this.datatablesSentInvoicesRequestParams) {
      return;
    }

    if (datatablesParams) {
      this.datatablesSentInvoicesRequestParams = {
        filter: datatablesParams.search.value,
        limit: datatablesParams.length,
        offset: datatablesParams.start,
        order_by: datatablesParams.columns[datatablesParams.order[0].column].name,
        order_direction: datatablesParams.order[0].dir
      };
    }

    this.businessPartnerService.getSentInvoices(this.merchant.id, this.datatablesSentInvoicesRequestParams).pipe(takeUntil(this.unsubscribe$)).subscribe(
      () => {
        this.setBusinessPartnerSentInvoicesSubscription(datatablesCallback);
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);
      }
    );
  }

  private fetchBusinessPartnerApplication(): void {
    this.businessPartnerService.fetchBusinessPartnerApplication(this.merchantService.getMerchant().id, false).pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.businessPartnerService.getBusinessPartnerApplication().pipe(takeUntil(this.unsubscribe$))
          .subscribe((businessPartnerApplication: BusinessPartnerApplication) => {
            this.businessPartnerApplication = businessPartnerApplication;
          });
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);
      });
  }

  private setBusinessPartnerSentInvoicesSubscription(datatablesCallback: any): void { // eslint-disable-line
    this.businessPartnerService.getBusinessPartnerSentInvoices().pipe(takeUntil(this.unsubscribe$)).subscribe((businessPartnerSentInvoices: InvoiceList) => {
      if (businessPartnerSentInvoices) {
        this.invoiceList = businessPartnerSentInvoices.business_partner_invoices;

        if (datatablesCallback) {
          datatablesCallback({
            recordsTotal: businessPartnerSentInvoices.total_count,
            recordsFiltered: businessPartnerSentInvoices.filtered_count,
            data: [] // Set this to empty so we use Angular's renderer/two way data binding to display the data instead of Datatables renderer
          });
        }
      }
    });
  }

  private setPartnerTrainingScheduledCompleted(): void {
    const params: BusinessPartnerProfileRequestParams = {
      partner_training_completed: true
    };

    this.updateProfile(params);
  }

  private fetchBusinessPartnerProfile(): void {
    this.businessPartnerService.getProfile(this.merchant.id)
      .pipe(take(1))
      .subscribe(
        () => {
          this.setBusinessPartnerProfileSubscription();
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);
        }
      );
  }

  private refreshBusinessPartnerProfile(): void {
    this.businessPartnerService.getProfile(this.merchant.id)
      .pipe(take(1))
      .subscribe({
          error: (e: ErrorResponse) => {
            Bugsnag.notify(e);
          }
        });
  }

  private updateProfile(params): void {
    this.businessPartnerService.updateProfile(this.merchant.id, params)
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);
        }
      });
  }

  private setBusinessPartnerProfileSubscription(): void {
    this.businessPartnerService.getBusinessPartnerProfile().pipe(takeUntil(this.unsubscribe$)).subscribe((businessPartnerProfile: BusinessPartnerProfile) => {
      this.businessPartnerProfile = businessPartnerProfile;
    });
  }

  private hideModal(): void {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  get merchant(): Merchant {
    return this._merchant;
  }

  set merchant(merchant: Merchant) {
    this._merchant = merchant;
  }

  get mainLoader(): string {
    return this._mainLoader;
  }

  set mainLoader(loader: string) {
    this._mainLoader = loader;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(loaded: boolean) {
    this._loaded = loaded;
  }

  get currentDate(): number {
    return this._currentDate;
  }

  set currentDate(currentDate: number) {
    this._currentDate = currentDate;
  }

  get translateService(): TranslateService {
    return this._translateService;
  }

  get businessPartnerMerchants(): BusinessPartnerMerchant[] {
    return this._businessPartnerMerchants;
  }

  set businessPartnerMerchants(merchants: BusinessPartnerMerchant[]) {
    this._businessPartnerMerchants = merchants;
  }

  get inviting(): boolean {
    return this._inviting;
  }

  set inviting(inviting: boolean) {
    this._inviting = inviting;
  }

  get trackedBusinessPartnerMerchant(): BusinessPartnerMerchant {
    return this._trackedBusinessPartnerMerchant;
  }

  set trackedBusinessPartnerMerchant(value: BusinessPartnerMerchant) {
    this._trackedBusinessPartnerMerchant = value;
  }

  get modalRef(): BsModalRef {
    return this._modalRef;
  }

  set modalRef(value: BsModalRef) {
    this._modalRef = value;
  }

  get payor(): BusinessPartnerMerchant {
    return this._payor;
  }

  set payor(value: BusinessPartnerMerchant) {
    this._payor = value;
  }

  get datatablesCustomerSummaryRequestParams(): DatatablesRequestParameters {
    return this._datatablesCustomerSummaryRequestParams;
  }

  set datatablesCustomerSummaryRequestParams(value: DatatablesRequestParameters) {
    this._datatablesCustomerSummaryRequestParams = value;
  }

  get datatablesSentInvoicesRequestParams(): DatatablesRequestParameters {
    return this._datatablesSentInvoicesRequestParams;
  }

  set datatablesSentInvoicesRequestParams(value: DatatablesRequestParameters) {
    this._datatablesSentInvoicesRequestParams = value;
  }

  get invoiceList(): Invoice[] {
    return this._invoiceList;
  }

  set invoiceList(value: Invoice[]) {
    this._invoiceList = value;
  }

  get trackedInvoice(): Invoice {
    return this._trackedInvoice;
  }

  set trackedInvoice(value: Invoice) {
    this._trackedInvoice = value;
  }

  set businessPartnerProfile(value: BusinessPartnerProfile) {
    this._businessPartnerProfile = value;
  }

  get businessPartnerProfile(): BusinessPartnerProfile {
    return this._businessPartnerProfile;
  }

  get businessPartnerApplication(): BusinessPartnerApplication {
    return this._businessPartnerApplication;
  }

  set businessPartnerApplication(value: BusinessPartnerApplication) {
    this._businessPartnerApplication = value;
  }

  get partnerTrainingScheduledSubject$(): Subject<boolean> {
    return this._partnerTrainingScheduledSubject$;
  }

  get displayConnectToQuickBooks(): boolean {
    // TODO: Implement handling of about to expire
    return this.configurationService.quickBooksConnectEnabled &&
      !this.merchantService.isQuickBooksConnected();
  }
}
