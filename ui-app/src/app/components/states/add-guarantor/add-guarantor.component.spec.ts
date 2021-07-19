import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { AddGuarantorComponent } from 'app/components/states/add-guarantor/add-guarantor.component';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { DatePickerComponent } from 'app/components/utilities/date-picker/date-picker.component';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { GuarantorService } from 'app/services/guarantor.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { addressFormValid } from 'app/test-stubs/factories/forms';
import { guarantorFactory, guarantorCreatedResponse } from 'app/test-stubs/factories/guarantor';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { lendingApplicationFactory } from 'app/test-stubs/factories/lending-application';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import Bugsnag from '@bugsnag/js';

describe('AddGuarantorComponent', () => {
  const TEST_STORAGE_KEY = 'guarantor_test';
  const guarantorFormValid = guarantorFactory.build();
  const lendingApplication = lendingApplicationFactory.build();
  const guarantorCreated = guarantorCreatedResponse.build();
  let component: AddGuarantorComponent;
  let fixture: ComponentFixture<AddGuarantorComponent>;
  let stateRoutingService: StateRoutingService;
  let lendingApplicationsService: LendingApplicationsService;
  let guarantorService: GuarantorService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        BsDatepickerModule.forRoot(),
        RouterTestingModule
      ],
      providers: [
        CookieService,
        ErrorService,
        GuarantorService,
        LoggingService,
        UtilityService,
        {
          provide: MerchantService,
          useValue: {
            getMerchant: () => ({id: TEST_STORAGE_KEY})
          }
        },
        StateRoutingService
      ],
      declarations: [AddGuarantorComponent, AddressFormComponent, DatePickerComponent],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    stateRoutingService = TestBed.inject(StateRoutingService);
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    guarantorService = TestBed.inject(GuarantorService);

    spyOn(stateRoutingService, 'navigate');
    spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(lendingApplication));

    fixture = TestBed.createComponent(AddGuarantorComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the form with empty fields when no data is available in storage', () => {
    const formValues = {...component.guarantorFormGroup.value, ...component.addressFormComponent.addressFormGroup.value};

    component.ngAfterViewInit();

    for (const formValue of Object.values(formValues)) {
      expect(formValue).toBe('');
    }
  });

  it('should populate the form with data from local storage when available', fakeAsync(() => {
    spyOn(localStorage, 'getItem').and.returnValue(
      'eyJmaXJzdF9uYW1lIjoiR2VvcmdlIiwibGFzdF9uYW1lIjoiR3VhcmFudG9yIiwiZGF0ZV9vZl9' +
      'iaXJ0aCI6IjAxLTAyLTE5ODUiLCJwaG9uZV9udW1iZXIiOiIoNTE0KSA1NTUtNTU1NSIsImVtYWlsIjo' +
      'iZ2VvcmdlQGd1YXJhbnRvci5jb20iLCJyZWxhdGlvbnNoaXAiOiJhY3F1YWludGFuY2UiLCJhZGRyZXN' +
      'zX2xpbmVfMSI6IjEwIGF2ZSBTdHJlZXQiLCJjaXR5IjoiVE9ST05UTyIsInN0YXRlX3Byb3ZpbmNlIjo' +
      'iT04iLCJwb3N0YWxfY29kZSI6IkgwSDBIMCJ9'
    );

    component.ngAfterViewInit();
    tick();

    expect(component.guarantorFormGroup.controls['first_name'].value).toBe(guarantorFormValid.first_name);
    expect(component.guarantorFormGroup.controls['last_name'].value).toBe(guarantorFormValid.last_name);
    expect(component.guarantorFormGroup.controls['date_of_birth'].value).toEqual(guarantorFormValid.date_of_birth);
    expect(component.guarantorFormGroup.controls['phone_number'].value).toBe(guarantorFormValid.phone_number);
    expect(component.guarantorFormGroup.controls['email'].value).toBe(guarantorFormValid.email);
    expect(component.guarantorFormGroup.controls['relationship'].value).toBe(guarantorFormValid.relationship);
    expect(component.addressFormComponent.addressFormGroup.controls['address_line_1'].value).toBe(addressFormValid.address_line_1);
    expect(component.addressFormComponent.addressFormGroup.controls['city'].value).toBe(addressFormValid.city);
    expect(component.addressFormComponent.addressFormGroup.controls['state_province'].value).toBe(addressFormValid.state_province);
    expect(component.addressFormComponent.addressFormGroup.controls['postal_code'].value).toBe(addressFormValid.postal_code);
  }));

  it('should successfully submit the guarantor when the form is valid', fakeAsync(() => {
    const guarantorServiceSpy = spyOn(guarantorService, 'addGuarantor').and.returnValue(of(guarantorCreated));

    component.guarantorFormGroup.setValue(guarantorFormValid);
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    component.next();
    tick();

    expect(guarantorServiceSpy).toHaveBeenCalledTimes(1);
  }));

  it('should remove form values from localStorage on success', fakeAsync(() => {
    spyOn(guarantorService, 'addGuarantor').and.returnValue(of(guarantorCreated));
    const localStorageSpy = spyOn(localStorage, 'removeItem').and.callThrough();

    component.guarantorFormGroup.setValue(guarantorFormValid);
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    component.next();
    tick();

    expect(localStorageSpy).toHaveBeenCalledWith(TEST_STORAGE_KEY);
  }));

  it('should trigger a refresh of the lending application on success', fakeAsync(() => {
    const lendingAppServiceSpy = spyOn(lendingApplicationsService, 'loadApplication').and.returnValue(of(null));
    spyOn(guarantorService, 'addGuarantor').and.returnValue(of(guarantorCreated));
    spyOn(localStorage, 'removeItem').and.callThrough();

    component.guarantorFormGroup.setValue(guarantorFormValid);
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    component.next();
    tick();

    expect(lendingAppServiceSpy).toHaveBeenCalledTimes(1);
  }));

  it('should continue with the lending application flow on success', fakeAsync(() => {
    spyOn(lendingApplicationsService, 'loadApplication').and.returnValue(of(null));
    spyOn(guarantorService, 'addGuarantor').and.returnValue(of(guarantorCreated));
    spyOn(localStorage, 'removeItem').and.callThrough();

    component.guarantorFormGroup.setValue(guarantorFormValid);
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    component.next();
    tick();

    expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.approval_prerequisites, true);
  }));

  it('should not submit guarantor info when the form is invalid', fakeAsync(() => {
    const guarantorServiceSpy = spyOn(guarantorService, 'addGuarantor');

    component.guarantorFormGroup.setValue(guarantorFactory.build({first_name: ''}));
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    component.next();
    tick();

    expect(guarantorServiceSpy).not.toHaveBeenCalled();
  }));

  it('should scrollIntoView on invalid form control', waitForAsync(async () => {
    component.guarantorFormGroup.setValue(guarantorFactory.build({first_name: ''}));
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    fixture.detectChanges();
    await fixture.whenStable();

    const firstNameEL = fixture.debugElement.query(By.css('input[formcontrolname="first_name"')).nativeElement;
    spyOn(firstNameEL, 'scrollIntoView');

    component.next();

    expect(firstNameEL.scrollIntoView).toHaveBeenCalledTimes(1);
  }));

  it('should trigger error modal on failure', fakeAsync(() => {
    const errorService = TestBed.inject(ErrorService);
    const addGuarantorSpy = spyOn(guarantorService, 'addGuarantor');
    const errorServiceSpy = spyOn(errorService, 'show');
    const notifyBugsnagSpy = spyOn(Bugsnag, 'notify');
    const errors: any[] = [null, {}, internalServerErrorFactory.build()]; // eslint-disable-line
    errors.forEach(error => {
      addGuarantorSpy.and.returnValue(throwError(error));

      component.guarantorFormGroup.setValue(guarantorFormValid);
      component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

      component.next();
      tick();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorServiceSpy).toHaveBeenCalledOnceWith(UiError.postApplicationGuarantor);
      errorServiceSpy.calls.reset();
      notifyBugsnagSpy.calls.reset();
    });
  }));

  it('should reset the form submission flag on failure', fakeAsync(() => {
    spyOn(guarantorService, 'addGuarantor').and.returnValue(throwError('test error'));

    component.guarantorFormGroup.setValue(guarantorFormValid);
    component.addressFormComponent.addressFormGroup.setValue(addressFormValid);

    component.next();
    tick();

    expect(component.submittingGuarantor).toBe(false);
  }));
});
