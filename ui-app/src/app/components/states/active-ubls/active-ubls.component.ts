import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
// Services
import { MerchantUpdateThrottling } from 'app/services/business-logic/merchant-update-throttling';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoadingService } from 'app/services/loading.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';

// Third Party
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { UblService } from 'app/services/ubl.service';
import { UiError } from 'app/models/ui-error';

@Component({
  selector: 'ztt-active-ubls',
  templateUrl: './active-ubls.component.html'
})
export class ActiveUblsComponent implements OnInit, OnDestroy {
  static className = 'active_ubls';
  unsubscribe$ = new Subject<void>();

  @ViewChild('editMerchantModal', { static: true })
  editMerchantModal: TemplateRef<any>; // eslint-disable-line
  editMerchantModalRef: BsModalRef;
  editMerchantModalConfig: ModalOptions = {
    class: 'zt-modal mt-3 modal-xl modal-dialog-centered',
  };

  // UI flags
  loaded: boolean;
  hasPaymentPlan = false;
  isDelinquent = false;
  mainLoader: string;

  constructor(
    public modalService: BsModalService,
    public translateService: TranslateService,
    private errorService: ErrorService,
    private ublService: UblService,
    private loadingService: LoadingService,
    private merchantService: MerchantService,
    private offerService: OfferService,
    private configurationService: ConfigurationService
  ) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  ngOnInit(): void {
    this.loadingService.showMainLoader();
    this.loadUbls();
    this.loadMerchant();
    this.hideLoaders(); // Nothing left to load at this point
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // SUBSCRIPTIONS
  private loadUbls(): void {
    this.ublService.loadUbls$()
      .pipe(take(1))
      .subscribe(
        () => this.hasPaymentPlan = this.ublService.hasPaymentPlan$.value,
        () => this.errorService.show(UiError.loadUbls)
      );
  }

  private loadMerchant(): void {
    this.merchantService.loadMerchant()
      .pipe(take(1))
      .subscribe(
        () => {
          this.isDelinquent = this.merchantService.isDelinquent$.value;
        },
        () => {
          this.errorService.show(UiError.general);
        }
      );
  }

  /**
   * Sets loaded to true so template knows to display dashboard contents and hides loader.
   */
  private hideLoaders(): void {
    this.loaded = true;
    this.loadingService.hideMainLoader();
  }

  showEditMerchant(): void {
    this.editMerchantModalRef = this.modalService.show(this.editMerchantModal, this.editMerchantModalConfig);
  }

  hideEditMerchant(): void {
    this.editMerchantModalRef.hide();
  }


  get isKycFailed(): boolean {
    return this.merchantService.isKycFailed();
  }

  get isKycSelfFixInProgress(): boolean {
    return MerchantUpdateThrottling.isMerchantUpdateInProgress(this.merchantService.merchantId);
  }

  get isSelfFixableKycFailure(): boolean {
    return this.merchantService.isCOECheckFailed()
      && MerchantUpdateThrottling.canUpdateMerchant(this.merchantService.merchantId)
      && this.configurationService.merchantSelfEditEnabled;
  }

  get isNonFixableKycFailure(): boolean {
    const failed = this.merchantService.isCOECheckFailed() ?
      (!MerchantUpdateThrottling.canUpdateMerchant(this.merchantService.merchantId) && !MerchantUpdateThrottling.isMerchantUpdateInProgress(this.merchantService.merchantId))
      : this.isKycFailed;

    return failed ? this.offerService.blockOnKycFailure(this.offerService.locOffer) : false;
  }

  get isCovidDisabled(): boolean {
    return this.configurationService.covidFinancingDisabled;
  }

  get isInvoiceUiDisabled(): boolean {
    return this.configurationService.disableInvoiceUi;
  }

  get isWcaCardDisabled(): boolean {
    return this.configurationService.disableWcaCard;
  }
}
