import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Address } from 'app/models/address';
import { ConfigurationService } from 'app/services/configuration.service';
import { POSTAL_CODE_MASK_CONFIG, POSTAL_CODE_REGEX } from 'app/constants/formatting.constants';

/// <reference types="@types/googlemaps" />
declare const google: any; // eslint-disable-line

const CITY_COMPONENT_TYPE = 'locality';
const POSTAL_CODE_COMPONENT_TYPE = 'postal_code';
const PROVINCE_COMPONENT_TYPE = 'administrative_area_level_1';
const STREET_COMPONENT_TYPE = 'route';
const STREET_NUMBER_COMPONENT_TYPE = 'street_number';
const UNIT_COMPONENT_TYPE = 'subpremise';

@Component({
  selector: 'ztt-address-form',
  templateUrl: './address-form.component.html'
})
export class AddressFormComponent implements OnInit {
  private _defaultAddress: Address;
  private readonly postalCodeRegexp = POSTAL_CODE_REGEX;

  addressFormGroup: FormGroup;
  readonly postalCodeMaskConfig = POSTAL_CODE_MASK_CONFIG;
  autocomplete: any; // eslint-disable-line

  constructor(private changeDetector: ChangeDetectorRef,
              private configService: ConfigurationService) {}

  // LIFE CYCLE

  ngOnInit(): void {
    this.initializeForm();

    if (this.configService.addressAutocompleteEnabled && window['google']) {
      this.initAutocomplete();
    }

  }

  // GETTERS & SETTERS

  get address(): Address {
    const controls = this.addressFormGroup.controls;
    return {
      address_line_1: controls['address_line_1'].value,
      city:           controls['city'].value,
      state_province: controls['state_province'].value,
      postal_code:    controls['postal_code'].value,
    };
  }

  @Input()
  set defaultAddress(value: Address) {
    this._defaultAddress = value;
  }

  /**
   * Returns a null-check constructed <Address> from the unsafe _defaultAddress input.
   */
  get defaultAddress(): Address {
    // TODO [Val] Move null-check to setter
    return {
      address_line_1: this.defaultAddressLine,
      city:           this._defaultAddress && this._defaultAddress.city || '',
      state_province: this._defaultAddress && this._defaultAddress.state_province || '',
      postal_code:    this._defaultAddress && this._defaultAddress.postal_code || ''
    };
  }

  private get defaultAddressLine(): string {
    const addressLine1: string = this._defaultAddress && this._defaultAddress.address_line_1 || '';
    const addressLine2: string = this._defaultAddress && this._defaultAddress.address_line_2 || '';
    const formattedAddressLine2 = addressLine1 && addressLine2 ? ` ${addressLine2}` : '';
    return addressLine1 + formattedAddressLine2;
  }

  // HELPERS

  markAsTouched(): void {
    this.addressFormGroup.markAllAsTouched();
  }

  initializeForm(): void {
    this.addressFormGroup = new FormGroup({
      'address_line_1': new FormControl(this.defaultAddress.address_line_1, [
        Validators.required
      ]),
      'city': new FormControl(this.defaultAddress.city, [
        Validators.required
      ]),
      'state_province': new FormControl(this.defaultAddress.state_province, [
        Validators.required
      ]),
      'postal_code': new FormControl(this.defaultAddress.postal_code, [
        Validators.required,
        Validators.pattern(this.postalCodeRegexp)
      ])
    });

    if (!!this._defaultAddress) {
      // Only markAsTouched is prepopulated the form with a non-null defaultAddress.
      this.addressFormGroup.markAllAsTouched();
    }
  }

  autocompleteAddress(): void {
    const place = this.autocomplete.getPlace();
    if (!place || !place.address_components || place.address_components.length <= 0) {
      return;
    }

    let containsUnit = false;
    for (const component of place.address_components) {
      if (component.types.includes(CITY_COMPONENT_TYPE)) {
        this.addressFormGroup.controls['city'].setValue(component.long_name);
      } else if (component.types.includes(PROVINCE_COMPONENT_TYPE)) {
        this.addressFormGroup.controls['state_province'].setValue(component.short_name.toUpperCase());
      } else if (component.types.includes(POSTAL_CODE_COMPONENT_TYPE)) {
        this.addressFormGroup.controls['postal_code'].setValue(component.long_name.replace(' ', ''));
      } else if (component.types.includes(UNIT_COMPONENT_TYPE)) {
        this.addressFormGroup.controls['address_line_1'].setValue(component.long_name);
        containsUnit = true;
      } else if (component.types.includes(STREET_NUMBER_COMPONENT_TYPE)) {
        if (containsUnit) {
          this.addressFormGroup.controls['address_line_1'].setValue(this.addressFormGroup.controls['address_line_1'].value + '-' + component.long_name);
        } else {
          this.addressFormGroup.controls['address_line_1'].setValue(component.long_name);
        }
      } else if (component.types.includes(STREET_COMPONENT_TYPE)) {
        this.addressFormGroup.controls['address_line_1'].setValue(this.addressFormGroup.controls['address_line_1'].value + ' ' +
          component.short_name);
      }
      this.changeDetector.detectChanges();
    }
  }

  private initAutocomplete(): void {
    this.autocomplete = new google.maps.places.Autocomplete(document.getElementById('address-line-1'),
      {
        type: ['address'],
        fields: ['address_components', 'adr_address', 'place_id', 'formatted_address', 'geometry', 'vicinity']
      });

    this.autocomplete.setComponentRestrictions({'country': ['ca']});

    this.autocomplete.addListener('place_changed', /* istanbul ignore next */() => {
      this.autocompleteAddress();
    });
  }
}
