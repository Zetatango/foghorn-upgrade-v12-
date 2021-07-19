import { Component, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
// Services
import { BusinessCertificationService } from 'app/services/business-certification.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
// Validators
import { sinValidator } from './sin.validator';
import { ageRangeValidator, dateSmallEqualTodayValidator } from 'app/components/utilities/date-picker/date-small-equal-today.validator';
// Components
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
// Models
import { Applicant, SubmitApplicantResponse } from 'app/models/api-entities/applicant';
import { ApplicantPost } from 'app/models/api-entities/applicant-post';
import { PartialApplicantLead } from 'app/models/api-entities/lead';
import { ZttResponse } from 'app/models/api-entities/response';
import { Country } from 'app/models/api-entities/utility';
import { Address } from 'app/models/address';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { ERRORS } from 'app/error.codes';
import { phoneValidator } from 'app/validators/phone.validator';
import { SIN_MASK_CONFIG, PHONE_MASK_CONFIG, PHONE_REGEX } from 'app/constants/formatting.constants';
import { ActivatedRoute } from '@angular/router';
import { ErrorResponse } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';
import { BugsnagSeverity } from 'app/models/bugsnag';
@Component({
  selector: 'ztt-about-you',
  templateUrl: './about-you.component.html'
})

export class AboutYouComponent implements AfterViewInit {
  readonly step = 2;

  applicantFormGroup: FormGroup = this.fb.group({
    first_name: [ null, [ Validators.required ] ],
    last_name: [ null, [ Validators.required ] ],
    date_of_birth: [ null, [ Validators.required, ageRangeValidator() ] ],
    phone_number: [ null, [
      Validators.required,
      Validators.pattern(PHONE_REGEX),
      phoneValidator()
    ]],
    owner_since: [ null, [ Validators.required, dateSmallEqualTodayValidator() ] ]
  });

  isFromModal = false;
  isButtonDisabled = false;
  isSubmittingApplicant = false;
  modalRef: BsModalRef;
  readonly phoneMaskConfig = PHONE_MASK_CONFIG;
  sinForm: FormGroup;
  readonly sinMaskConfig = SIN_MASK_CONFIG;

  @ViewChild('sinInputModal', { static: true }) sinInputModal: TemplateRef<any>; // eslint-disable-line
  @ViewChild(AddressFormComponent, { static: true }) addressFormComponent: AddressFormComponent;

  get addressFormGroup(): FormGroup {
    return this.addressFormComponent.addressFormGroup;
  }

  constructor(
    private certificationService: BusinessCertificationService,
    private errorService: ErrorService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private merchantService: MerchantService,
    private modalService: BsModalService,
    private stateRouter: StateRoutingService,
    private translateService: TranslateService
  ) {}

  ngAfterViewInit(): void {
    this.populateApplicantForm(this.activatedRoute.snapshot.data.applicantInfo);
  }

  next(e: MouseEvent): void {
    if (this.isDelegatedAccessMode()) {
      this.errorService.show(UiError.delegatedMode);
      this.isButtonDisabled = true;
    } else {
      if (this.applicantFormGroup.valid && this.addressFormGroup.valid) {
        this.isSubmittingApplicant = true;
        this.isFromModal = false;

        this.submitApplicant('');
      } else {
        this.applicantFormGroup.markAllAsTouched();
        this.addressFormComponent.markAsTouched();

        const firstEl = document.querySelector('.form-control.ng-invalid');
        /* istanbul ignore next */
        firstEl?.scrollIntoView(true);

        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  isDelegatedAccessMode(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  populateApplicantForm(applicantInfo: PartialApplicantLead): void {
    if (!applicantInfo) return;

    setTimeout(() => {
      Object.keys(applicantInfo).map((attr: string) => {
        // This will be fine until both forms have overlapping attributes.
        const targetControl = this.applicantFormGroup.get(attr) || this.addressFormGroup.get(attr);

        // Update and validate the existing keys of the form only if the lead has a value for it
        if (applicantInfo[attr] && targetControl) {
          targetControl.setValue(applicantInfo[attr]);
          targetControl.markAsTouched();
        }
      });
    });
  }

  submitApplicant(sin: string): void {
    const applicantPost = this.buildApplicantPost(
      this.applicantFormGroup.value,
      this.addressFormGroup.value,
      sin);

    this.certificationService.submitApplicant(applicantPost)
      .then((res: ZttResponse<SubmitApplicantResponse>) => {
        // remove saved form data after we've successfully created the applicant
        this.certificationService.reauth({ applicant_guid: res.data.id });
      })
      .catch((err: ErrorResponse) => {
        this.isSubmittingApplicant = false;
        if (err.statusCode === 404) {
          if (err.errorCode === 60100) { // prompt SIN flow
            this.sinForm = new FormGroup({
              'sin': new FormControl('', sinValidator())
            });
            this.modalRef = this.modalService.show(this.sinInputModal);
          } else { // cannot certify
            if (this.modalRef) this.modalRef.hide(); // if failed after SIN flow

            this.stateRouter.navigate(AppRoutes.onboarding.unable_to_be_certified, true);
          }
        } else { // for all other errors, display generic error modal
          this.displayErrorModal(err);
        }
      });
  }

  displayErrorModal(e: ErrorResponse): void {
    const code = e.errorCode;

    switch (code) {
      case ERRORS.API.ADDRESS_ERROR: {
        const addressData: Address = this.addressFormGroup.value;
        const address: string = addressData.address_line_1 + ', ' + addressData.city + ', ' + addressData.state_province + ', ' + addressData.postal_code;
        const context: ErrorModalContext = new ErrorModalContext(
          'ERROR_MODAL.GENERIC.HEADING',
          [
            this.translateService.instant('ABOUT_YOU.ERROR'),
            this.translateService.instant('ABOUT_YOU.ADDRESS_INVALID_ERROR', { address: address }),
            this.translateService.instant('ERROR_MODAL.GENERIC.BODY_MESSAGE2')
          ]
        );
        this.errorService.show(UiError.general, context);
        break;
      }
      case ERRORS.API.PHONE_NUMBER_ERROR: {
        const phoneNumber: string = this.applicantFormGroup.value.phone_number;
        const context: ErrorModalContext = new ErrorModalContext(
          'ERROR_MODAL.GENERIC.HEADING',
          [
            this.translateService.instant('ABOUT_YOU.ERROR'),
            this.translateService.instant('ABOUT_YOU.PHONE_NUMBER_INVALID_ERROR', { phone_number: phoneNumber }),
            this.translateService.instant('ERROR_MODAL.GENERIC.BODY_MESSAGE2')
          ]
        );
        this.errorService.show(UiError.general, context);
        break;
      }
      default: {
        this.errorService.show(UiError.general);
        /* istanbul ignore next */
        Bugsnag.notify(e, event => { event.severity = BugsnagSeverity.info });
      }
    }
  }

  onSubmitSin(e: MouseEvent): void {
    if (this.sinForm.controls['sin'].valid) {
      const submittedSin = (this.sinForm.controls[ 'sin' ].value as string).replace(/[ _]/g, '');

      if (submittedSin === '') {
        this.modalRef.hide();
        this.stateRouter.navigate(AppRoutes.onboarding.unable_to_be_certified, true);
      } else {
        this.isSubmittingApplicant = true;
        this.submitApplicant(this.sinForm.controls[ 'sin' ].value);
      }
    } else {
      this.sinForm.markAsTouched();
      this.sinForm.controls['sin'].markAsTouched();

      e.stopPropagation();
      e.preventDefault();
    }
  }

  buildApplicantPost(applicant: Applicant, address: Address, sin: string): ApplicantPost | null {
    if (!applicant || !address) return null;

    return {
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      phone_number: applicant.phone_number,
      date_of_birth: applicant.date_of_birth?.toString(),
      owner_since: applicant.owner_since?.toString(),
      sin: sin.replace(/[^\d]/g, ''),
      address_line_1: address.address_line_1,
      country: Country.Canada,
      province: address.state_province,
      city: address.city,
      postal_code: address.postal_code
    };
  }
}
