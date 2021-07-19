import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IMaskModule } from 'angular-imask';
import { Address } from 'app/models/address';
import { ConfigurationService } from 'app/services/configuration.service';
import { UtilityService } from 'app/services/utility.service';
import { address, addressFactory, addressWithLine2 } from 'app/test-stubs/factories/address';

import { CookieService } from 'ngx-cookie-service';
import { AddressFormComponent } from './address-form.component';

describe('AddressFormComponent', () => {
  let component: AddressFormComponent;
  let configService: ConfigurationService;
  let fixture: ComponentFixture<AddressFormComponent>;
  let configSpy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IMaskModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        ConfigurationService,
        CookieService,
        UtilityService
      ],
      declarations: [AddressFormComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddressFormComponent);
    component = fixture.componentInstance;
    configService = TestBed.inject(ConfigurationService);

    configSpy = spyOnProperty(configService, 'addressAutocompleteEnabled');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // GETTERS & SETTERS

  describe('address getter', () => {
    it('should return the current address', () => {
      component.ngOnInit();

      // Set address in the form
      component.addressFormGroup.controls['address_line_1'].setValue(address().address_line_1);
      component.addressFormGroup.controls['city'].setValue(address().city);
      component.addressFormGroup.controls['state_province'].setValue(address().state_province);
      component.addressFormGroup.controls['postal_code'].setValue(address().postal_code);

      // Test the getter
      expect(component.address).toEqual(address());
    });
  }); // describe - address getter

  describe('defaultAddress getter', () => {
    it('does not set form controls when value is invalid', () => {
      [null, undefined].forEach(invalidValue => {
        component.defaultAddress = invalidValue;

        const sanitizedDefaultAddress: Address = { address_line_1: '', city: '', state_province: '', postal_code: '' };
        expect(component.defaultAddress).toEqual(sanitizedDefaultAddress);
      });
    });

    it('does set the form controls when non null', () => {
      component.defaultAddress = address();

      expect(component.defaultAddress).toEqual(address());
    });

    it('combines address_line_1 with address_line_2 if set', () => {
      component.defaultAddress = addressWithLine2();
      const expectedAddressLine = `${addressWithLine2().address_line_1} ${addressWithLine2().address_line_2}`;

      expect(component.defaultAddress.address_line_1).toEqual(expectedAddressLine);
    });
  }); // describe - defaultAddress()

  // HELPERS

  describe('markAsTouched', () => {
    it('touches each form control', () => {
      component.ngOnInit();

      for (const i in component.addressFormGroup.controls) {
        spyOn(component.addressFormGroup.controls[i], 'markAsTouched');
      }

      component.markAsTouched();

      for (const i in component.addressFormGroup.controls) {
        expect(component.addressFormGroup.controls[i].markAsTouched).toHaveBeenCalledTimes(1);
      }
    });
  }); // describe - markAsTouched()

  // FORM: ADDRESS PREPOPULATION

  describe('ADDRESS PREPOPULATION', () => {
    describe('When a default address are provided and valid', () => {
      it('should prepopulate the form fields with defautAddress', () => {
        component.defaultAddress = addressFactory.build();
        fixture.detectChanges();

        expect(component.address).toEqual(addressFactory.build());
      });

      it('should prepopulate the form fields with defautAddress with an address_line_2', () => {
        component.defaultAddress = addressFactory.build({ address_line_2: 'Unit 400' });

        fixture.detectChanges();

        const expectedAddressLine = `${addressWithLine2().address_line_1} ${addressWithLine2().address_line_2}`;
        const expectedFormAddress: Address = addressFactory.build({ address_line_1: expectedAddressLine });

        expect(component.address).toEqual(expectedFormAddress);
      });

      it('should leave the form as valid', () => {
        component.defaultAddress = addressFactory.build();
        fixture.detectChanges();

        expect(component.addressFormGroup.valid).toBeTrue();
      });
    }); // describe - 'When a default address are provided and valid'

    describe('When a default address are provided and invalid', () => {
      it('should prepopulate the form fields with defautAddress', () => {
        const invalidDefaultAddress: Address = addressFactory.build({ address_line_1: '' }); // Missing value for address_line_1 required attr
        component.defaultAddress = invalidDefaultAddress;
        fixture.detectChanges();

        expect(component.address).toEqual(invalidDefaultAddress);
      });

      it('should leave the form as invalid', () => {
        const invalidDefaultAddress: Address = addressFactory.build({ address_line_1: '' }); // Missing value for address_line_1 required attr
        component.defaultAddress = invalidDefaultAddress;
        fixture.detectChanges();

        expect(component.addressFormGroup.invalid).toBeTrue();
      });
    }); // describe - 'When a default address are provided and invalid'

    describe('When a default address are no provided', () => {
      const emptyFormAddress: Address = { address_line_1: '', city: '', state_province: '', postal_code: '' };

      it('(undefined) should not prepopulate the form fields with defautAddress', () => {
        component.defaultAddress = undefined;
        fixture.detectChanges();

        expect(component.address).toEqual(emptyFormAddress);
      });

      it('(undefined) should leave the form as invalid', () => {
        component.defaultAddress = undefined;
        fixture.detectChanges();

        expect(component.addressFormGroup.invalid).toBeTrue();
      });

      it('(null) should not prepopulate the form fields with defautAddress', () => {
        component.defaultAddress = null;
        fixture.detectChanges();

        expect(component.address).toEqual(emptyFormAddress);
      });

      it('(null) should leave the form as invalid', () => {
        component.defaultAddress = null;
        fixture.detectChanges();

        expect(component.addressFormGroup.invalid).toBeTrue();
      });
    }); // describe - 'When a default address are no provided'
  }); // describe - ADDRESS PREPOPULATION

  // MAPS API: ADDRESS AUTOCOMPLETE

  describe('addressAutocompleteEnabled flag', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return {
                    address_components: [
                      { long_name: '400', short_name: '400', types: ['subpremise'] },
                      { long_name: '35', short_name: '35', types: ['street_number'] },
                      { long_name: 'Fitzgerald Road', short_name: 'Fitzgerald Rd', types: ['route'] },
                      { long_name: 'Ottawa', short_name: 'Ottawa', types: ['locality'] },
                      { long_name: 'Ontario', short_name: 'ON', types: ['administrative_area_level_1'] },
                      { long_name: 'K2H 5Z2', short_name: 'K2H 5Z2', types: ['postal_code'] },
                      { long_name: 'Canada', short_name: 'CA', types: ['country'] }
                    ]
                  };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
    });

    it('when false, should not set autocomplete', () => {
      configSpy.and.returnValue(false);

      fixture.detectChanges();

      expect(component.autocomplete).toBeFalsy();
    });

    it('when true, should set autocomplete', () => {
      configSpy.and.returnValue(true);

      fixture.detectChanges();

      expect(component.autocomplete).toBeTruthy();
    });

    it('when true, but google variable undefined, should not set autocomplete', () => {
      configSpy.and.returnValue(true);
      window['google'] = undefined;

      fixture.detectChanges();

      expect(component.autocomplete).toBeFalsy();
    });

    it('when true, but google variable is null, should not set autocomplete', () => {
      configSpy.and.returnValue(true);
      window['google'] = null;

      fixture.detectChanges();

      expect(component.autocomplete).toBeFalsy();
    });

    it('when true, but google variable is empty, should not set autocomplete', () => {
      configSpy.and.returnValue(true);
      window['google'] = '';

      fixture.detectChanges();

      expect(component.autocomplete).toBeFalsy();
    });
  });

  describe('AUTOCOMPLETE with all fields present', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return {
                    address_components: [
                      { long_name: '400', short_name: '400', types: ['subpremise'] },
                      { long_name: '35', short_name: '35', types: ['street_number'] },
                      { long_name: 'Fitzgerald Road', short_name: 'Fitzgerald Rd', types: ['route'] },
                      { long_name: 'Ottawa', short_name: 'Ottawa', types: ['locality'] },
                      { long_name: 'Ontario', short_name: 'ON', types: ['administrative_area_level_1'] },
                      { long_name: 'K2H 5Z2', short_name: 'K2H 5Z2', types: ['postal_code'] },
                      { long_name: 'Canada', short_name: 'CA', types: ['country'] }
                    ]
                  };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);

      fixture.detectChanges();
    });

    it('should fill address form fields with autocomplete results', () => {
      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual('400-35 Fitzgerald Rd');
      expect(component.addressFormGroup.controls['city'].value).toEqual('Ottawa');
      expect(component.addressFormGroup.controls['state_province'].value).toEqual('ON');
      expect(component.addressFormGroup.controls['postal_code'].value).toEqual('K2H 5Z2');
    });
  });

  describe('AUTOCOMPLETE no subpremise', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return {
                    address_components: [
                      { long_name: '35', short_name: '35', types: ['street_number'] },
                      { long_name: 'Fitzgerald Road', short_name: 'Fitzgerald Rd', types: ['route'] },
                      { long_name: 'Ottawa', short_name: 'Ottawa', types: ['locality'] },
                      { long_name: 'Ontario', short_name: 'ON', types: ['administrative_area_level_1'] },
                      { long_name: 'K2H 5Z2', short_name: 'K2H 5Z2', types: ['postal_code'] },
                      { long_name: 'Canada', short_name: 'CA', types: ['country'] }
                    ]
                  };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);

      fixture.detectChanges();
    });

    it('should fill address form fields with autocomplete results', () => {
      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual('35 Fitzgerald Rd');
      expect(component.addressFormGroup.controls['city'].value).toEqual('Ottawa');
      expect(component.addressFormGroup.controls['state_province'].value).toEqual('ON');
      expect(component.addressFormGroup.controls['postal_code'].value).toEqual('K2H 5Z2');
    });
  });

  describe('AUTOCOMPLETE no city', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return {
                    address_components: [
                      { long_name: '35', short_name: '35', types: ['street_number'] },
                      { long_name: 'Fitzgerald Road', short_name: 'Fitzgerald Rd', types: ['route'] },
                      { long_name: 'Ontario', short_name: 'ON', types: ['administrative_area_level_1'] },
                      { long_name: 'K2H 5Z2', short_name: 'K2H 5Z2', types: ['postal_code'] },
                      { long_name: 'Canada', short_name: 'CA', types: ['country'] }
                    ]
                  };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);

      fixture.detectChanges();
    });

    it('should fill address form fields with autocomplete results', () => {
      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual('35 Fitzgerald Rd');
      expect(component.addressFormGroup.controls['city'].value).toEqual('');
      expect(component.addressFormGroup.controls['state_province'].value).toEqual('ON');
      expect(component.addressFormGroup.controls['postal_code'].value).toEqual('K2H 5Z2');
    });
  });

  describe('AUTOCOMPLETE no province', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return {
                    address_components: [
                      { long_name: '35', short_name: '35', types: ['street_number'] },
                      { long_name: 'Fitzgerald Road', short_name: 'Fitzgerald Rd', types: ['route'] },
                      { long_name: 'Ottawa', short_name: 'Ottawa', types: ['locality'] },
                      { long_name: 'K2H 5Z2', short_name: 'K2H 5Z2', types: ['postal_code'] },
                      { long_name: 'Canada', short_name: 'CA', types: ['country'] }
                    ]
                  };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);

      fixture.detectChanges();
    });

    it('should fill address form fields with autocomplete results', () => {
      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual('35 Fitzgerald Rd');
      expect(component.addressFormGroup.controls['city'].value).toEqual('Ottawa');
      expect(component.addressFormGroup.controls['state_province'].value).toEqual('');
      expect(component.addressFormGroup.controls['postal_code'].value).toEqual('K2H 5Z2');
    });
  });

  describe('AUTOCOMPLETE no postal code', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return {
                    address_components: [
                      { long_name: '35', short_name: '35', types: ['street_number'] },
                      { long_name: 'Fitzgerald Road', short_name: 'Fitzgerald Rd', types: ['route'] },
                      { long_name: 'Ottawa', short_name: 'Ottawa', types: ['locality'] },
                      { long_name: 'Ontario', short_name: 'ON', types: ['administrative_area_level_1'] },
                      { long_name: 'Canada', short_name: 'CA', types: ['country'] }
                    ]
                  };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);

      fixture.detectChanges();
    });

    it('should fill address form fields with autocomplete results', () => {
      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual('35 Fitzgerald Rd');
      expect(component.addressFormGroup.controls['city'].value).toEqual('Ottawa');
      expect(component.addressFormGroup.controls['state_province'].value).toEqual('ON');
      expect(component.addressFormGroup.controls['postal_code'].value).toEqual('');
    });
  });

  describe('AUTOCOMPLETE no results', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: () => undefined,
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);
      fixture.detectChanges();
    });

    it('does not change values when getPlace returns void', () => {
      component.addressFormGroup.reset();
      const address_line_1 = 'some address';
      component.addressFormGroup.controls['address_line_1'].setValue(address_line_1);

      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual(address_line_1);
      expect(component.addressFormGroup.controls['city'].value).toBeNull();
      expect(component.addressFormGroup.controls['state_province'].value).toBeNull();
      expect(component.addressFormGroup.controls['postal_code'].value).toBeNull();
    });
  });

  describe('AUTOCOMPLETE empty results', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return { address_components: [] };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);
      fixture.detectChanges();
    });

    it('does not change values when getPlace returns an empty address_components array', () => {
      component.addressFormGroup.reset();
      const address_line_1 = 'some address';
      component.addressFormGroup.controls['address_line_1'].setValue(address_line_1);

      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual(address_line_1);
      expect(component.addressFormGroup.controls['city'].value).toBeNull();
      expect(component.addressFormGroup.controls['state_province'].value).toBeNull();
      expect(component.addressFormGroup.controls['postal_code'].value).toBeNull();
    });
  });

  describe('getPlace returns undefined', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: () => undefined,
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);
      fixture.detectChanges();
    });

    it('does not change values when getPlace returns undefined', () => {
      component.addressFormGroup.reset();
      const address_line_1 = 'some address';
      component.addressFormGroup.controls['address_line_1'].setValue(address_line_1);

      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual(address_line_1);
      expect(component.addressFormGroup.controls['city'].value).toBeNull();
      expect(component.addressFormGroup.controls['state_province'].value).toBeNull();
      expect(component.addressFormGroup.controls['postal_code'].value).toBeNull();
    });
  });

  describe('address_components returns undefined', () => {
    beforeEach(() => {
      window['google'] = {
        maps: {
          places: {
            Autocomplete: function () {
              return {
                addListener: () => '',
                getPlace: function () {
                  return { address_components: undefined };
                },
                setComponentRestrictions: () => undefined
              };
            }
          }
        }
      };
      configSpy.and.returnValue(true);
      fixture.detectChanges();
    });

    it('does not change values when address_components is undefined', () => {
      component.addressFormGroup.reset();
      const address_line_1 = 'some address';
      component.addressFormGroup.controls['address_line_1'].setValue(address_line_1);

      component.autocompleteAddress();
      expect(component.addressFormGroup.controls['address_line_1'].value).toEqual(address_line_1);
      expect(component.addressFormGroup.controls['city'].value).toBeNull();
      expect(component.addressFormGroup.controls['state_province'].value).toBeNull();
      expect(component.addressFormGroup.controls['postal_code'].value).toBeNull();
    });
  });

}); // describe - AddressFormComponent
