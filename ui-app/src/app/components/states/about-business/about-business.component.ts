import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { FormGroup, Validators, FormControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BsModalService, ModalOptions, BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { take, takeUntil, finalize } from 'rxjs/operators';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { dateSmallEqualTodayValidator } from 'app/components/utilities/date-picker/date-small-equal-today.validator';
import { Merchant, MerchantPost } from 'app/models/api-entities/merchant';
import { MerchantQueryPost, MerchantQueryResponse } from 'app/models/api-entities/merchant-query';
import { BusinessCertificationService } from 'app/services/business-certification.service';
import { MerchantService } from 'app/services/merchant.service';
import { ErrorService } from 'app/services/error.service';
import { UserSessionService } from 'app/services/user-session.service';
import { jurisdictionBusinessNumberValidator } from 'app/directives/jurisdiction-business-number-validator.directive';
import { Address } from 'app/models/address';
import { Industry } from 'app/models/industry';
import { UiError } from 'app/models/ui-error';
import { ERRORS } from 'app/error.codes';
import { MerchantInfo } from 'app/models/api-entities/lead';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from "app/models/error-response";
import { phoneValidator } from 'app/validators/phone.validator';
import { PHONE_MASK_CONFIG, BUSINESS_NUM_REGEX, PHONE_REGEX, MM_YYYY_DATEPICKER_CONFIG, NUMERAL_CLEAVE_CONFIG } from 'app/constants/formatting.constants';
import Bugsnag from '@bugsnag/js';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from 'app/services/logging.service';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ztt-about-business',
  templateUrl: './about-business.component.html'
})
export class AboutBusinessComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(AddressFormComponent, { static: true })
  addressFormComponent: AddressFormComponent;

  merchantQueryResponse: MerchantQueryResponse;

  @ViewChild('confirmBusinessModal', { static: true })
  confirmBusinessModal: TemplateRef<any>; // eslint-disable-line
  confirmBusinessModalRef: BsModalRef;
  confirmBusinessModalConfig: ModalOptions = {
    class: 'confirm-business-modal ztt-modal modal-dialog-centered',
    keyboard: false
  };

  @ViewChild('businessNotFoundModal', { static: true })
  businessNotFoundModal: TemplateRef<any>; // eslint-disable-line
  businessNotFoundModalRef: BsModalRef;
  businessNotFoundModalConfig: ModalOptions = {
    class: 'business-not-found-modal ztt-modal modal-dialog-centered',
    keyboard: false
  };
  businessNotFoundMsg: string;

  readonly numeralCleaveConfig = NUMERAL_CLEAVE_CONFIG;
  readonly dateEstablishedConfig = MM_YYYY_DATEPICKER_CONFIG;
  readonly phoneMaskConfig = PHONE_MASK_CONFIG;
  readonly noneOfMyBusinessId = '-1';
  readonly IndustryEnum = Industry;
  readonly step = 1;

  aboutBusinessFormGroup = new FormGroup(
    {
      'name': new FormControl(null, [Validators.required]),
      'phone_number': new FormControl(null, [
        Validators.required,
        Validators.pattern(PHONE_REGEX),
        phoneValidator()
      ]),
      'industry': new FormControl(null, [Validators.required]),
      'business_num': new FormControl(null, [Validators.pattern(BUSINESS_NUM_REGEX)]),
      'incorporated_in': new FormControl(null, []),
      'doing_business_as': new FormControl(null, [Validators.required]),
      'self_attested_date_established': new FormControl(null, [Validators.required]),
      'self_attested_average_monthly_sales': new FormControl(null, [Validators.required]),
    },
    { validators: jurisdictionBusinessNumberValidator }
  );

  confirmBusinessFormGroup = new FormGroup({
    businessItemFormControl: new FormControl(null, [Validators.required])
  });

  private _sameAsLegalBusinessName = false;

  unsubscribe$ = new Subject<void>();

  isJurisdictionEnabled = false;

  private _isFetchingMerchants = false;
  private _isSubmittingMerchant = false;
  private _havePrefilledLeadInfo = false;


  constructor(
    private activatedRoute: ActivatedRoute,
    public modalService: BsModalService,
    private configurationService: ConfigurationService,
    private certificationService: BusinessCertificationService,
    private errorService: ErrorService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private translateService: TranslateService,
    private userSessionService: UserSessionService) { }

  ngOnInit(): void {
    this.configureForm();
  }

  ngAfterViewInit(): void {
    this.prepopulateLeadBusinessInfo(this.activatedRoute.snapshot.data.merchantInfo);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // FORM
  private configureForm(): void {
    // Show/hide jurisdiction
    this.isJurisdictionEnabled = this.configurationService.jurisdictionEnabled;

    // Add owner_since if user has an applicant
    if (this.hasApplicant) {
      const ownerSinceControl = new FormControl(null, [Validators.required, dateSmallEqualTodayValidator()]);
      this.aboutBusinessFormGroup.addControl('owner_since', ownerSinceControl);
    }

    //  Sync name + dba on change
    this.aboutBusinessFormGroup.controls['name'].valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((business_name: string) => {
        if (this._sameAsLegalBusinessName) {
          this.aboutBusinessFormGroup.get('doing_business_as').setValue(business_name);
        }
      });
  }

  private initializeConfirmBusinessForm(): void {
    this.confirmBusinessFormGroup.reset();
  }

  private prepopulateLeadBusinessInfo(merchantInfo: MerchantInfo): void {
    if (!merchantInfo) return;

    setTimeout(() => {
      Object.keys(merchantInfo).map((attr: string) => {
        // This will be fine until both forms have overlapping attributes.
        const targetControl = this.aboutBusinessFormGroup.get(attr) || this.addressFormGroup.get(attr);

        // Update and validate the existing keys of the form only if the lead has a value for it
        if (merchantInfo[attr] && targetControl) {
          this._havePrefilledLeadInfo = true;
          targetControl.setValue(merchantInfo[attr]);
          targetControl.markAsTouched();
        }
      });
    });
  }

  submitBusinessInfo(e: MouseEvent): void {
    if (this.isDelegatedAccessMode) {
      this.errorService.show(UiError.delegatedMode);
    } else {
      if (this.aboutBusinessFormGroup.valid && this.addressFormGroup.valid) {
        this._isFetchingMerchants = true;
        const merchantQueryPostData = this.merchantService.buildMerchantQueryPost(this.aboutBusinessFormGroup.getRawValue(), this.addressFormGroup.value);

        this.fetchMerchants(merchantQueryPostData);
      } else {
        this.aboutBusinessFormGroup.markAllAsTouched();
        this.addressFormComponent.markAsTouched();

        const firstEl: Element = document.querySelector('.form-control.ng-invalid');
        /* istanbul ignore next */
        firstEl?.scrollIntoView(true);

        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  onConfirmBusinessClick(id: string): void {
    if (id === this.noneOfMyBusinessId) {
      // Note: This is the use-case where none of the business returned in the fuzzy match are selected by the user.
      //       We then create a new, un-verified merchant with the data points we have.
      this.businessNotFoundMsg = 'NEW_BUSINESS.NOT_FOUND.BODY_1_1_NO_SELECTION';
      this.businessNotFoundModalRef = this.modalService.show(this.businessNotFoundModal, this.businessNotFoundModalConfig);
    } else {
      this._isSubmittingMerchant = true;
      const queryId = this.merchantQueryResponse.query_id;
      const merchantQuerySelectData = this.merchantService.buildMerchantQuerySelectPost(this.aboutBusinessFormGroup.getRawValue(), queryId, id, this.userSessionService.leadId);

      this.certificationService.selectBusiness(merchantQuerySelectData)
        .pipe(take(1))
        .subscribe(
          (res: ZttResponse<Merchant>) => {
            this.loggingService.GTMDnq(res.data.marketing_qualified_lead, merchantQuerySelectData.industry, this.translateService.currentLang);
            this.certificationService.reauth({ merchant_guid: res.data.id });
          },
          (e: ErrorResponse): void => {
            Bugsnag.notify(e);

            this._isSubmittingMerchant = false;
            if (e.statusCode === 409) {
              this.errorService.show(UiError.merchantAlreadyExists);
            } else {
              this.errorService.show(UiError.postMerchant);
            }
          });
    }

    this.confirmBusinessModalRef.hide();
  }

  onBusinessNotFoundNextClick(): void {
    // Note: This is the use-case where no business was returned in the fuzzy match
    //       We then create a new, un-verified merchant with the data points we have.
    const merchantPostData = this.merchantService.buildMerchantPost(this.aboutBusinessFormGroup.getRawValue(), this.addressFormGroup.value, this.userSessionService.leadId);
    this.createMerchant(merchantPostData);
  }

  onDoingBusinessCheckboxClicked(): void {
    this._sameAsLegalBusinessName = !this._sameAsLegalBusinessName;
    const name: string = this.aboutBusinessFormGroup.get('name').value || null;

    if (this._sameAsLegalBusinessName) {
      this.aboutBusinessFormGroup.get('doing_business_as').setValue(name);
      this.aboutBusinessFormGroup.get('doing_business_as').disable();
    } else {
      this.aboutBusinessFormGroup.get('doing_business_as').setValue(null);
      this.aboutBusinessFormGroup.get('doing_business_as').enable();
    }
  }

  // SERVICE CALLS

  createMerchant(merchantPostData: MerchantPost): void {
    this.businessNotFoundModalRef.hide();
    this._isSubmittingMerchant = true;

    this.merchantService.postMerchant(merchantPostData)
      .pipe(take(1))
      .subscribe(
        (res: ZttResponse<Merchant>) => {
          this.loggingService.GTMDnq(res.data.marketing_qualified_lead, merchantPostData.industry, this.translateService.currentLang);
          this.certificationService.reauth({ merchant_guid: res.data.id });
        },
        (e: ErrorResponse): void => {
          this._isSubmittingMerchant = false;
          if (e.statusCode === 409) {
            this.errorService.show(UiError.merchantAlreadyExists);
          } else {
            /* istanbul ignore next */
            Bugsnag.notify(e, event => { event.severity = BugsnagSeverity.info });

            this.errorService.show(UiError.postMerchant);
          }
        });
  }

  fetchMerchants(merchantQueryPostData: MerchantQueryPost): void {
    this.merchantService.queryMerchant(merchantQueryPostData)
      .pipe(take(1), finalize(() => this._isFetchingMerchants = false))
      .subscribe(
        () => {
          this.merchantQueryResponse = this.merchantService.getMerchantQueryResponse();
          if (this.merchantQueryResponse.results.length > 0) {
            this.initializeConfirmBusinessForm();
            this.confirmBusinessModalRef = this.modalService.show(this.confirmBusinessModal, this.confirmBusinessModalConfig);
          } else {
            this.businessNotFoundMsg = 'NEW_BUSINESS.NOT_FOUND.BODY_1_1_NO_MATCH';
            this.businessNotFoundModalRef = this.modalService.show(this.businessNotFoundModal, this.businessNotFoundModalConfig);
          }
        },
        (e: ErrorResponse) => {
          if (e.errorCode !== ERRORS.API.ADDRESS_ERROR) {
            /* istanbul ignore next */
            Bugsnag.notify(e, event => { event.severity = BugsnagSeverity.info });
          }

          this.displayErrorModal(e.errorCode);
        }
      );
  }

  displayErrorModal(code: number): void {
    switch (code) {
      case ERRORS.API.ADDRESS_ERROR: {
        const addressData: Address = this.addressFormGroup.value;
        const address: string = Object.values(addressData).join(', ');
        const context: ErrorModalContext = new ErrorModalContext(
          'ERROR_MODAL.GENERIC.HEADING',
          [
            this.translateService.instant('ABOUT_YOUR_BUSINESS.ERROR'),
            this.translateService.instant('ABOUT_YOUR_BUSINESS.ADDRESS_INVALID_ERROR', { address: address }),
            this.translateService.instant('ERROR_MODAL.GENERIC.BODY_MESSAGE2')
          ]
        );
        this.errorService.show(UiError.general, context);
        break;
      }
      case ERRORS.API.PHONE_NUMBER_ERROR: {
        const phoneNumber: string = this.aboutBusinessFormGroup.value.phone_number;
        const context: ErrorModalContext = new ErrorModalContext(
          'ERROR_MODAL.GENERIC.HEADING',
          [
            this.translateService.instant('ABOUT_YOUR_BUSINESS.ERROR'),
            this.translateService.instant('ABOUT_YOUR_BUSINESS.PHONE_NUMBER_INVALID_ERROR', { phone_number: phoneNumber }),
            this.translateService.instant('ERROR_MODAL.GENERIC.BODY_MESSAGE2')
          ]
        );
        this.errorService.show(UiError.general, context);
        break;
      }
      case ERRORS.API.SERVICE_ERROR: {
        const context: ErrorModalContext = new ErrorModalContext(
          'ERROR_MODAL.SERVICE_ERROR',
          [
            this.translateService.instant('ABOUT_YOUR_BUSINESS.SERVICE_ERROR'),
            this.translateService.instant('ERROR_MODAL.GENERIC.BODY_MESSAGE2')
          ]
        );
        this.errorService.show(UiError.general, context);
        break;
      }
      default: {
        this.errorService.show(UiError.general);
      }
    }
  }

  // USER INTERACTION METHODS

  isBusinessControlInvalid(name: string): boolean {
    return !!(this.aboutBusinessFormGroup?.get(name)?.touched
      && this.aboutBusinessFormGroup.get(name).invalid);
  }

  businessNumberHasInvalidCharacter(): ValidationErrors | false {
    const bnErrors = this.aboutBusinessFormGroup.get('business_num').errors;
    return bnErrors ? bnErrors.pattern : false;
  }

  businessNumberHasInvalidAlphanumericCharacter(): boolean {
    return this.aboutBusinessFormGroup.hasError('alphanumeric');
  }

  businessNumberHasInvalidNumericCharacter(): boolean {
    return this.aboutBusinessFormGroup.hasError('numeric');
  }

  businessNumberHasInvalidFederalCharacter(): boolean {
    return this.aboutBusinessFormGroup.hasError('federal');
  }

  businessNumberHasInvalidAlphaStartCharacter(): boolean {
    return this.aboutBusinessFormGroup.hasError('alphastart');
  }

  businessNumberHasInvalidLength(): boolean {
    return this.aboutBusinessFormGroup.hasError('length');
  }

  businessNumberHasJurisdictionError(): boolean {
    return this.businessNumberHasInvalidAlphanumericCharacter() ||
      this.businessNumberHasInvalidNumericCharacter() ||
      this.businessNumberHasInvalidFederalCharacter() ||
      this.businessNumberHasInvalidAlphaStartCharacter() ||
      this.businessNumberHasInvalidLength();
  }

  goBackConfirmBusinessModal(): void {
    this.confirmBusinessModalRef.hide();
  }

  goBackBusinessNotFoundModal(): void {
    this.businessNotFoundModalRef.hide();
  }

  get hasApplicant(): boolean {
    return this.userSessionService.hasApplicant;
  }

  get isNextDisabled(): boolean {
    return this._isFetchingMerchants || this._isSubmittingMerchant || this.isDelegatedAccessMode;
  }

  get isNextWorking(): boolean {
    return this._isFetchingMerchants || this._isSubmittingMerchant;
  }

  setBusiness(id: string): void {
    this.confirmBusinessFormGroup.setValue({ 'businessItemFormControl': id });
  }

  // GETTERS & SETTERS

  get industryKeys(): Array<string> {
    return Object.keys(Industry);
  }

  get addressFormGroup(): FormGroup {
    return this.addressFormComponent.addressFormGroup;
  }

  get isDelegatedAccessMode(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  // UI Flags

  get isFetchingMerchants(): boolean { return this._isFetchingMerchants; }

  get isSubmittingMerchant(): boolean { return this._isSubmittingMerchant; }

  get havePrefilledLeadInfo(): boolean { return this._havePrefilledLeadInfo; }
}
