import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Agreement, AgreementType } from 'app/models/agreement';
import { Merchant } from 'app/models/api-entities/merchant';
import { Supplier } from 'app/models/api-entities/supplier';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { AgreementService } from 'app/services/agreement.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ReauthService } from 'app/services/reauth.service';
import { SupplierService } from 'app/services/supplier.service';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";


@Component({
  selector: 'ztt-agreement',
  templateUrl: './agreement.component.html'
})
export class AgreementComponent implements OnInit, OnDestroy {
  @Output() nextEvent = new EventEmitter<void>();
  @Output() backEvent = new EventEmitter<void>();

  private _merchant: Merchant;
  private _supplier: Supplier;
  private _agreement: Agreement;
  private _agreementType: AgreementType;
  private _loaded = false;
  private _signingAgreement = false;
  unsubscribe$ = new Subject<void>();

  /**
   * Agreement
   */
  get agreement(): Agreement {
    return this._agreement;
  }

  set agreement(agreement: Agreement) {
    this._agreement = agreement;
  }

  /**
   * Signing Agreement flag
   */
  get signingAgreement(): boolean {
    return this._signingAgreement;
  }

  set signingAgreement(signing: boolean) {
    this._signingAgreement = signing;
  }

  /**
   * Merchant
   */
  get merchant(): Merchant {
    return this._merchant;
  }

  set merchant(merchant: Merchant) {
    this._merchant = merchant;
  }

  get merchantId(): string {
    return this.merchant ? this.merchant.id : null;
  }

  /**
   * Supplier
   */
  get supplier(): Supplier {
    return this._supplier;
  }

  set supplier(supplier: Supplier) {
    this._supplier = supplier;
  }

  get supplierId(): string {
    return this.supplier ? this.supplier.id : null;
  }

  /**
   * Localised agreement name.
   */
  get agreementName(): string {
    return this.translateService.instant('AGREEMENT.NAME.' + this.agreementType);
  }

  /**
   * Agreement content.
   */
  get agreementContent(): string {
    return this.agreement ? this.agreement.content : '';
  }

  /**
   * Agreement file name. Uses localised agreement type with 'Ario' prefix and replaces spaces with underscores.
   */
  get agreementFileName(): string {
    return ('Ario ' + this.translateService.instant('AGREEMENT.NAME.' + this.agreementType)).replace(/ /g, '_');
  }

  /**
   * Container text (description at top of card).
   */
  get containerText(): string {
    return 'AGREEMENT.CONTAINER_TEXT_TOP.' + this.agreementType;
  }

  /**
   * Merchant name
   */
  get merchantName(): string {
    return this.merchant ? this.merchant.name : '';
  }

  constructor(private errorService: ErrorService,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private reauthService: ReauthService,
              private supplierService: SupplierService,
              public translateService: TranslateService,
              public agreementService: AgreementService,
              private ngZone: NgZone) {
  }

  ngOnInit(): void {
    this.getMerchant();
    this.subscribeToSupplier();
    this.subscribeToAgreement();

    this.loadAgreementByType(this.merchantId, this.supplierId);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    if (this.agreementType === AgreementType.pre_authorized_financing) {
      this.agreementService.clearActivePafAgreementForMerchant(this.merchantId);
      this.supplierService.clearSelectedSupplierIdForMerchant(this.merchantId);
    }
  }

  sign(): void {
    this.performReauth();
  }

  back(): void {
    this.backEvent.emit();
  }

  /**
   * Subscriptions.
   */
  private subscribeToSupplier(): void {
    this.supplierService.getSupplier().pipe(takeUntil(this.unsubscribe$)).subscribe((supplier) => {
      this.supplier = supplier;
    });
  }

  private subscribeToAgreement(): void {
    this.agreementService.agreementSubject.pipe(takeUntil(this.unsubscribe$)).subscribe((agreement) => {
      if (agreement && agreement.type === this.agreementType) {
        this.agreement = agreement;
        this.loaded = true;
      }
    });
  }

  /**
   * Get agreement from API.
   */

  private loadAgreementByType(merchantId: string, supplierId: string): void {
    if (this.agreementType === AgreementType.pre_authorized_financing && !supplierId) {
      supplierId = this.supplierService.getSelectedSupplierIdForMerchant(merchantId);
    }

    this.agreementService.loadAgreementByType(merchantId, this.agreementType, true, supplierId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.general);
        }
      });
  }

  /**
   * Get merchant from service. Assumes merchant has already been loaded by parent component.
   */
  private getMerchant(): void {
    this.merchant = this.merchantService.getMerchant();
  }

  /**
   * Performs reauth by trigger new sign in window and closing it when done.
   */
  private performReauth(): void {
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Sign Agreement of type: ' + this.agreementType);
    if (!this.signingAgreement) {
      const locale: string = this.translateService.currentLang;
      this.signingAgreement = true;
      this.reauthService.open(locale)
        .pipe(
          finalize(() => this.signingAgreement = false),
          takeUntil(this.unsubscribe$)
        )
        .subscribe((data: any) => { // eslint-disable-line
          this.ngZone.run(() =>{
            if (data.status === this.reauthService.SUCCESS) {
              this.accept();
            }
          });
        }, () => {
          this.errorService.show(UiError.signByReauth);
        });
    }
  }

  /**
   * Makes call to API to accept the agreement.
   */
  private accept(): void {
    this.agreementService.accept()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.nextEvent.emit();
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.general);
        }
      );
  }

  get agreementType(): AgreementType {
    return this._agreementType;
  }

  @Input()
  set agreementType(value: AgreementType) {
    this._agreementType = value;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(value: boolean) {
    this._loaded = value;
  }
}
