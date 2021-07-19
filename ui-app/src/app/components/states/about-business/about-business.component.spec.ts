import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { NgxCleaveDirectiveModule } from 'ngx-cleave-directive';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { AboutBusinessComponent } from './about-business.component';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { ApplicationProgressComponent } from 'app/components/utilities/application-progress/application-progress.component';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { BusinessCertificationService } from 'app/services/business-certification.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { LeadService } from 'app/services/lead.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { ErrorService } from 'app/services/error.service';
import { ERRORS } from 'app/error.codes';
import { PartialMerchantLead } from 'app/models/api-entities/lead';
import { UiError } from 'app/models/ui-error';
import { merchantPost, merchantDataResponseFactory } from 'app/test-stubs/factories/merchant';
import { businessFormFactory, addressFormFactory } from 'app/test-stubs/factories/forms';
import {
  merchantQueryPost,
  merchantQueryResponseEmpty,
  merchantQueryResponse
} from 'app/test-stubs/factories/merchant-query';
import { commonErrorsFactory, conflictFactory, unknownErrorFactory, internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { UserSessionService } from 'app/services/user-session.service';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";
import { merchantQuerySelectPost } from 'app/test-stubs/factories/merchant-query-select';
import { DatePickerComponent } from 'app/components/utilities/date-picker/date-picker.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { SupportedLanguage } from 'app/models/languages';
import { merchantInfoFactory } from 'app/test-stubs/factories/lead';
import { ActivatedRoute } from '@angular/router';

describe('AboutBusinessComponent', () => {
  let component: AboutBusinessComponent;
  let fixture: ComponentFixture<AboutBusinessComponent>;

  const activatedRoute = {
    snapshot: {
      data: {
        merchantInfo: undefined
      }
    }
  };

  let certificationService: BusinessCertificationService;
  let configurationService: ConfigurationService;
  let errorService: ErrorService;
  let loggingService: LoggingService;
  let merchantService: MerchantService;
  let modalService: BsModalService;
  let translateService: TranslateService;
  let userSessionService: UserSessionService;

  // Spies
  let notifyBugsnagSpy: jasmine.Spy;

  // Spies
  let showErrorSpy: jasmine.Spy;
  let delegatedAccessModeSpy: jasmine.Spy;
  let csJurisdictionEnabledSpy: jasmine.Spy;
  let queryMerchantSpy: jasmine.Spy;
  let postMerchantSpy: jasmine.Spy;
  let selectBusinessSpy: jasmine.Spy;
  let getMerchantQueryResponseSpy: jasmine.Spy;
  let ussHasApplicantSpy: jasmine.Spy;


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        ModalModule.forRoot(),
        ReactiveFormsModule,
        NgxCleaveDirectiveModule,
        BsDatepickerModule.forRoot()
      ],
      declarations: [
        AboutBusinessComponent,
        AddressFormComponent,
        ApplicationProgressComponent,
        DatePickerComponent
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute
        },
        BsModalService,
        BusinessCertificationService,
        ConfigurationService,
        CookieService,
        ErrorService,
        LeadService,
        LoggingService,
        MerchantService,
        UserSessionService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutBusinessComponent);
    component = fixture.componentInstance;

    window['google'] = {
      maps: {
        places: {
          Autocomplete: function () {
            return {
              addListener: () => 'a',
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

    certificationService = TestBed.inject(BusinessCertificationService);
    configurationService = TestBed.inject(ConfigurationService);
    errorService = TestBed.inject(ErrorService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    modalService = TestBed.inject(BsModalService);
    translateService = TestBed.inject(TranslateService);
    userSessionService = TestBed.inject(UserSessionService);

    // Spies
    notifyBugsnagSpy = spyOn(Bugsnag, 'notify');
    spyOn(certificationService, 'reauth');
    selectBusinessSpy = spyOn(certificationService, 'selectBusiness').and.returnValue(of(merchantDataResponseFactory.build()));

    csJurisdictionEnabledSpy = spyOnProperty(configurationService, 'jurisdictionEnabled').and.returnValue(true);

    showErrorSpy = spyOn(errorService, 'show');

    const merchantInfo = merchantInfoFactory.build();
    activatedRoute.snapshot.data.merchantInfo = merchantInfo;

    delegatedAccessModeSpy = spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
    getMerchantQueryResponseSpy = spyOn(merchantService, 'getMerchantQueryResponse').and.returnValue(merchantQueryResponse);
    postMerchantSpy = spyOn(merchantService, 'postMerchant').and.returnValue(of(merchantDataResponseFactory.build()));
    queryMerchantSpy = spyOn(merchantService, 'queryMerchant');

    spyOn(modalService, 'show').and.returnValue(new BsModalRef());

    ussHasApplicantSpy = spyOnProperty(userSessionService, 'hasApplicant').and.returnValue(false);
    spyOn(merchantService, 'buildMerchantQuerySelectPost').and.returnValue(merchantQuerySelectPost);
    spyOn(merchantService, 'buildMerchantPost').and.returnValue(merchantPost);

    spyOn(loggingService, 'GTMDnq');

    spyOnProperty(translateService,'currentLang').and.returnValue(SupportedLanguage.fr);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // [FEAT] LEAD FORM PREPOPULATION ---------------------------------------------------------

  describe('Lead Form Prepopulation', () => {
    beforeEach(() =>{
      ussHasApplicantSpy.and.returnValue(false);
    });

    describe('should be able to prepopulate and validate', () => {
      it('each individual business-related form controls from the lead', fakeAsync(() => {
        const businessLead: PartialMerchantLead = businessFormFactory.build();
        const businessLeadAttributes: string[] = Object.keys(businessLead);

        businessLeadAttributes.forEach((attr: string) => {
          const partialLead = { [attr]: businessLead[attr] };
          activatedRoute.snapshot.data.merchantInfo = partialLead;
          fixture.detectChanges();
          component.aboutBusinessFormGroup.reset();
          component.ngAfterViewInit();
          tick();


          const targetControl = component.aboutBusinessFormGroup.get(attr);
          expect(targetControl.value).toBeTruthy();
          expect(targetControl.touched).toBeTrue();

          // 'And should leave the others untouched'
          const untouchedAttributes: string[] = businessLeadAttributes.filter(key => key !== attr);

          untouchedAttributes.forEach((untouchedAttr: string) => {
            const untouchedTargetControl = component.aboutBusinessFormGroup.get(untouchedAttr);
            expect(untouchedTargetControl.value).toBeFalsy();
            expect(untouchedTargetControl.untouched).toBeTrue();
          });
        });
      })); // it

      it('each individual address-related form controls from the lead', fakeAsync(() => {
        const businessAddressLead: PartialMerchantLead = addressFormFactory.build();
        const businessAddressLeadAttributes: string[] = Object.keys(businessAddressLead);

        businessAddressLeadAttributes.forEach((attr: string) => {
          const partialLead = { [attr]: businessAddressLead[attr] };
          
          activatedRoute.snapshot.data.merchantInfo = partialLead;
          fixture.detectChanges();
          component.addressFormGroup.reset();
          component.ngAfterViewInit();
          tick();

          const targetControl = component.addressFormGroup.get(attr);
          expect(targetControl.value).toEqual(businessAddressLead[attr]);
          expect(targetControl.touched).toBeTrue();

          // 'And should leave the others untouched'
          const untouchedAttributes: string[] = businessAddressLeadAttributes.filter(key => key !== attr);

          untouchedAttributes.forEach((untouchedAttr: string) => {
            const untouchedTargetControl = component.addressFormGroup.get(untouchedAttr);
            expect(untouchedTargetControl.value).toBeNull();
            expect(untouchedTargetControl.untouched).toBeTrue();
          }); // forEach
        }); // forEach - attr
      })); // it

      it('all business & address form controls from the lead', fakeAsync(() => {
        // Note: Roughly the same thing as the 2 tests above, just all at once to see if there's no bad interactions.
        const fullLead: PartialMerchantLead = { ...businessFormFactory.build(), ...addressFormFactory.build() };
        activatedRoute.snapshot.data.merchantInfo = fullLead;
        fixture.detectChanges();
        component.ngAfterViewInit();
        tick();

        Object.keys(fullLead).forEach((attr: string) => {
          const targetControl = component.aboutBusinessFormGroup.get(attr) || component.addressFormGroup.get(attr);
          expect(targetControl.value).toBeTruthy();
          expect(targetControl.touched).toBeTrue();
        }); // forEach
      }));
    }); // describe - 'should be able to prepopulate and validate'

    it('should not prepopulate and validate any form control if the value of lead attribute is null-like', fakeAsync(() => {
      const lead: PartialMerchantLead = businessFormFactory.build();
      const leadAttributes: string[] = Object.keys(lead);

      leadAttributes.forEach((attr: string) => {
        const nullLikeValues = [ undefined, null ];

        nullLikeValues.forEach(nullLikeValue => {
          const partialLead = { [attr]: nullLikeValue };
          activatedRoute.snapshot.data.merchantInfo = partialLead;
          fixture.detectChanges();
          component.ngAfterViewInit();
          tick();

          const targetControl = component.aboutBusinessFormGroup.get(attr);
          expect(targetControl.value).toBeFalsy();
          expect(targetControl.untouched).toBeTrue();
        }); // forEach
      }); // forEach
    })); // it
  }); // describe - 'Lead Form Prepopulation'

  // SUBMIT ABOUT BUSINESS FORM -------------------------------------------------------------

  describe('submitBusinessInfo()', () => {
    beforeEach(() => {
      spyOn(component, 'fetchMerchants');

      fixture.autoDetectChanges();
    });

    it('should call fetchMerchants when form is valid', () => {
      component.aboutBusinessFormGroup.setValue(businessFormFactory.build());
      component.addressFormGroup.setValue(addressFormFactory.build());
      component.submitBusinessInfo(null);

      expect(component.fetchMerchants).toHaveBeenCalledOnceWith(merchantQueryPost);
    });

    describe('when in delegated access mode', () => {
      beforeEach(() => {
        delegatedAccessModeSpy.and.returnValue(true);
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build());
        component.addressFormGroup.setValue(addressFormFactory.build());
        component.submitBusinessInfo(null);
      });

      it('should not call fetchMerchants, and trigger modal', () => {
        expect(component.fetchMerchants).not.toHaveBeenCalled();
      });

      it('should trigger delegated mode modal', () => {
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
      });
    }); // describe - 'when in delegated access mode'

    it('should call stopPropagation and preventDefault on mouse event when form is invalid', () => {
      component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ name: null }));
      component.addressFormGroup.setValue(addressFormFactory.build({ city: null }));

      const mouseEvent = new MouseEvent(null);
      spyOn(mouseEvent, 'stopPropagation');
      spyOn(mouseEvent, 'preventDefault');

      fixture.detectChanges();
      component.submitBusinessInfo(mouseEvent);

      expect(mouseEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(mouseEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('should scrollToView on invalid form control', () => {
      component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ name: null }));
      component.addressFormGroup.setValue(addressFormFactory.build());

      fixture.detectChanges();
      const nameEL = fixture.debugElement.query(By.css('input[formcontrolname="name"')).nativeElement;
      spyOn(nameEL, 'scrollIntoView');

      component.submitBusinessInfo(new MouseEvent(null));

      expect(nameEL.scrollIntoView).toHaveBeenCalledTimes(1);
    });
  }); // describe - submitBusinessInfo()

  describe('fetchMerchants()', () => {
    it('should trigger confirmBusiness modal on success with results', () => {
      queryMerchantSpy.and.returnValue(of(merchantQueryResponse));

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      expect(modalService.show).toHaveBeenCalledOnceWith(component.confirmBusinessModal, component.confirmBusinessModalConfig);
    });

    it('should trigger businessNotFound modal on success with no results', () => {
      queryMerchantSpy.and.returnValue(of(merchantQueryResponseEmpty));
      getMerchantQueryResponseSpy.and.returnValue(merchantQueryResponseEmpty);

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      expect(modalService.show).toHaveBeenCalledOnceWith(component.businessNotFoundModal, component.businessNotFoundModalConfig);
    });

    it('should trigger error modal on failure', () => {
      queryMerchantSpy.and.returnValue(throwError(internalServerErrorFactory.build()));

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });

    it('should trigger a bugsnag on failure', () => {
      commonErrorsFactory.build().errors.forEach(err => {
        queryMerchantSpy.and.returnValue(throwError(err));
        fixture.detectChanges();
        component.fetchMerchants(merchantQueryPost);

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        notifyBugsnagSpy.calls.reset();
      });
    });

    it('should not trigger bugsnag on invalid address', () => {
      const err = new ErrorResponse(new HttpErrorResponse({
        status: 422, error: { code: ERRORS.API.ADDRESS_ERROR }
      }));
      queryMerchantSpy.and.returnValue(throwError(err));

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      expect(Bugsnag.notify).not.toHaveBeenCalled();
    });

    it('should trigger error modal on invalid address', () => {
      const err = new ErrorResponse(new HttpErrorResponse({
        status: 422, error: { code: ERRORS.API.ADDRESS_ERROR }
      }));
      queryMerchantSpy.and.returnValue(throwError(err));

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      const expected_context: ErrorModalContext = new ErrorModalContext(
        'ERROR_MODAL.GENERIC.HEADING',
        [ 'ABOUT_YOUR_BUSINESS.ERROR', 'ABOUT_YOUR_BUSINESS.ADDRESS_INVALID_ERROR', 'ERROR_MODAL.GENERIC.BODY_MESSAGE2' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
    });

    it('should trigger error modal on invalid phone number', () => {
      const err = new ErrorResponse(new HttpErrorResponse({
        status: 422, error: { code: ERRORS.API.PHONE_NUMBER_ERROR }
      }));
      queryMerchantSpy.and.returnValue(throwError(err));

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      const expected_context: ErrorModalContext = new ErrorModalContext(
        'ERROR_MODAL.GENERIC.HEADING',
        [ 'ABOUT_YOUR_BUSINESS.ERROR', 'ABOUT_YOUR_BUSINESS.PHONE_NUMBER_INVALID_ERROR', 'ERROR_MODAL.GENERIC.BODY_MESSAGE2' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
    });

    it('should trigger error modal on service unavailable', () => {
      const err = new ErrorResponse(new HttpErrorResponse({
        status: 500, error: { code: ERRORS.API.SERVICE_ERROR }
      }));
      queryMerchantSpy.and.returnValue(throwError(err));

      fixture.detectChanges();
      component.fetchMerchants(merchantQueryPost);

      const expected_context: ErrorModalContext = new ErrorModalContext(
        'ERROR_MODAL.SERVICE_ERROR',
        [ 'ABOUT_YOUR_BUSINESS.SERVICE_ERROR', 'ERROR_MODAL.GENERIC.BODY_MESSAGE2' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
    });
  }); // describe - fetchMerchants()

  // CREATE UNVERIFIED MERCHANT -------------------------------------------------------------

  describe('createMerchant()', () => {
    beforeEach(() => {
      component.businessNotFoundModalRef = new BsModalRef(); // Mock bootstrap modal
    });

    it('should be able to create an unverified merchant', () => {
      component.createMerchant(merchantPost);

      expect(merchantService.postMerchant).toHaveBeenCalledOnceWith(merchantPost);
    });

    it('should reauth after successfully creating an unverified merchant', () => {
      component.createMerchant(merchantPost);

      expect(certificationService.reauth).toHaveBeenCalledTimes(1);
    });

    it('should call GTMDnq after successfully creating an unverified merchant', () => {
      const merchantPostRequest = merchantPost;
      const merchantResponse = merchantDataResponseFactory.build();
      component.createMerchant(merchantPostRequest);

      expect(loggingService.GTMDnq).toHaveBeenCalledOnceWith(merchantResponse.data.marketing_qualified_lead, merchantPostRequest.industry, 'fr');
    });

    it('should show an error if postMerchant returns error status', () => {
      const errors = commonErrorsFactory.build().errors.filter(e => e.status !== 409);
      errors.forEach((value) => {
        showErrorSpy.calls.reset();
        postMerchantSpy.and.returnValue(throwError(new ErrorResponse(value)));

        component.createMerchant(merchantPost);

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postMerchant);
      });
    });

    describe('when attempting to create an unverified merchant that already exists', () => {
      beforeEach(() => {
        postMerchantSpy.and.returnValue(throwError(new ErrorResponse(conflictFactory.build())));
      });

      it('should show an specific error', () => {
        component.createMerchant(merchantPost);

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.merchantAlreadyExists);
      });

      it('should NOT trigger a bugsnag', () => {
        component.createMerchant(merchantPost);

        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
      });
    }); // describe - 'when attempting to create an unverified merchant that already exists'

    describe('when creating an unverified merchant returns an unexpected status code', () => {
      let expectedError: ErrorResponse;

      beforeEach(() => {
        expectedError = new ErrorResponse(unknownErrorFactory.build());
        postMerchantSpy.and.returnValue(throwError(expectedError));
      });

      it('should show an error', () => {
        component.createMerchant(merchantPost);

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postMerchant);
      });

      it('should trigger a bugsnag', () => {
        component.createMerchant(merchantPost);

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      });
    }); // describe - 'when creating an unverified merchant returns an unexpected status code'
  }); // describe - createMerchant()

  // CREATING VERIFIED MERCHANT (SELECT) ---------------------------------------------------

  describe('onConfirmBusinessClick()', () => {
    beforeEach(() => {
      component.confirmBusinessModalRef = new BsModalRef(); // Mock bootstrap modal
      component.merchantQueryResponse = merchantQueryResponse;
    });

    it('should show business not found modal if no business is selected', () => {
      component.onConfirmBusinessClick('-1');

      expect(modalService.show).toHaveBeenCalledOnceWith(component.businessNotFoundModal, component.businessNotFoundModalConfig);
    });

    it('should call reauth on select business', () => {
      component.onConfirmBusinessClick('1');

      expect(certificationService.reauth).toHaveBeenCalledTimes(1);
    });

    it('should call GTMDnq after successfully selecting a merchant', () => {
      const merchantPostRequest = merchantPost;
      const merchantResponse = merchantDataResponseFactory.build();

      component.onConfirmBusinessClick('1');

      expect(loggingService.GTMDnq).toHaveBeenCalledOnceWith(merchantResponse.data.marketing_qualified_lead, merchantPostRequest.industry, 'fr');
    });

    it('should show an error if creating an verified merchant that already exists', () => {
      selectBusinessSpy.and.returnValue(throwError(new ErrorResponse(conflictFactory.build())));
      component.merchantQueryResponse = merchantQueryResponse;

      fixture.detectChanges();
      component.onConfirmBusinessClick('1');

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.merchantAlreadyExists);
    });

    it('should show an error if selectBusiness returns error status', () => {
      const errors = commonErrorsFactory.build().errors.filter(e => e.status !== 409);
      errors.forEach((value) => {
        showErrorSpy.calls.reset();
        selectBusinessSpy.and.returnValue(throwError(new ErrorResponse(value)));
        component.merchantQueryResponse = merchantQueryResponse;

        fixture.detectChanges();
        component.onConfirmBusinessClick('1');


        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postMerchant);
      });
    });

    it('should show error if creating an verified merchant that returns an unexpected error', () => {
      selectBusinessSpy.and.returnValue(throwError(new ErrorResponse(unknownErrorFactory.build())));
      component.merchantQueryResponse = merchantQueryResponse;

      fixture.detectChanges();
      component.onConfirmBusinessClick('1');

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postMerchant);
    });

    it('should trigger a bugsnag on failure', () => {
       commonErrorsFactory.build().errors.forEach(err => {
        selectBusinessSpy.and.returnValue(throwError(new ErrorResponse(err)));
        component.merchantQueryResponse = merchantQueryResponse;

        fixture.detectChanges();
        component.onConfirmBusinessClick('1');

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        notifyBugsnagSpy.calls.reset();
      });
    });
  }); // describe - onConfirmBusinessClick()

  // UI-related unit tests -----------------------------------------------------------------

  it('should allow the user to proceed by creating an unverified merchant if his business is not found', () => {
    spyOn(component, 'createMerchant'); // Mocking actual createMerchant call.

    fixture.detectChanges();
    component.onBusinessNotFoundNextClick();

    expect(component.createMerchant).toHaveBeenCalledTimes(1);
  });

  describe('isBusinessControlInvalid', () => {
    describe('should return false when', () => {
      it('aboutBusinessFormGroup is not set', () => {
        component.aboutBusinessFormGroup = undefined;
        expect(component.isBusinessControlInvalid('name')).toBeFalse();

        component.aboutBusinessFormGroup = null;
        expect(component.isBusinessControlInvalid('name')).toBeFalse();
      });

      it('the named control doesn\'t exist', () => {
        fixture.detectChanges();

        expect(component.isBusinessControlInvalid('&!%(!*@$')).toBeFalse();
      });

      it('the control is invalid and but NOT touched', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.setValue(businessFormFactory
          .build({ name: 'Macho Nacho' }));

        expect(component.isBusinessControlInvalid('name')).toBeFalse();
      });

      it('the control is valid and touched', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.setValue(businessFormFactory
          .build({ name: 'Macho Nacho' }));
        component.aboutBusinessFormGroup.get('name').markAsTouched();

        expect(component.isBusinessControlInvalid('name')).toBeFalse();
      });
    }); // describe - 'should retun false when'

    describe('should return true when', () => {
      it('the control is both invalid and touched', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.setValue(businessFormFactory
          .build({ name: '' }));
        component.aboutBusinessFormGroup.get('name').markAsTouched();

        expect(component.isBusinessControlInvalid('name')).toBeTrue();
      });
    }); // describe - 'should retun true when'
  }); // describe - isBusinessControlInvalid()

  describe('User Interaction methods', () => {
    beforeEach(() => fixture.detectChanges());

    describe('businessNumberHasInvalidCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build());

        expect(component.businessNumberHasInvalidCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: '*' }));

        expect(component.businessNumberHasInvalidCharacter()).toBeTruthy(); // Error object
      });
    }); // describe - 'businessNumberHasInvalidCharacter()'

    describe('businessNumberHasInvalidAlphanumericCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: 'AB123456', incorporated_in: 'AB' }));

        expect(component.businessNumberHasInvalidCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: 'AB123456%', incorporated_in: 'AB' }));

        expect(component.businessNumberHasInvalidAlphanumericCharacter()).toBeTrue();
      });
    }); // describe - 'businessNumberHasInvalidAlphanumericCharacter()'

    describe('businessNumberHasInvalidNumericCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: '123456', incorporated_in: 'ON' }));

        expect(component.businessNumberHasInvalidAlphanumericCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: 'AB12345', incorporated_in: 'ON' }));

        expect(component.businessNumberHasInvalidNumericCharacter()).toBeTrue();
      });
    }); // describe - 'businessNumberHasInvalidNumericCharacter()'

    describe('businessNumberHasInvalidFederalCharacter()', () => {
      it('should return false if business number has valid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: '123456-1', incorporated_in: 'CD' }));

        expect(component.businessNumberHasInvalidFederalCharacter()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: 'AB12345-1', incorporated_in: 'CD' }));

        expect(component.businessNumberHasInvalidFederalCharacter()).toBeTrue();
      });
    }); // describe - 'businessNumberHasInvalidFederalCharacter()'

    describe('businessNumberHasInvalidLength()', () => {
      it('should return false if business number has valid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: '123456', incorporated_in: 'NB' }));

        expect(component.businessNumberHasInvalidLength()).toBeFalse();
      });

      it('should return true if business number has invalid characters', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: '1234567', incorporated_in: 'NB' }));

        expect(component.businessNumberHasInvalidLength()).toBeTrue();
      });
    }); // describe - 'businessNumberHasInvalidLength()'

    describe('businessNumberHasInvalidAlphaStartCharacter()', () => {
      it('should return true if business number has invalid characters for BC', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: '1234567', incorporated_in: 'BC' }));

        expect(component.businessNumberHasInvalidAlphaStartCharacter()).toBeTrue();
      });

      it('should return false if business number has valid characters for BC', () => {
        component.aboutBusinessFormGroup.setValue(businessFormFactory.build({ business_num: 'B1234567', incorporated_in: 'BC' }));

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
        expect(component.businessNumberHasJurisdictionError()).toBeTrue();
      });

      it('should return true if there is an alpha start error', () => {
        businessNumberHasInvalidAlphaStartCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTrue();
      });

      it('should return true if there is a numeric error', () => {
        businessNumberHasInvalidNumericCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTrue();
      });

      it('should return true if there is a length error', () => {
        businessNumberHasInvalidLengthSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTrue();
      });

      it('should return true if there is a federal jurisdiction error', () => {
        businessNumberHasInvalidFederalCharacterSpy.and.returnValue(true);
        expect(component.businessNumberHasJurisdictionError()).toBeTrue();
      });
    }); // describe - 'businessNumberHasJurisdictionError()'

    describe('goBackConfirmBusinessModal()', () => {
      it('should hide confirmBusinessModal', () => {
        component.confirmBusinessModalRef = new BsModalRef(); // Mock bootstrap modal
        spyOn(component.confirmBusinessModalRef, 'hide');

        component.goBackConfirmBusinessModal();

        expect(component.confirmBusinessModalRef.hide).toHaveBeenCalledTimes(1);
      });

      it('should hide businessNotFoundModal', () => {
        component.businessNotFoundModalRef = new BsModalRef(); // Mock bootstrap modal
        spyOn(component.businessNotFoundModalRef, 'hide');

        component.goBackBusinessNotFoundModal();

        expect(component.businessNotFoundModalRef.hide).toHaveBeenCalledTimes(1);
      });
    }); // describe - goBackConfirmBusinessModal()
  }); // describe - User Interaction methods

  describe('isDelegatedAccesMode()', () => {
    it('should return true when value in merchant service is true', () => {
      delegatedAccessModeSpy.and.returnValue(true);
      expect(component.isDelegatedAccessMode).toBeTrue();
    });

    it('should return false when value in merchant service is false', () => {
      delegatedAccessModeSpy.and.returnValue(false);
      expect(component.isDelegatedAccessMode).toBeFalse();
    });
  }); // describe - isDelegatedAccesMode()

  describe('isFetchingMerchants()', () => {
    it('should return false by default', () => {
      fixture.detectChanges();
      expect(component.isFetchingMerchants).toBeFalse();
    });
  }); // describe - isFetchingMerchants()

  describe('isSubmittingMerchant()', () => {
    it('should return false by default', () => {
      fixture.detectChanges();
      expect(component.isSubmittingMerchant).toBeFalse();
    });
  }); // describe - isFetchingMerchants()

  describe('havePrefilledLeadInfo()', () => {
    describe('should return true', () => {
      it('when the lead had usefull data points', fakeAsync(() => {
        const fullLead: PartialMerchantLead = { ...businessFormFactory.build(), ...addressFormFactory.build() };
        activatedRoute.snapshot.data.merchantInfo = fullLead;

        fixture.detectChanges();
        component.ngAfterViewInit();
        tick();

        expect(component.havePrefilledLeadInfo).toBeTrue();
      }));
    }); // describe - 'should return true'

    describe('should return false', () => {
      it('the lead was empty', () => {
        activatedRoute.snapshot.data.merchantInfo = null;

        fixture.detectChanges();

        expect(component.havePrefilledLeadInfo).toBeFalse();
      });

      it('the lead contained unused data points', () => {
        activatedRoute.snapshot.data.merchantInfo = { bleep: 'bloop' };

        fixture.detectChanges();

        expect(component.havePrefilledLeadInfo).toBeFalse();
      });
    });
  });

  // DBA CHECKBOX
  describe('onDoingBusinessCheckboxClicked', () => {
    it('should leave the business_name value intact if set', () => {
      fixture.detectChanges();
      component.aboutBusinessFormGroup.get('name').setValue('Feline Supremacists');
      component.onDoingBusinessCheckboxClicked(); // enabling

      expect(component.aboutBusinessFormGroup.get('name').value).toEqual('Feline Supremacists');
      expect(component.aboutBusinessFormGroup.get('name').enabled).toBeTrue();

      component.onDoingBusinessCheckboxClicked(); // disabling

      expect(component.aboutBusinessFormGroup.get('name').value).toEqual('Feline Supremacists');
      expect(component.aboutBusinessFormGroup.get('name').enabled).toBeTrue();
    });

    describe('when enabling the checkbox', () => {
      it('should set the doing_business_as value to the legal business name and disable the input field', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.get('name').setValue('Feline Supremacists');

        component.onDoingBusinessCheckboxClicked(); // enabling

        expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual('Feline Supremacists');
        expect(component.aboutBusinessFormGroup.get('doing_business_as').disabled).toBeTrue();
      });

      it('should clear the doing_business_as value if business_name was blank AND disable the input field', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.get('name').setValue(null);
        component.aboutBusinessFormGroup.get('doing_business_as').setValue('The Cat Action Committee');

        component.onDoingBusinessCheckboxClicked(); // enabling

        expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual(null);
        expect(component.aboutBusinessFormGroup.get('doing_business_as').disabled).toBeTrue();
      });

      it('should keep doing_business_as value in sync with business_name as is it typed', () => {
        fixture.detectChanges();
        component.onDoingBusinessCheckboxClicked(); // enabling
        component.aboutBusinessFormGroup.get('doing_business_as').setValue('Squirrels Intelligence Agency');

        // Init Expects
        expect(component.aboutBusinessFormGroup.get('name').value).toEqual(null);
        expect(component.aboutBusinessFormGroup.get('name').enabled).toBeTrue();
        expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual('Squirrels Intelligence Agency');
        expect(component.aboutBusinessFormGroup.get('doing_business_as').disabled).toBeTrue();

        const businessNameCharacters: string[] = 'The Cat Action Committee'.split('');

        businessNameCharacters.forEach((char: string) => {
          const currentBusinessName: string = component.aboutBusinessFormGroup.get('name').value;
          const newBusinessName: string = currentBusinessName + char;
          component.aboutBusinessFormGroup.get('name').setValue(newBusinessName);

          expect(component.aboutBusinessFormGroup.get('name').value).toEqual(newBusinessName);
          expect(component.aboutBusinessFormGroup.get('name').enabled).toBeTrue();
          expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual(newBusinessName); // Sync
          expect(component.aboutBusinessFormGroup.get('doing_business_as').disabled).toBeTrue();
        }); // forEach
      });
    }); // describe - 'when enabling the checkbox'

    describe('when disabling the checkbox', () => {
      it('should clear the doing_business_as value and re-enable the input field', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.get('name').setValue('Feline Supremacists');
        component.aboutBusinessFormGroup.get('doing_business_as').setValue('The Cat Action Committee');

        component.onDoingBusinessCheckboxClicked(); // enabling

        expect(component.aboutBusinessFormGroup.get('doing_business_as').disabled).toBeTrue();

        component.onDoingBusinessCheckboxClicked(); // disabling

        expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual(null);
        expect(component.aboutBusinessFormGroup.get('doing_business_as').enabled).toBeTrue();
      });

      it('should keep doing_business_as value unaltered when business_name changes', () => {
        fixture.detectChanges();
        component.aboutBusinessFormGroup.get('doing_business_as').setValue('Squirrels Intelligence Agency');

        // Init expects
        expect(component.aboutBusinessFormGroup.get('name').value).toEqual(null);
        expect(component.aboutBusinessFormGroup.get('name').enabled).toBeTrue();
        expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual('Squirrels Intelligence Agency');
        expect(component.aboutBusinessFormGroup.get('doing_business_as').enabled).toBeTrue();

        const businessNameCharacters: string[] = 'The Cat Action Committee'.split('');
        businessNameCharacters.forEach((char: string) => {
          const currentBusinessName: string = component.aboutBusinessFormGroup.get('name').value;
          const newBusinessName: string = currentBusinessName + char;
          component.aboutBusinessFormGroup.get('name').setValue(newBusinessName);

          expect(component.aboutBusinessFormGroup.get('name').value).toEqual(newBusinessName);
          expect(component.aboutBusinessFormGroup.get('name').enabled).toBeTrue();
          expect(component.aboutBusinessFormGroup.get('doing_business_as').value).toEqual('Squirrels Intelligence Agency'); // Not Sync
          expect(component.aboutBusinessFormGroup.get('doing_business_as').enabled).toBeTrue();
        }); // forEach
      });
    }); // describe - 'when disabling the checkbox'
  }); // describe - onDoingBusinessCheckboxClicked

  describe('setBusiness', () => {
    it('should set businessItemFormControl to value that is passed in', () => {
      component.setBusiness(component.noneOfMyBusinessId);
      expect(component.confirmBusinessFormGroup.get('businessItemFormControl').value).toEqual(component.noneOfMyBusinessId);
    });
  });

  describe('Optional owner_since form control', () => {
    it('should not add owner_since control when user has no applicant', () => {
      component.ngOnInit();
      expect(component.aboutBusinessFormGroup.get('owner_since')).toBeFalsy();
    });

    it('should add owner_since control when user has applicant', () => {
      ussHasApplicantSpy.and.returnValue(true);
      component.ngOnInit();
      expect(component.aboutBusinessFormGroup.get('owner_since')).toBeTruthy();
    });
  });

  describe('jurisdiction initialization', () => {
    it('should set isJurisdictionEnabled to true when jurisdiction_enabled is true in config', () => {
      csJurisdictionEnabledSpy.and.returnValue(true);
      component.ngOnInit();
      expect(component.isJurisdictionEnabled).toBeTrue();
    });

    it('should set isJurisdictionEnabled to false when jurisdiction_enabled is false in config', () => {
      csJurisdictionEnabledSpy.and.returnValue(false);
      component.ngOnInit();
      expect(component.isJurisdictionEnabled).toBeFalse();
    });
  });
}); // describe - AboutBusinessComponent
