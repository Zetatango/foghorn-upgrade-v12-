import { Component, OnInit, OnDestroy, ViewChild, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { jurisdictionBusinessNumberValidator } from 'app/directives/jurisdiction-business-number-validator.directive';
import { Address } from 'app/models/address';
import { MerchantPut, Merchant, EditBusinessFormData, EditAddressFormData } from 'app/models/api-entities/merchant';
import { Country } from 'app/models/api-entities/utility';
import { Province } from 'app/models/province';
import { Jurisdiction } from 'app/models/jurisdiction';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

enum UpdatingMerchantState {
  pending = 'pending',
  in_progress = 'in_progress',
  succeed = 'succeed',
}

@Component({
  selector: 'ztt-edit-merchant',
  templateUrl: './edit-merchant.component.html',
})
export class EditMerchantComponent implements OnInit, OnDestroy {
  constructor(
    private errorService: ErrorService,
    private formBuilder: FormBuilder,
    private merchantService: MerchantService,
    public translateService: TranslateService) {}

  @Output() doneEvent = new EventEmitter<void>();

  @ViewChild(AddressFormComponent, { static: true })
  private _addressFormComponent: AddressFormComponent;
  private _editMerchantFormGroup: FormGroup;
  private _address: Address;
  private _merchant: Merchant;

  private _isUpdatingMerchant: UpdatingMerchantState = UpdatingMerchantState.pending;
  private _isTransitioning = false;
  private _isGoingBack = false;

  unsubscribe$ = new Subject<void>();

  // Types references for template usage
  UpdatingMerchantState = UpdatingMerchantState;

  // GETTERS

  get jurisdictions(): Jurisdiction[] {
    return Object.values(Jurisdiction);
  }

  get editMerchantFormGroup(): FormGroup {
    return this._editMerchantFormGroup;
  }

  get addressFormGroup(): FormGroup {
    return this._addressFormComponent.addressFormGroup;
  }

  get isUpdatingMerchant(): UpdatingMerchantState {
    return this._isUpdatingMerchant;
  }

  get isTransitioning(): boolean {
    return this._isTransitioning;
  }

  get isGoingBack(): boolean {
    return this._isGoingBack;
  }

  get address(): Address {
    return this._address;
  }

  get merchantIncorporatedIn(): string { // : Jurisdiction { // TODO [Val] -type- Fix type annotation
    return this._merchant && this._merchant.incorporated_in ? this._merchant.incorporated_in : '';
  }

  get isDbaSameAsName(): boolean {
    const name: string = this.editMerchantFormGroup.controls['name'].value;
    const dba: string = this.editMerchantFormGroup.controls['doing_business_as'].value;
    const bothAttrAreSet: boolean = !!name && !!dba;
    return bothAttrAreSet && (name === dba);
  }

  // LIFE CYCLE

  ngOnInit(): void {
    this.setMerchantSubscription();
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // FORM

  private initializeForm(): void {
    this._editMerchantFormGroup = this.formBuilder.group({
      name: [this._merchant?.name || '', [Validators.required]],
      doing_business_as: [this._merchant?.doing_business_as || '', [Validators.required]],
      business_num: [this._merchant?.business_num || '', [Validators.pattern(new RegExp('^[a-zA-Z0-9-]*$'))]],
      incorporated_in: [this._merchant?.incorporated_in || '', []]
    },
    { validators: jurisdictionBusinessNumberValidator });
  }

  // FORM INTERACTION HELPERS

  onDoingBusinessCheckboxClicked($event): void { // eslint-disable-line
    const name: string = this.editMerchantFormGroup.controls['name'].value;
    if ($event.target.checked && name) {
      this.editMerchantFormGroup.controls['doing_business_as'].setValue(name);
      this.editMerchantFormGroup.controls['doing_business_as'].disable();
    } else {
      this.editMerchantFormGroup.controls['doing_business_as'].setValue('');
      this.editMerchantFormGroup.controls['doing_business_as'].enable();
    }
  }

  // FORM VALIDATION HELPERS

  private isBusinessControlInvalid(controlName: string): boolean {
    return this.editMerchantFormGroup &&
           this.editMerchantFormGroup.get(controlName) &&
           this.editMerchantFormGroup.get(controlName).touched &&
           this.editMerchantFormGroup.get(controlName).invalid;
  }

  private isControlValueSet(controlName: string): boolean {
    return this.editMerchantFormGroup &&
           this.editMerchantFormGroup.get(controlName) &&
           !!this.editMerchantFormGroup.get(controlName).value;
  }

  get isBusinessNameInvalid(): boolean {
    return this.isBusinessControlInvalid('name');
  }

  get isDoingBusinessAsInvalid(): boolean {
    return this.isBusinessControlInvalid('doing_business_as');
  }

  get isJurisdictionInvalid(): boolean {
    return this.isBusinessControlInvalid('incorporated_in') ||
           (this.isControlValueSet('business_num') && !this.isControlValueSet('incorporated_in')) ||
           this.editMerchantFormGroup.hasError('jurisdictionIncomplete');
  }

  businessNumberHasInvalidCharacter(): ValidationErrors | false {
    const bnErrors = this.editMerchantFormGroup.get('business_num').errors;
    return bnErrors ? bnErrors.pattern : false;
  }

  businessNumberHasInvalidAlphanumericCharacter(): boolean {
    return this.editMerchantFormGroup.hasError('alphanumeric');
  }

  businessNumberHasInvalidNumericCharacter(): boolean {
    return this.editMerchantFormGroup.hasError('numeric');
  }

  businessNumberHasInvalidFederalCharacter(): boolean {
    return this.editMerchantFormGroup.hasError('federal');
  }

  businessNumberHasInvalidAlphaStartCharacter(): boolean {
    return this.editMerchantFormGroup.hasError('alphastart');
  }

  businessNumberHasInvalidLength(): boolean {
    return this.editMerchantFormGroup.hasError('length');
  }

  businessNumberHasJurisdictionError(): boolean {
    return this.businessNumberHasInvalidAlphanumericCharacter() ||
           this.businessNumberHasInvalidNumericCharacter() ||
           this.businessNumberHasInvalidFederalCharacter() ||
           this.businessNumberHasInvalidAlphaStartCharacter() ||
           this.businessNumberHasInvalidLength();
  }

  get isBusinessNumberInvalid(): boolean {
    return this.isBusinessControlInvalid('business_num') || this.businessNumberHasJurisdictionError();
  }

  // SERVICE CALLS

  private setMerchantSubscription(): void {
    this.merchantService.merchantObs
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (merchant: Merchant) => {
          this._merchant = merchant;
          this._address = {
            address_line_1: merchant?.address_line_1 || '',
            address_line_2: merchant?.address_line_2 || '',
            city: merchant?.city || '',
            state_province: merchant?.state_province || '',
            postal_code: merchant?.postal_code || ''
          };
        });
  }

  updateMerchant(): void {
    const businessData: EditBusinessFormData = this.editMerchantFormGroup.getRawValue();
    const addressData: EditAddressFormData = this._addressFormComponent.address;
    const merchantPutBody: MerchantPut = this.buildMerchantPutBody(businessData, addressData);

    this._isUpdatingMerchant = UpdatingMerchantState.in_progress;
    this._isTransitioning = true;
    this.merchantService.updateMerchant(merchantPutBody, true)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.handleSuccessUpdateMerchant(),
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this._isUpdatingMerchant = UpdatingMerchantState.pending;
          this._isTransitioning = false;
          this.errorService.show(UiError.putMerchant);
        }
      });
  }

  private handleSuccessUpdateMerchant(): void {
    this._isUpdatingMerchant = UpdatingMerchantState.succeed;
    this.done();
  }

  private buildMerchantPutBody(businessData: EditBusinessFormData, addressData: EditAddressFormData): MerchantPut {

    const merchantPutBody: MerchantPut = {
      id: this._merchant.id,

      name: businessData.name,
      doing_business_as: businessData.doing_business_as,
      business_num: businessData.business_num,
      incorporated_in: businessData.incorporated_in as Province, // as Jurisdiction // TODO [Val] -type- Can I avoid casting type ?

      address_line_1: addressData.address_line_1,
      // address_line_2: undefined // If there is an address_line_2, the AddressFormComponent appends it with address_line_1
      city: addressData.city,
      country: Country.Canada, // Hard coded
      postal_code: addressData.postal_code,
      state_province: addressData.state_province as Province, // TODO [Val] -type- Can I avoid casting type ?
    };

    return merchantPutBody;
  }

  // NAVIGATION

  goBack(): void {
    this._isTransitioning = true;
    this._isGoingBack = true;
    this.done();
  }

  private done(): void {
    this.doneEvent.emit();
  }

}
