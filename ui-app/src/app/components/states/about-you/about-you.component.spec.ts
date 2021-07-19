import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
// Third Party
import { TranslateModule } from '@ngx-translate/core';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
// Components
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { DatePickerComponent } from 'app/components/utilities/date-picker/date-picker.component';
import { AboutYouComponent } from './about-you.component';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
// Services
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { BusinessCertificationService } from 'app/services/business-certification.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { UtilityService } from 'app/services/utility.service';
// Models
import { UiError } from 'app/models/ui-error';
import { AppRoutes } from 'app/models/routes';
import { ERRORS } from 'app/error.codes';
// Validators
import { sinValidator } from './sin.validator';
// Factories
import { applicantFormFactory, addressFormFactory } from 'app/test-stubs/factories/forms';
import { submitApplicantResponseFactory } from 'app/test-stubs/factories/applicant';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { applicantInfoFactory } from 'app/test-stubs/factories/lead';
import { ActivatedRoute } from '@angular/router';
import { ErrorResponse } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';

describe('AboutYouComponent', () => {
  let component: AboutYouComponent;
  let fixture: ComponentFixture<AboutYouComponent>;

  const activatedRoute = {
    snapshot: {
      data: {
        applicantInfo: undefined
      }
    }
  };
  let certificationService: BusinessCertificationService;
  let configService: ConfigurationService;
  let errorService: ErrorService;
  let merchantService: MerchantService;
  let modalService: BsModalService;
  let modalRef: BsModalRef;
  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        ModalModule.forRoot(),
        ReactiveFormsModule,
        BsDatepickerModule.forRoot(),
        RouterTestingModule
      ],
      declarations: [ AboutYouComponent, AddressFormComponent, DatePickerComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute
        },
        BsModalService,
        BsModalRef,
        BusinessCertificationService,
        CookieService,
        ErrorService,
        FormBuilder,
        LoggingService,
        MerchantService,
        UtilityService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    certificationService = TestBed.inject(BusinessCertificationService);
    configService = TestBed.inject(ConfigurationService);
    errorService = TestBed.inject(ErrorService);
    merchantService = TestBed.inject(MerchantService);
    modalRef = TestBed.inject(BsModalRef);
    modalService = TestBed.inject(BsModalService);
    stateRoutingService = TestBed.inject(StateRoutingService);

    spyOn(Bugsnag, 'notify');
    spyOnProperty(merchantService, 'merchantObs', 'get').and.returnValue(new BehaviorSubject(merchantDataFactory.build()));
    spyOnProperty(configService, 'addressAutocompleteEnabled').and.returnValue(true);
    spyOn(stateRoutingService, 'navigate');

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

    fixture = TestBed.createComponent(AboutYouComponent);
    component = fixture.componentInstance;
    activatedRoute.snapshot.data.applicantInfo = undefined;

    fixture.detectChanges(); // TODO [Refactor] -remove-
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('buildApplicantPost', () => {
    it('returns null when applicant and address are null', () => {
      expect(component.buildApplicantPost(null, null, '')).toBeNull();
    });
  });

  describe('ngAfterViewInit()', () => {
    it('should populate form with data from lead if any', fakeAsync(() => {
      const applicantInfo = applicantInfoFactory.build();
      activatedRoute.snapshot.data.applicantInfo = applicantInfo;

      component.ngAfterViewInit();
      tick(100);

      expect(component.applicantFormGroup.value).toEqual({
        first_name: applicantInfo.first_name,
        last_name: applicantInfo.last_name,
        date_of_birth: applicantInfo.date_of_birth,
        phone_number: applicantInfo.phone_number,
        owner_since: applicantInfo.owner_since
      });

      expect(component.addressFormGroup.value).toEqual({
        address_line_1: applicantInfo.address_line_1,
        city: applicantInfo.city,
        state_province: applicantInfo.state_province,
        postal_code: applicantInfo.postal_code
      });
    }));
  });

  describe('next()', () => {
    beforeEach(() => {
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.resolve(submitApplicantResponseFactory.build()));
    });

    it('should submit an applicant when the form values are valid', fakeAsync(() => {
      spyOn(certificationService, 'reauth');
      component.applicantFormGroup.setValue(applicantFormFactory.build());
      component.addressFormGroup.setValue(addressFormFactory.build());

      component.next(null);
      expect(certificationService.submitApplicant).toHaveBeenCalled();
    }));

    it('should not submit an applicant when their date of birth is invalid (is ahead of today)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      component.applicantFormGroup.setValue(applicantFormFactory.build({ date_of_birth: tomorrow }));
      component.addressFormGroup.setValue(addressFormFactory.build());

      const e = new MouseEvent('');
      spyOn(e, 'stopPropagation');
      spyOn(e, 'preventDefault');
      component.next(e);
      expect(certificationService.submitApplicant).not.toHaveBeenCalled();
    });

    it('should not submit an applicant when their date of birth is incorrectly formatted', () => {
      component.applicantFormGroup.setValue(applicantFormFactory.build({ date_of_birth: '1938-11-13' }));
      component.addressFormGroup.setValue(addressFormFactory.build());

      const e = new MouseEvent('');
      spyOn(e, 'stopPropagation');
      spyOn(e, 'preventDefault');
      component.next(e);
      expect(certificationService.submitApplicant).not.toHaveBeenCalled();
    });

    it('does not attempt to submit an applicant when the form is invalid', () => {
      component.applicantFormGroup.setValue(applicantFormFactory.build({ first_name: null }));
      component.addressFormGroup.setValue(addressFormFactory.build());

      const e = new MouseEvent('');
      spyOn(e, 'stopPropagation');
      spyOn(e, 'preventDefault');
      component.next(e);
      expect(certificationService.submitApplicant).not.toHaveBeenCalled();
    });

    it('does not attempt to submit an applicant when in delegated access mode', () => {
      component.applicantFormGroup.setValue(applicantFormFactory.build());
      component.addressFormGroup.setValue(addressFormFactory.build());

      spyOn(component, 'isDelegatedAccessMode').and.returnValue(true);

      component.next(null);
      expect(certificationService.submitApplicant).not.toHaveBeenCalled();
    });

    it('should trigger delegated mode modal if user is in delegated access mode', () => {
      spyOn(component, 'isDelegatedAccessMode').and.returnValue(true);
      spyOn(errorService, 'show');

      component.next(null);

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
    });

    it('should scrollToView on invalid form control', () => {
      component.applicantFormGroup.setValue(applicantFormFactory.build({ first_name: null }));
      component.addressFormGroup.setValue(addressFormFactory.build());

      fixture.detectChanges();
      const firstNameEL = fixture.debugElement.query(By.css('input[formcontrolname="first_name"')).nativeElement;
      spyOn(firstNameEL, 'scrollIntoView');

      component.next(new MouseEvent(null));

      expect(firstNameEL.scrollIntoView).toHaveBeenCalledTimes(1);
    });
  }); // describe - next()

  describe('submitApplicant()', () => {
    it('triggers reauth on success', fakeAsync(() => {
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.resolve(submitApplicantResponseFactory.build()));
      spyOn(certificationService, 'reauth'); // do not actually trigger reauth

      component.submitApplicant('');
      tick();

      expect(certificationService.reauth).toHaveBeenCalledTimes(1);
    }));

    it('should trigger error modal and notify Bugsnag on failure', fakeAsync(() => {
      spyOn(certificationService, 'submitApplicant').and.returnValue((Promise.reject(new ErrorResponse(internalServerErrorFactory.build()))));
      spyOn(errorService, 'show');

      component.submitApplicant('');
      tick();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    }));

    it('should trigger error modal on invalid address', fakeAsync(() => {
      const err: HttpErrorResponse = new HttpErrorResponse({
        status: 422,
        error: { code: ERRORS.API.ADDRESS_ERROR }
      });
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(new ErrorResponse(err)));
      spyOn(errorService, 'show');

      component.submitApplicant('');
      tick();

      const expected_context: ErrorModalContext = new ErrorModalContext(
        'ERROR_MODAL.GENERIC.HEADING',
        [ 'ABOUT_YOU.ERROR', 'ABOUT_YOU.ADDRESS_INVALID_ERROR', 'ERROR_MODAL.GENERIC.BODY_MESSAGE2' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
    }));

    it('should trigger error modal on invalid phone number', fakeAsync(() => {
      const err: HttpErrorResponse = new HttpErrorResponse({
        status: 422,
        error: { code: ERRORS.API.PHONE_NUMBER_ERROR }
      });
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(new ErrorResponse(err)));
      spyOn(errorService, 'show');

      component.submitApplicant('');
      tick();

      const expected_context: ErrorModalContext = new ErrorModalContext(
        'ERROR_MODAL.GENERIC.HEADING',
        [ 'ABOUT_YOU.ERROR', 'ABOUT_YOU.PHONE_NUMBER_INVALID_ERROR', 'ERROR_MODAL.GENERIC.BODY_MESSAGE2' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
    }));

    it('should trigger error modal on invalid phone number', fakeAsync(() => {
      const err: HttpErrorResponse = new HttpErrorResponse({
        status: 422,
        error: { code: ERRORS.API.PHONE_NUMBER_ERROR }
      });
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(new ErrorResponse(err)));
      spyOn(errorService, 'show');

      component.submitApplicant('');
      tick();

      const expected_context: ErrorModalContext = new ErrorModalContext(
        'ERROR_MODAL.GENERIC.HEADING',
        [ 'ABOUT_YOU.ERROR', 'ABOUT_YOU.PHONE_NUMBER_INVALID_ERROR', 'ERROR_MODAL.GENERIC.BODY_MESSAGE2' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
    }));

    it('displays the SIN modal when the applicant query without SIN returns 404 with code 60100', fakeAsync(() => {
      spyOn(modalService, 'show').and.returnValue(modalRef);

      const err: HttpErrorResponse = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { code: 60100 }
      });
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(new ErrorResponse(err)));

      component.submitApplicant('');
      tick();

      expect(modalService.show).toHaveBeenCalledWith(component.sinInputModal);
    }));

    it('does not display the SIN modal + routes to unable_to_be_certified when applicant query fails on 404 with any other code', fakeAsync(() => {
      spyOn(modalService, 'show');

      const err: HttpErrorResponse = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { code: 60101 }
      });
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(new ErrorResponse(err)));

      component.submitApplicant('');
      tick();

      expect(modalService.show).not.toHaveBeenCalled();
      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.onboarding.unable_to_be_certified, true);
    }));

    it('hides SIN modal + routes to unable_to_be_certified when applicant query fails on 404 after SIN flow', fakeAsync(() => {
      component.modalRef = new BsModalRef(); // Mock bootstrap modal
      spyOn(component.modalRef, 'hide');

      const err: HttpErrorResponse = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { code: 60101 }
      });
      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(new ErrorResponse(err)));

      component.submitApplicant('');
      tick();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.unable_to_be_certified, true);
    }));

    it('does not display the SIN modal + displays generic error modal when the applicant query fails for any other reason', fakeAsync(() => {
      spyOn(modalService, 'show');
      spyOn(errorService, 'show');

      spyOn(certificationService, 'submitApplicant').and.returnValue(Promise.reject(internalServerErrorFactory.build()));

      component.submitApplicant('');
      tick();

      expect(modalService.show).not.toHaveBeenCalled();
      expect(errorService.show).toHaveBeenCalledWith(UiError.general);
    }));
  });

  describe('SIN flow', () => {
    beforeEach(() => {
      // Mock SIN form group
      component.sinForm = new FormGroup({
        sin: new FormControl('', [ Validators.required, sinValidator() ])
      });
      spyOn(component, 'submitApplicant').and.callFake(() => undefined);
    });

    it('does not submit applicant while SIN is blank', fakeAsync(() => {
      component.sinForm.setValue({ sin: '' });

      component.onSubmitSin(new MouseEvent('click'));
      tick();

      expect(component.submitApplicant).not.toHaveBeenCalled();
    }));

    it('redirects to not found when the SIN is not entered', fakeAsync(() => {
      component.modalRef = new BsModalRef(); // Mock modal ref so we get less errors.
      spyOn(component.modalRef, 'hide');

      component.sinForm.setValue({ sin: '      ' });
      component.onSubmitSin(new MouseEvent('click'));
      tick();

      expect(component.submitApplicant).not.toHaveBeenCalled();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.unable_to_be_certified, true);
    }));

    it('does not submit applicant while SIN contains incorrect length', fakeAsync(() => {
      component.sinForm.setValue({ sin: '000 000' });

      component.onSubmitSin(new MouseEvent('click'));
      tick();

      expect(component.submitApplicant).not.toHaveBeenCalled();
    }));

    it('does not submit applicant while SIN contains invalid characters', fakeAsync(() => {
      component.sinForm.setValue({ sin: 'ABC DEF GHI' });

      component.onSubmitSin(new MouseEvent('click'));
      tick();

      expect(component.submitApplicant).not.toHaveBeenCalled();
    }));

    it('does not submit applicant while SIN is invalid', fakeAsync(() => {
      component.sinForm.setValue({ sin: '123 456 789' });

      component.onSubmitSin(new MouseEvent('click'));
      tick();

      expect(component.submitApplicant).not.toHaveBeenCalled();
    }));

    it('submits applicant when SIN is valid', fakeAsync(() => {
      component.sinForm.setValue({ sin: '000 000 000' });


      component.onSubmitSin(null);
      tick();

      expect(component.submitApplicant).toHaveBeenCalledTimes(1);
    }));
  });
});
