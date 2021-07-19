import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { EditMerchantComponent } from './edit-merchant.component';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantPut, Merchant, EditBusinessFormData, EditAddressFormData } from 'app/models/api-entities/merchant';
import { Province } from 'app/models/province';
import { UiError } from 'app/models/ui-error';
import { merchantDataFactory, merchantPutFactory } from 'app/test-stubs/factories/merchant';
import { editBusinessFormFactory } from 'app/test-stubs/factories/forms';
import { Address } from 'app/models/address';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';
// TEST HELPERS

function getEditBusinessFormData(merchantPut: MerchantPut): EditBusinessFormData {
  return { name: merchantPut.name,
           doing_business_as: merchantPut.doing_business_as,
           business_num: merchantPut.business_num,
           incorporated_in: merchantPut.incorporated_in };
}

function getEditAddressFormData(merchantPut: MerchantPut): EditAddressFormData {
  return { address_line_1: merchantPut.address_line_1,
           city: merchantPut.city,
           postal_code: merchantPut.postal_code,
           state_province: merchantPut.state_province };
}

describe('EditMerchantComponent', () => {
  let component: EditMerchantComponent;
  let fixture: ComponentFixture<EditMerchantComponent>;

  let merchantObsSpy: jasmine.Spy;
  let updateMerchantSpy: jasmine.Spy;
  let errorSpy: jasmine.Spy;
  let notifyBugsnagSpy: jasmine.Spy;
  let doneSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule ],
      declarations: [ AddressFormComponent, EditMerchantComponent ],
      providers: [
        CookieService,
        ErrorService,
        FormBuilder,
        LoggingService,
        MerchantService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(inject([ MerchantService, ErrorService ],
    (merchantService: MerchantService, errorService: ErrorService) => {

    fixture = TestBed.createComponent(EditMerchantComponent);
    component = fixture.componentInstance;

    // Setup Spies
    merchantObsSpy = spyOnProperty(merchantService, 'merchantObs');
    updateMerchantSpy = spyOn(merchantService, 'updateMerchant');
    errorSpy = spyOn(errorService, 'show');
    notifyBugsnagSpy = spyOn(Bugsnag, 'notify');
    doneSpy = spyOn(component.doneEvent, 'emit');

    // Common Stubbing
    merchantObsSpy.and.returnValue(new BehaviorSubject(merchantDataFactory.build()));
    updateMerchantSpy.and.returnValue(of()); // Empty observable: Nothing happens
  }));

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // FORM

  describe('When initializing the Merchant Form', () => {
    it('(null check) should not prepopulate anything if business attributes of the merchant entities are malformed', () => {
      const malformedMerchant = null;
      merchantObsSpy.and.returnValue(new BehaviorSubject(malformedMerchant));

      component.ngOnInit();
      expect(component.editMerchantFormGroup.get('name').value).toBe('');
      expect(component.editMerchantFormGroup.get('name').untouched).toBeTrue();
      expect(component.editMerchantFormGroup.get('doing_business_as').value).toBe('');
      expect(component.editMerchantFormGroup.get('doing_business_as').untouched).toBeTrue();
      expect(component.editMerchantFormGroup.get('business_num').value).toBe('');
      expect(component.editMerchantFormGroup.get('business_num').untouched).toBeTrue();
      expect(component.editMerchantFormGroup.get('incorporated_in').value).toBe('');
      expect(component.editMerchantFormGroup.get('incorporated_in').untouched).toBeTrue();
    });

    it('should prepopulate the merchant name input', () => {
      const merchant = merchantDataFactory.build({ name: 'Some Legal Business Name' });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      component.ngOnInit();

      expect(component.editMerchantFormGroup.get('name').value).toEqual(merchant.name);
      // expect(component.editMerchantFormGroup.get('name').touched).toBeTrue(); // TODO [Val] Investigate
      expect(component.editMerchantFormGroup.get('name').valid).toBeTrue();
    });

    it('should prepopulate the \'doing business as\' input', () => {
      const merchant = merchantDataFactory.build({ doing_business_as: 'Some Marketable Business Name' });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      component.ngOnInit();

      expect(component.editMerchantFormGroup.get('doing_business_as').value).toEqual(merchant.doing_business_as);
      // expect(component.editMerchantFormGroup.get('doing_business_as').touched).toBeTrue(); // TODO [Val] Investigate
      expect(component.editMerchantFormGroup.get('doing_business_as').valid).toBeTrue();
    });

    describe('the business number', () => {
      it('should prepopulate the business number if it was initially provided', () => {
        const merchant = merchantDataFactory.build({ business_num: '1234567890' });
        merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

        component.ngOnInit();

        expect(component.editMerchantFormGroup.get('business_num').value).toEqual(merchant.business_num);
        // expect(component.editMerchantFormGroup.get('business_num').touched).toBeTrue(); // TODO [Val] Investigate
        expect(component.editMerchantFormGroup.get('business_num').valid).toBeTrue();
      });

      it('should be left blank if it was NOT initially provided', () => {
        [ undefined, null, ''].forEach(nullLikeValue => {
          const merchant = merchantDataFactory.build({ business_num: nullLikeValue });
          merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

          component.ngOnInit();

          expect(component.editMerchantFormGroup.get('business_num').value).toBe('');
          expect(component.editMerchantFormGroup.get('business_num').untouched).toBeTrue();
        });
      });
    }); // describe - 'the business number'

    describe('the jurisdiction (incorporated_in)', () => {
      it('should be prepopulated if it was initially provided', () => {
        const merchant = merchantDataFactory.build({ incorporated_in: Province.ON });
        merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

        component.ngOnInit();

        expect(component.editMerchantFormGroup.get('incorporated_in').value).toEqual(merchant.incorporated_in);
        // expect(component.editMerchantFormGroup.get('incorporated_in').touched).toBeTrue(); // TODO [Val] Investigate
        expect(component.editMerchantFormGroup.get('incorporated_in').valid).toBeTrue();
      });

      it('should be left blank if it was NOT initially provided', () => {
        [ undefined, null ].forEach(nullLikeValue => {
          const merchant = merchantDataFactory.build({ incorporated_in: nullLikeValue });
          merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

          component.ngOnInit();

          expect(component.editMerchantFormGroup.get('incorporated_in').value).toBe('');
          expect(component.editMerchantFormGroup.get('incorporated_in').untouched).toBeTrue();
        });
      });
    }); // describe - 'the jurisdiction (incorporated_in)'

  }); // describe - 'when initializing the Merchant Form'

  describe('When initializing the Address Form', () => {
    it('(null check) should not prepopulate anything if address attributes of the merchant entities are malformed', () => {
      const malformedMerchant = merchantDataFactory.build({
        address_line_1: undefined,
        address_line_2: undefined,
        city: undefined,
        country: undefined,
        postal_code: undefined,
        state_province: undefined
      });
      merchantObsSpy.and.returnValue(new BehaviorSubject(malformedMerchant));

      fixture.detectChanges();

      expect(component.addressFormGroup.get('address_line_1').value).toBe('');
      expect(component.addressFormGroup.get('city').value).toBe('');
      expect(component.addressFormGroup.get('postal_code').value).toBe('');
      expect(component.addressFormGroup.get('state_province').value).toBe('');
    });

    it('should prepopulate the address line with only address_line_1', () => {
      const merchant = merchantDataFactory.build({ address_line_1: 'XX Some Street', address_line_2: '' });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      fixture.detectChanges();

      expect(component.addressFormGroup.get('address_line_1').value).toEqual(merchant.address_line_1);
      // expect(component.addressFormGroup.get('address_line_1').touched).toBeTrue(); // TODO [Val] Investigate
      expect(component.addressFormGroup.get('address_line_1').valid).toBeTrue();
    });

    it('should prepopulate the address line with only address_line_2', () => {
      // It is reasonably assumed that address_line_2 would not be set without address_line_1
      const merchant = merchantDataFactory.build({ address_line_1: 'XX Some Street', address_line_2: 'Suite YYYY' });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      fixture.detectChanges();

      expect(component.addressFormGroup.get('address_line_1').value).toEqual(merchant.address_line_1 + ' ' + merchant.address_line_2);
      // expect(component.addressFormGroup.get('address_line_1').touched).toBeTrue(); // TODO [Val] Investigate
      expect(component.addressFormGroup.get('address_line_1').valid).toBeTrue();
    });

    it('should prepopulate the city', () => {
      const merchant = merchantDataFactory.build({ city: 'Ottawa' });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      fixture.detectChanges();

      expect(component.addressFormGroup.get('city').value).toEqual(merchant.city);
      // expect(component.addressFormGroup.get('city').touched).toBeTrue(); // TODO [Val] Investigate
      expect(component.addressFormGroup.get('city').valid).toBeTrue();
    });

    it('should preselect the province', () => {
      const merchant = merchantDataFactory.build({ state_province: Province.ON });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      fixture.detectChanges();

      expect(component.addressFormGroup.get('state_province').value).toEqual(merchant.state_province);
      // expect(component.addressFormGroup.get('state_province').touched).toBeTrue(); // TODO [Val] Investigate
      expect(component.addressFormGroup.get('state_province').valid).toBeTrue();
    });

    it('should prepopulate the postal code', () => {
      const merchant = merchantDataFactory.build({ state_province: 'H0H 0H0' });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      fixture.detectChanges();

      expect(component.addressFormGroup.get('postal_code').value).toEqual(merchant.postal_code);
      // expect(component.addressFormGroup.get('postal_code').touched).toBeTrue(); // TODO [Val] Investigate
      // expect(component.addressFormGroup.get('postal_code').valid).toBeTrue(); // TODO [Val] Investigate
    });
  }); // describe - 'when initializing the Adress Form'

  describe('setMerchantSubscription', () => {
    describe('when non-null value is emitted', () => {
      beforeEach(() => {
        merchantObsSpy.and.returnValue(new BehaviorSubject(merchantDataFactory.build()));
      });

      it('should assign the address', () => {
        fixture.detectChanges();
        const expectedAddress: Address = {
          address_line_1: merchantDataFactory.build().address_line_1,
          address_line_2: merchantDataFactory.build().address_line_2,
          city: merchantDataFactory.build().city,
          state_province: merchantDataFactory.build().state_province,
          postal_code: merchantDataFactory.build().postal_code
        };
        expect(component.address).toEqual(expectedAddress);
      });
    });

    describe('when non-null value is emitted', () => {
      const emptyAddress: Address = {
        address_line_1: '', address_line_2: '',
        city: '', state_province: '', postal_code: ''
      };

      beforeEach(() => {
        merchantObsSpy.and.returnValue(new BehaviorSubject(merchantDataFactory.build(emptyAddress)));
      });

      it('should clear the address with a well form, empty address object', () => {
        fixture.detectChanges();
        expect(component.address).toEqual(emptyAddress);
      });
    });
  });

  describe('updateMerchant', () => {

    const currentMerchant = (): Merchant => merchantDataFactory.build();
    const allMerchantUpdates = (): MerchantPut => merchantPutFactory.build({
      id: merchantDataFactory.build().id,
      business_num: '9876543210',
      doing_business_as: 'Matt\'s Catery',
      incorporated_in: Province.QC, // Jurisdiction.ON, // TODO [Val] Type Annotation
      name: 'Matt The Cat',

      address_line_1: '666 Cool Cat Avenue',
      city: 'Cat Town',
      postal_code: 'C1T3A2',
      state_province: Province.QC
    });

    describe('should call merchantService.updateMerchant with', () => {

      beforeEach(() => {
        merchantObsSpy.and.returnValue(new BehaviorSubject(currentMerchant()));
        updateMerchantSpy.and.returnValue(of(new HttpResponse({ status: 200, statusText: 'OK' })));
      });

      it('all params updated', () => {
        fixture.detectChanges(); // Prepopulate

        const paramsUpdated = allMerchantUpdates();
        component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
        component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
        fixture.detectChanges();

        component.updateMerchant();

        const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
        expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
      });

      describe('only specific param(s): ', () => {
        it('name', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            name: allMerchantUpdates().name
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();

          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });

        it('doing_business_as', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            doing_business_as: allMerchantUpdates().doing_business_as
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();
          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });

        it('business_number & jurisdiction', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            business_num: allMerchantUpdates().business_num,
            incorporated_in: allMerchantUpdates().incorporated_in
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();

          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });

        it('address_line_1', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            address_line_1: allMerchantUpdates().address_line_1
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();

          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });

        it('city', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            city: allMerchantUpdates().city
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();

          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });

        it('postal_code', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            postal_code: allMerchantUpdates().postal_code
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();

          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });

        it('state_province', () => {
          fixture.detectChanges(); // Prepopulate

          const paramsUpdated = merchantPutFactory.build({
            state_province: allMerchantUpdates().state_province
          });
          component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
          component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
          fixture.detectChanges();

          component.updateMerchant();

          const expectedPutMerchantBody: MerchantPut = merchantPutFactory.build(paramsUpdated);
          expect(updateMerchantSpy).toHaveBeenCalledOnceWith(expectedPutMerchantBody, true);
        });
      }); // describe - 'only specific param(s):'
    }); // describe - 'should call merchantService.updateMerchant with'

    describe('when updating the merchant is performing', () => {

      beforeEach(() => {
        updateMerchantSpy.and.returnValue(of()); // Doesn't emit

        fixture.detectChanges(); // Prepopulate

        const paramsUpdated = allMerchantUpdates();
        component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
        component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
        fixture.detectChanges(); // Edit form values
      });

      it('should set updating merchant state to in_progress', () => {
        expect(component.isUpdatingMerchant).toBe(component.UpdatingMerchantState.pending);
        component.updateMerchant();

        expect(component.isUpdatingMerchant).toBe(component.UpdatingMerchantState.in_progress);
      });

      it('should set transitionning to true', () => {
        expect(component.isTransitioning).toBeFalse();
        component.updateMerchant();

        expect(component.isTransitioning).toBeTrue();
      });
    }); // describe - 'when updating the merchant is performing'

    describe('when updating the merchant succeeds', () => {

      beforeEach(() => {
        updateMerchantSpy.and.returnValue(of(new HttpResponse({ status: 200, statusText: 'OK' })));

        fixture.detectChanges(); // Prepopulate

        const paramsUpdated = allMerchantUpdates();
        component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
        component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
        fixture.detectChanges(); // Edit form values

      });

      it('should set updating merchant state to succeed', () => {
        expect(component.isUpdatingMerchant).toBe(component.UpdatingMerchantState.pending);
        component.updateMerchant();

        expect(component.isUpdatingMerchant).toBe(component.UpdatingMerchantState.succeed);
      });

      it('should emit a done event', () => {
        component.updateMerchant();

        expect(doneSpy).toHaveBeenCalledTimes(1);
      });
    }); // describe - 'when updating the merchant succeeds'

    describe('when updating the merchant fails', () => {

      beforeEach(() => {
        updateMerchantSpy.and.returnValue(throwError(new HttpErrorResponse({})));

        fixture.detectChanges(); // Prepopulate

        const paramsUpdated = allMerchantUpdates();
        component.editMerchantFormGroup.setValue(getEditBusinessFormData(paramsUpdated));
        component.addressFormGroup.setValue(getEditAddressFormData(paramsUpdated));
        fixture.detectChanges(); // Edit form values
      });

      it('should set updating merchant state back to pending', () => {
        expect(component.isUpdatingMerchant).toBe(component.UpdatingMerchantState.pending);
        component.updateMerchant();

        expect(component.isUpdatingMerchant).toBe(component.UpdatingMerchantState.pending);
      });

      it('should set transitionning back to false', () => {
        expect(component.isTransitioning).toBeFalse();
        component.updateMerchant();

        expect(component.isTransitioning).toBeFalse();
      });

      it('should trigger a bugnsag', () => {
        const errors: any[] = [null, {}, internalServerErrorFactory.build()]; // eslint-disable-line
        errors.forEach(error => {
          updateMerchantSpy.and.returnValue(throwError(error));
          component.updateMerchant();

          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
          notifyBugsnagSpy.calls.reset();
        });
      });

      it('should show a specific UI error modal', () => {
        component.updateMerchant();

        expect(errorSpy).toHaveBeenCalledOnceWith(UiError.putMerchant);
      });
    }); // describe - 'when updating the merchant fails'
  }); // describe - 'updateMerchant()'

  // NAVIGATION

  describe('Back button', () => {
    it('should emit a \'done\' event', () => {
      component.goBack();

      expect(doneSpy).toHaveBeenCalledTimes(1);
    });
  }); // describe - 'Back button'

  // PUBLIC GETTERS & SETTERS

  describe('merchantIncorporatedIn', () => {
    it('should return an incorporated_in if the merchant has it set', () => {
      const expectedIncorporatedIn: Province = Province.AB;
      const merchant: Merchant = merchantDataFactory.build({ incorporated_in: expectedIncorporatedIn });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      component.ngOnInit();

      expect(component.merchantIncorporatedIn).toBe(expectedIncorporatedIn);
    });

    it('should return an empty string if the merchant.incorporated_in is undefined', () => {
      const merchant: Merchant = merchantDataFactory.build({ incorporated_in: undefined });
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      component.ngOnInit();

      expect(component.merchantIncorporatedIn).toBe('');
    });

      it('should return an empty string if the merchant is null', () => {
      const merchant =  null;
      merchantObsSpy.and.returnValue(new BehaviorSubject(merchant));

      component.ngOnInit();

      expect(component.merchantIncorporatedIn).toBe('');
    });
  }); // describe - merchantIncorporatedIn

  describe('User Interaction methods', () => {

    beforeEach(() => fixture.detectChanges());

    describe('isBusinessNameInvalid', () => {
      it('should return true if the control is touched and invalid', () => {
        component.ngOnInit();

        component.editMerchantFormGroup.setValue(editBusinessFormFactory
          .build({ name: '' }));
        component.editMerchantFormGroup.get('name').markAsTouched();

        expect(component.isBusinessNameInvalid).toBeTrue();
      });
    }); // describe - isBusinessNameInvalid

    describe('isDoingBusinessAsInvalid', () => {
      it('should return true if the control is touched and invalid', () => {
        component.ngOnInit();

        component.editMerchantFormGroup.setValue(editBusinessFormFactory
          .build({ doing_business_as: '' }));
        component.editMerchantFormGroup.get('doing_business_as').markAsTouched();

        expect(component.isDoingBusinessAsInvalid).toBeTrue();
      });
    }); // describe - isBusinessNameInvalid

    describe('isJurisdictionInvalid', () => {

      describe('if jurisdiction is set and valid', () => {
        it('should return false when the business number is set and BUT invalid', () => {
          component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({
            business_num: '*!@#|',
            incorporated_in: Province.ON
          }));

          expect(component.isJurisdictionInvalid).toBeFalse();
        });

        it('should return false when the business number is set and valid', () => {
          component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({
            business_num: '1234567890',
            incorporated_in: Province.ON
          }));
        });
      }); // describe - 'if jurisdiction is set and valid'

      it('should return true if the the business number is set but not jurisdiction', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({
          business_num: '1234567890',
          incorporated_in: null
        }));
      });

      it('should return true if the form has a jurisdictionIncomplete error', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build());

        // Explicitly set the error
        component.editMerchantFormGroup.setErrors({ jurisdictionIncomplete: true });

        expect(component.isJurisdictionInvalid).toBeTrue();
      });
    }); // describe - isJurisdictionInvalid

    describe('businessNumberHasInvalidCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build());

        expect(component.businessNumberHasInvalidCharacter()).toBeFalse();
      });

      it('businessNumberHasInvalidCharacter() should return true if business number has invalid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: '*' }));

        expect(component.businessNumberHasInvalidCharacter()).toBeTruthy();
      });
    }); // describe - 'businessNumberHasInvalidCharacter()'

    describe('businessNumberHasInvalidAlphanumericCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: 'AB123456', incorporated_in: Province.AB }));

        expect(component.businessNumberHasInvalidCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: 'AB123456%', incorporated_in: Province.AB }));

        expect(component.businessNumberHasInvalidAlphanumericCharacter()).toBeTruthy();
      });
    }); // describe - 'businessNumberHasInvalidAlphanumericCharacter()'

    describe('businessNumberHasInvalidNumericCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: '123456', incorporated_in: Province.ON }));

        expect(component.businessNumberHasInvalidAlphanumericCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: 'AB12345', incorporated_in: Province.ON }));

        expect(component.businessNumberHasInvalidNumericCharacter()).toBeTruthy();
      });
    }); // describe - 'businessNumberHasInvalidNumericCharacter()'

    describe('businessNumberHasInvalidFederalCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: '123456-1', incorporated_in: Province.CD }));

        expect(component.businessNumberHasInvalidFederalCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: 'AB12345-1', incorporated_in: Province.CD }));

        expect(component.businessNumberHasInvalidFederalCharacter()).toBeTruthy();
      });
    }); // describe - 'businessNumberHasInvalidFederalCharacter()'

    describe('businessNumberHasInvalidLength()', () => {
      it('should return false if business number has valid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: '123456', incorporated_in: Province.NB }));

        expect(component.businessNumberHasInvalidLength()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: '1234567', incorporated_in: Province.NB }));

        expect(component.businessNumberHasInvalidLength()).toBeTruthy();
      });
    }); // describe - 'businessNumberHasInvalidLength()'

    describe('businessNumberHasInvalidAlphaStartCharacter()', () => {
      it('should return true if business number has invalid characters for BC', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: '1234567', incorporated_in: Province.BC }));

        expect(component.businessNumberHasInvalidAlphaStartCharacter()).toBeTruthy();
      });

      it('should return false if business number has valid characters for BC', () => {
        component.editMerchantFormGroup.setValue(editBusinessFormFactory.build({ business_num: 'B1234567', incorporated_in: Province.BC }));

        expect(component.businessNumberHasInvalidAlphaStartCharacter()).toBeFalse();
      });
    }); // describe - 'businessNumberHasInvalidAlphaStartCharacter()'

    describe('businessNumberHasJurisdictionError()', () => {
      let businessNumberHasInvalidAlphanumericCharacterSpy: jasmine.Spy;
      let businessNumberHasInvalidAlphaStartCharacterSpy: jasmine.Spy;
      let businessNumberHasInvalidNumericCharacterSpy: jasmine.Spy;
      let businessNumberHasInvalidLengthSpy: jasmine.Spy;
      let businessNumberHasInvalidFederalCharacterSpy: jasmine.Spy;

      beforeEach(() => {
        businessNumberHasInvalidAlphanumericCharacterSpy = spyOn(component, 'businessNumberHasInvalidAlphanumericCharacter').and.returnValue(false);
        businessNumberHasInvalidAlphaStartCharacterSpy = spyOn(component, 'businessNumberHasInvalidAlphaStartCharacter').and.returnValue(false);
        businessNumberHasInvalidNumericCharacterSpy = spyOn(component, 'businessNumberHasInvalidNumericCharacter').and.returnValue(false);
        businessNumberHasInvalidLengthSpy = spyOn(component, 'businessNumberHasInvalidLength').and.returnValue(false);
        businessNumberHasInvalidFederalCharacterSpy = spyOn(component, 'businessNumberHasInvalidFederalCharacter').and.returnValue(false);
      });

      it('should return false if there are no errors', () => {
        expect(component.businessNumberHasJurisdictionError()).toBeFalse();
      });

      it('should return true if there is an alphanumeric error', () => {
        businessNumberHasInvalidAlphanumericCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTruthy();
      });

      it('should return true if there is an alpha start error', () => {
        businessNumberHasInvalidAlphaStartCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTruthy();
      });

      it('should return true if there is a numeric error', () => {
        businessNumberHasInvalidNumericCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTruthy();
      });

      it('should return true if there is a length error', () => {
        businessNumberHasInvalidLengthSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTruthy();
      });

      it('should return true if there is a federal jurisdiction error', () => {
        businessNumberHasInvalidFederalCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTruthy();
      });
    }); // describe - 'businessNumberHasJurisdictionError()'

    describe('onDoingBusinessCheckboxClicked', () => {
      it('should set the doing business as value to the legal business name and disable the input field if checked', () => {
        fixture.detectChanges();
        component.editMerchantFormGroup.controls['name'].setValue('ACME Co');

        const $event = { target: { checked: true } };
        component.onDoingBusinessCheckboxClicked($event);

        expect(component.editMerchantFormGroup.controls['doing_business_as'].value).toEqual('ACME Co');
        expect(component.editMerchantFormGroup.controls['doing_business_as'].disabled).toBeTruthy();
      });

      it('should clear the doing business as value and enable the input field if unchecked', () => {
        fixture.detectChanges();
        component.editMerchantFormGroup.controls['name'].setValue('ACME Co');
        component.editMerchantFormGroup.controls['doing_business_as'].setValue('ACME Co');

        const $event = { target: { checked: false } };
        component.onDoingBusinessCheckboxClicked($event);

        expect(component.editMerchantFormGroup.controls['doing_business_as'].value).toEqual('');
        expect(component.editMerchantFormGroup.controls['doing_business_as'].enabled).toBeTruthy();
      });
    });
  }); // describe - 'User Interaction methods'

}); // describe - EditMerchantComponent
