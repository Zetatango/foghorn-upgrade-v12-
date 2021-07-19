import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { dateSmallEqualTodayValidator } from 'app/components/utilities/date-picker/date-small-equal-today.validator';
import * as storage from 'app/helpers/storage.helper';
import { Country } from 'app/models/api-entities/utility';
import { MerchantService } from 'app/services/merchant.service';
import { GuarantorForm, GuarantorPost } from 'app/models/api-entities/guarantor';
import { GuarantorService } from 'app/services/guarantor.service';
import { DateFormatter } from 'ngx-bootstrap/datepicker';
import { map, take } from 'rxjs/operators';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { phoneValidator } from 'app/validators/phone.validator';
import { PHONE_REGEX, PHONE_MASK_CONFIG, DD_MM_YYYY_FORMAT, dd_MM_yyyy_FORMAT } from 'app/constants/formatting.constants';
import { AppRoutes } from 'app/models/routes';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";
import { parse } from 'date-fns';


@Component({
  selector: 'ztt-add-guarantor',
  templateUrl: './add-guarantor.component.html'
})
export class AddGuarantorComponent implements AfterViewInit {
  submittingGuarantor = false;
  private readonly format = DD_MM_YYYY_FORMAT;

  @ViewChild(AddressFormComponent, {static: true}) addressFormComponent: AddressFormComponent;

  readonly phoneMaskConfig = PHONE_MASK_CONFIG;

  guarantorFormGroup: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    date_of_birth: ['', [Validators.required, dateSmallEqualTodayValidator()]],
    phone_number: ['', [
      Validators.required,
      Validators.pattern(PHONE_REGEX),
      phoneValidator()
    ]],
    email: ['', [Validators.required, Validators.email]],
    relationship: ['', [Validators.required]]
  });

  private readonly storageKey: string = this.merchantService.getMerchant().id;

  constructor(private errorService: ErrorService,
              private guarantorService: GuarantorService,
              private lendingApplicationsService: LendingApplicationsService,
              private merchantService: MerchantService,
              private stateRouter: StateRoutingService,
              private fb: FormBuilder) {

  }

  ngAfterViewInit(): void {
    setTimeout(() => this.populateForm());
  }

  private populateForm(): void {
    const encodedFormValues = storage.local.getItem(this.storageKey);
    try {
      const storedValues = JSON.parse(atob(encodedFormValues));
      const birth_date = parse(storedValues.date_of_birth, dd_MM_yyyy_FORMAT, new Date());

      this.guarantorFormGroup.controls['first_name'].setValue(storedValues.first_name);
      this.guarantorFormGroup.controls['last_name'].setValue(storedValues.last_name);
      this.guarantorFormGroup.controls['date_of_birth'].setValue(birth_date);
      this.guarantorFormGroup.controls['phone_number'].setValue(storedValues.phone_number);
      this.guarantorFormGroup.controls['email'].setValue(storedValues.email);
      this.guarantorFormGroup.controls['relationship'].setValue(storedValues.relationship);
      this.addressFormComponent.addressFormGroup.controls['address_line_1'].setValue(storedValues.address_line_1);
      this.addressFormComponent.addressFormGroup.controls['city'].setValue(storedValues.city);
      this.addressFormComponent.addressFormGroup.controls['state_province'].setValue(storedValues.state_province);
      this.addressFormComponent.addressFormGroup.controls['postal_code'].setValue(storedValues.postal_code);
    } catch (err) { // Note: what do?
    }
  }

  next(): void {
    if (this.guarantorFormGroup.valid && this.addressFormComponent.addressFormGroup.valid) {
      this.submittingGuarantor = true;

      this.submitGuarantor();
    } else {
      this.guarantorFormGroup.markAllAsTouched();
      this.addressFormComponent.markAsTouched();

      const firstEl = document.querySelector('.form-control.ng-invalid');
      /* istanbul ignore next */
      firstEl?.scrollIntoView(true);
    }
  }

  private submitGuarantor(): void {
    const guarantor: GuarantorForm = this.getGuarantorFormParams();

    this.saveGuarantorForm(guarantor);

    this.addApplicationGuarantor(guarantor);
  }

  private saveGuarantorForm(guarantor: GuarantorForm): void {
    storage.local.setItem(this.storageKey, btoa(JSON.stringify(guarantor)));
  }

  private async addApplicationGuarantor(guarantor: GuarantorForm): Promise<void> {
    const guarantorPostData: GuarantorPost = await this.getGuarantorPostData(guarantor);

    this.guarantorService.addGuarantor(guarantorPostData)
      .pipe(take(1))
      .subscribe(
        async () => {
          storage.local.removeItem(this.storageKey);
          // refresh application state
          await this.lendingApplicationsService.loadApplication(guarantorPostData.application_id).toPromise();
          this.stateRouter.navigate(AppRoutes.application.approval_prerequisites, true);
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.postApplicationGuarantor);
          this.submittingGuarantor = false;
        });
  }

  private getGuarantorFormParams(): GuarantorForm {
    const dateFormatter = new DateFormatter();
    const dob = dateFormatter.format(new Date(this.guarantorFormGroup.get('date_of_birth').value), this.format, 'en');
    return {
      first_name: this.guarantorFormGroup.get('first_name').value,
      last_name: this.guarantorFormGroup.get('last_name').value,
      date_of_birth: dob,
      phone_number: this.guarantorFormGroup.get('phone_number').value,
      email: this.guarantorFormGroup.get('email').value,
      relationship: this.guarantorFormGroup.get('relationship').value,
      address_line_1: this.addressFormComponent.address.address_line_1,
      city: this.addressFormComponent.address.city,
      state_province: this.addressFormComponent.address.state_province,
      postal_code: this.addressFormComponent.address.postal_code
    };
  }

  private async getGuarantorPostData(guarantor: GuarantorForm): Promise<GuarantorPost> {
    const applicationId: string = await this.lendingApplicationsService.lendingApplication$.pipe(
      take(1),
      map(app => app.id)
    ).toPromise();

    const guarantorPostData: GuarantorPost = {
      application_id: applicationId,
      ...guarantor,
      date_of_birth: this.guarantorFormGroup.get('date_of_birth').value.toString(),
      country: Country.Canada
    };

    return guarantorPostData;
  }
}
