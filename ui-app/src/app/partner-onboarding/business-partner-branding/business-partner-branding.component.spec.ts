import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';
import { CookieService } from 'ngx-cookie-service';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  BusinessPartnerBrandingComponent,
  DEFAULT_ARIO_LOGO,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR
} from './business-partner-branding.component';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { Merchant } from 'app/models/api-entities/merchant';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { BusinessPartnerBranding } from 'app/models/api-entities/business-partner-branding';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { DevModeService } from 'app/services/dev-mode.service';
import { ErrorService } from 'app/services/error.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { businessPartnerApplicationFactory, businessPartnerBrandingFactory, businessPartnerBrandingResponseFactory, businessPartnerApplicationResponseFactory } from 'app/test-stubs/factories/business-partner';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { applicationConfiguration } from 'app/test-stubs/factories/application-configuration';
import { IMAGE_MIME_TYPES } from 'app/models/mime-types';
import { uploadOutputMock } from 'app/test-stubs/factories/upload-output';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import Bugsnag from '@bugsnag/js';

@Component({
  template: `<div class="partner-logo"></div>`
})
class FakeHeaderComponent {}

describe('BusinessPartnerBrandingComponent', () => {
  let component: BusinessPartnerBrandingComponent;
  let fixture: ComponentFixture<BusinessPartnerBrandingComponent>;

  let businessPartnerService: BusinessPartnerService;
  let devModeService: DevModeService;
  let errorService: ErrorService;
  let loggingService: LoggingService;
  let stateRoutingService: StateRoutingService;

  let headerFixture: ComponentFixture<FakeHeaderComponent>;
  let merchantSpy: jasmine.Spy;
  let addBrandingRequestSpy: jasmine.Spy;
  let getBrandingRequestSpy: jasmine.Spy;
  let editBrandingRequestSpy: jasmine.Spy;
  let applicationSpy: jasmine.Spy;
  let clearThemingSpy: jasmine.Spy;
  let processPartnerBrandingSpy: jasmine.Spy;
  let updateBusinessPartnerBrandingSpy: jasmine.Spy;

  const matchObj = [
    { matchStr: Breakpoints.HandsetPortrait, result: false }
  ];
  const fakeBreakpointObserver = (s: string[]): Observable<BreakpointState> => from(matchObj).pipe(
    filter(match => match.matchStr === s[0]),
    map(match => <BreakpointState>{ matches: match.result, breakpoints: {} })
  );
  const breakpointSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
  breakpointSpy.observe.and.callFake(fakeBreakpointObserver);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerBrandingComponent,
        FakeHeaderComponent
      ],
      imports: [
        ColorPickerModule,
        HttpClientTestingModule,
        ImageCropperModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      providers: [
        {
          provide: BreakpointObserver,
          useValue: breakpointSpy
        },
        BusinessPartnerService,
        ConfigurationService,
        CookieService,
        ErrorService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });

    fixture = TestBed.createComponent(BusinessPartnerBrandingComponent);
    component = fixture.componentInstance;
    stateRoutingService = TestBed.inject(StateRoutingService);

    businessPartnerService = TestBed.inject(BusinessPartnerService);
    devModeService = TestBed.inject(DevModeService);
    loggingService = TestBed.inject(LoggingService);
    errorService = TestBed.inject(ErrorService);

    const configurationService: ConfigurationService = TestBed.inject(ConfigurationService);
    const merchantService: MerchantService = TestBed.inject(MerchantService);

    headerFixture = TestBed.createComponent(FakeHeaderComponent);

    spyOnProperty(configurationService, 'arioDomainSuffix').and.returnValue(applicationConfiguration.ario_domain_suffix);
    merchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

    const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build();
    addBrandingRequestSpy = spyOn(businessPartnerService, 'addBrandingAssets').and.returnValue(of(businessPartnerApplicationResponseFactory.build()));
    applicationSpy = spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
        new BehaviorSubject<BusinessPartnerApplication>(application));
    const branding: BusinessPartnerBranding = businessPartnerBrandingFactory.build();
    getBrandingRequestSpy = spyOn(businessPartnerService, 'getBrandingAssets').and.returnValue(of(businessPartnerBrandingResponseFactory.build()));
    editBrandingRequestSpy = spyOn(businessPartnerService, 'editBrandingAssets').and.returnValue(of(businessPartnerApplicationResponseFactory.build()));
    spyOn(businessPartnerService, 'getBusinessPartnerBranding').and.returnValue(new BehaviorSubject<BusinessPartnerBranding>(branding));
    spyOn(loggingService, 'GTMUpdate');
    spyOn(Bugsnag, 'notify');
    spyOn(stateRoutingService, 'navigate');
    clearThemingSpy = spyOn<any>(component, 'clearTheming').and.callThrough(); // eslint-disable-line
    processPartnerBrandingSpy = spyOn<any>(component, 'processPartnerBranding').and.callThrough(); // eslint-disable-line
    updateBusinessPartnerBrandingSpy = spyOn<any>(component, 'updateBusinessPartnerBranding').and.callThrough(); // eslint-disable-line
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should mark empty form as invalid', () => {
      merchantSpy.and.returnValue(null);
      fixture.detectChanges();

      expect(component.brandingFormGroup.valid).toBeFalsy();
    });

    it('should enforce vanity as a required field', () => {
      fixture.detectChanges();
      const vanityField: AbstractControl = component.brandingFormGroup.controls['vanity'];
      component.brandingFormGroup.setValue({
        vanity: '',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      const errors: ValidationErrors = vanityField.errors;
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce vanity pattern', () => {
      fixture.detectChanges();
      const vanityField: AbstractControl = component.brandingFormGroup.controls['vanity'];
      component.brandingFormGroup.setValue({
        vanity: 'BAD VANITY',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      const errors: ValidationErrors = vanityField.errors;
      expect(errors['pattern']).toBeTruthy();
    });

    it('should display the customized url with enforced vanity pattern', async() => {
      fixture.detectChanges();
      const referenceValue = {
        vanity: 'Vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      };
      component.brandingFormGroup.setValue({
        vanity: 'Vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      fixture.whenStable().then(() => {
        expect(component.brandingFormGroup.controls['vanity'].value).toEqual(referenceValue.vanity);
      });
    });

    it('should enforce vanity without dots', () => {
      fixture.detectChanges();
      const vanityField: AbstractControl = component.brandingFormGroup.controls['vanity'];
      component.brandingFormGroup.setValue({
        vanity: 'bad.one',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      const errors: ValidationErrors = vanityField.errors;
      expect(errors['pattern']).toBeTruthy();
    });

    it('should enforce primary color as a required field', () => {
      fixture.detectChanges();
      const primaryField: AbstractControl = component.brandingFormGroup.controls['primary'];
      component.brandingFormGroup.setValue({
        vanity: 'test',
        primary: '',
        secondary: '#da3831'
      });

      const errors: ValidationErrors = primaryField.errors;
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce primary color pattern', () => {
      fixture.detectChanges();
      const primaryField: AbstractControl = component.brandingFormGroup.controls['primary'];
      component.brandingFormGroup.setValue({
        vanity: 'test',
        primary: '000000',
        secondary: '#da3831'
      });

      const errors: ValidationErrors = primaryField.errors;
      expect(errors['pattern']).toBeTruthy();
    });

    it('should enforce secondary color as a required field', () => {
      fixture.detectChanges();
      const secondaryField: AbstractControl = component.brandingFormGroup.controls['secondary'];
      component.brandingFormGroup.setValue({
        vanity: 'test',
        primary: '#2d3d55',
        secondary: ''
      });

      const errors: ValidationErrors = secondaryField.errors;
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce secondary color pattern', () => {
      fixture.detectChanges();
      const secondaryField: AbstractControl = component.brandingFormGroup.controls['secondary'];
      component.brandingFormGroup.setValue({
        vanity: 'test',
        primary: '#2d3d55',
        secondary: 'ffffff'
      });

      const errors: ValidationErrors = secondaryField.errors;
      expect(errors['pattern']).toBeTruthy();
    });

    it('should have no errors on valid input', () => {
      fixture.detectChanges();
      const vanityField: AbstractControl = component.brandingFormGroup.controls['vanity'];

      const errors: ValidationErrors = vanityField.errors;
      expect(errors).toBeNull();
      expect(component.brandingFormGroup.valid).toBeTruthy();
    });

    it('should have no errors on valid input with enhanced branding', () => {
      fixture.detectChanges();
      component.brandingFormGroup.setValue({
        vanity: 'test',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      expect(component.brandingFormGroup.valid).toBeTruthy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });

    it('should remove on theming', () => {
      fixture.detectChanges();
      headerFixture.detectChanges();

      // trigger color changes.
      component.onPrimaryColorChanged('#2d3d55');
      component.onSecondaryColorChanged('#da3831');

      // create a cropped image
      const bgImageUrl = 'data:image/png;base64,base64TestString==';
      const event: ImageCroppedEvent = {
        base64: bgImageUrl,
        cropperPosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        height: 52,
        imagePosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        width: 200
      };
      component.imageCropped(event);

      const partner_logo: HTMLElement = document.body.querySelector('.partner-logo');

      // check that they are there.
      expect(partner_logo.style.getPropertyValue('background-image')).toBe(`url("${bgImageUrl}")`);
      expect(document.body.style.getPropertyValue('--primary')).toBe('#2d3d55');
      expect(document.body.style.getPropertyValue('--accent')).toBe('#da3831');

      // destroy, which should clear styling
      component.ngOnDestroy();

      // check that they are not.
      expect(partner_logo.style.getPropertyValue('background-image')).toBe('');
      expect(document.body.style.getPropertyValue('--primary')).toBe('');
      expect(document.body.style.getPropertyValue('--accent')).toBe('');
    });
  });

  describe('ngOnInit()', () => {
    it('should set the value of the vanity field to the current merchant DBA (lowercase) by default', () => {
      const merchant: Merchant = merchantDataFactory.build({ doing_business_as: 'TEST MERCHANT' });
      merchantSpy.and.returnValue(merchant);
      fixture.detectChanges();

      expect(component.brandingFormGroup.controls['vanity'].value).toEqual(merchant.doing_business_as.toLowerCase().replace(' ', ''));
    });

    it('should display error if default DBA contains invalid characters', () => {
      const merchant: Merchant = merchantDataFactory.build({ doing_business_as: 'TEST/MERCHANT' });
      merchantSpy.and.returnValue(merchant);
      component.ngOnInit();

      fixture.detectChanges();
      expect(component.brandingFormGroup.controls['vanity'].value).toEqual(merchant.doing_business_as.toLowerCase());
      const errors: ValidationErrors = component.brandingFormGroup.controls['vanity'].errors;
      expect(errors['pattern']).toBeTruthy();
    });

    it('should set the value of the vanity field to the current merchant name (lowercase) if no DBA by default', () => {
      const merchant: Merchant = merchantDataFactory.build({ doing_business_as: '' });
      merchantSpy.and.returnValue(merchant);
      fixture.detectChanges();

      const expectedVanity = merchant.name.toLowerCase().replace(/[ .]/g, '');
      expect(component.brandingFormGroup.controls['vanity'].value).toEqual(expectedVanity);
    });

    it('should strip whitespaces when setting the default vanity value', () => {
      const merchant: Merchant = merchantDataFactory.build({ name: 'ACME', doing_business_as: '' });
      const merchantName: string = merchant.name;
      merchant.name = ' ' + merchant.name + '   ' + merchant.name + '  ';
      merchantSpy.and.returnValue(merchant);
      fixture.detectChanges();

      const expectedValue = merchantName.toLowerCase() + merchantName.toLowerCase();
      expect(component.brandingFormGroup.controls['vanity'].value).toEqual(expectedValue);
    });

    it('should strip periods when setting the default vanity value', () => {
      const merchant: Merchant = merchantDataFactory.build({ name: 'ACME', doing_business_as: '' });
      const merchantName: string = merchant.name;
      merchant.name = '.' + merchant.name + '.' + merchant.name;
      merchantSpy.and.returnValue(merchant);
      fixture.detectChanges();

      const expectedValue = merchantName.toLowerCase() + merchantName.toLowerCase();
      expect(component.brandingFormGroup.controls['vanity'].value).toEqual(expectedValue);
    });

    it('should set the value of the vanity field to empty string if no current merchant', () => {
      merchantSpy.and.returnValue(null);
      fixture.detectChanges();

      expect(component.brandingFormGroup.controls['vanity'].value).toEqual('');
    });

    it('should set the default values for primary and secondary colours on init', () => {
      fixture.detectChanges();

      expect(component.brandingFormGroup.controls['primary'].value).toEqual(DEFAULT_PRIMARY_COLOR);
      expect(component.brandingFormGroup.controls['secondary'].value).toEqual(DEFAULT_SECONDARY_COLOR);
    });

    it('should set the default options for the image uploader', () => {
      const expectedOptions: CustomUploaderOptions = {
        autoUpload: false,
        destination: UploadedDocumentDestination.ZETATANGO,
        documentType: DocumentCode.other_by_merchant,
        messageSupport: false,
        requireDocumentType: false,
        uploader: {
          allowedContentTypes: IMAGE_MIME_TYPES,
          concurrency: 1,
          maxUploads: 1
        }
      };
      fixture.detectChanges();

      expect(component.uploadOptions).toEqual(expectedOptions);
    });


    it('should not redirect to agreement component if partner theme not created', () => {

      fixture.detectChanges();

      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should not redirect to agreement component if enhanced branding is not enabled', () => {
      fixture.detectChanges();

      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should retrieve partner theme if partner theme already created',() => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      const branding: BusinessPartnerBranding = businessPartnerBrandingFactory.build();
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));

      fixture.detectChanges();

      expect(businessPartnerService.getBrandingAssets).toHaveBeenCalledTimes(1);
      expect(component.businessPartnerBranding).toEqual(branding);
    });

    it('should populate partner theme fields if partner theme already created', () => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      const branding: BusinessPartnerBranding = businessPartnerBrandingFactory.build();
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));

      fixture.detectChanges();

      expect(component.brandingFormGroup.controls['vanity'].value).toEqual(branding.vanity);
      expect(component.brandingFormGroup.controls['primary'].value).toEqual(branding.primary_colour);
      expect(component.brandingFormGroup.controls['secondary'].value).toEqual(branding.secondary_colour);
      const partner_logo: HTMLElement = document.body.querySelector('.partner-logo');
      expect(partner_logo.style.getPropertyValue('background-image')).toBe(`url("${branding.logo}")`);
    });

    it('should show error if theme already created but could not retrieved', () => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));
      const expectedError = new HttpErrorResponse({ status: 500, error: { message: 'some error' } });
      getBrandingRequestSpy.and.returnValue(throwError(expectedError));
      spyOn(errorService, 'show');

      fixture.detectChanges();

      expect(businessPartnerService.getBrandingAssets).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledTimes(1);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('back()', () => {
    it('should navigate to business partner landing on back', () => {
      component.back();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_landing, true);
    });

    it('should remove all theming on back()', () => {
      fixture.detectChanges();
      headerFixture.detectChanges();

      // trigger color changes.
      component.onPrimaryColorChanged('#2d3d55');
      component.onSecondaryColorChanged('#da3831');

      // create a cropped image
      const bgImageUrl = 'data:image/png;base64,base64TestString==';
      const event: ImageCroppedEvent = {
        base64: bgImageUrl,
        cropperPosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        height: 52,
        imagePosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        width: 200
      };
      component.imageCropped(event);

      const partner_logo: HTMLElement = document.body.querySelector('.partner-logo');

      // check that they are there.
      expect(partner_logo.style.getPropertyValue('background-image')).toBe(`url("${bgImageUrl}")`);
      expect(document.body.style.getPropertyValue('--primary')).toBe('#2d3d55');
      expect(document.body.style.getPropertyValue('--accent')).toBe('#da3831');

      // navigate away, which should clear styling
      component.back();

      // check that they are not.
      expect(partner_logo.style.getPropertyValue('background-image')).toBe('');
      expect(document.body.style.getPropertyValue('--primary')).toBe('');
      expect(document.body.style.getPropertyValue('--accent')).toBe('');
    });
  });

  describe('next()', () => {
    it('should call GTMUpdate in logging service', () => {
      fixture.detectChanges();
      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Create Business Partner Theme');
    });

    it('should remove all theming on next()', () => {
      fixture.detectChanges();
      headerFixture.detectChanges();

      // trigger color changes.
      component.onPrimaryColorChanged('#2d3d55');
      component.onSecondaryColorChanged('#da3831');

      // create a cropped image
      const event: ImageCroppedEvent = {
        base64: 'data:image/png;base64,base64TestString==',
        cropperPosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        height: 52,
        imagePosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        width: 200
      };
      component.imageCropped(event);

      // navigate away, which should clear styling
      component.next();

      const partner_logo: HTMLElement = document.body.querySelector('.partner-logo');
      expect(partner_logo.style.getPropertyValue('background-image')).toBe('');
      expect(document.body.style.getPropertyValue('--primary')).toBe('');
      expect(document.body.style.getPropertyValue('--accent')).toBe('');
    });

    it('should call addBrandingAssets and proceed to agreement if partner theme is not created yet', () => {
      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(businessPartnerService.addBrandingAssets).toHaveBeenCalled();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_agreement, true);
    });

    it('should not call addBrandingAssets if working is true', () => {
      spyOnProperty(component, 'working').and.returnValue(true);

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(businessPartnerService.addBrandingAssets).not.toHaveBeenCalled();
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should display an error dialog if addBrandingAssets returns an error due to invalid vanity', () => {
      addBrandingRequestSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 400, error: { message: 'vanity is invalid' } })));
      spyOn(errorService, 'show');

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.businessPartnerVanityInvalidError);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should display an error dialog if addBrandingAssets returns an error other than invalid vanity', () => {
      const expectedError = new HttpErrorResponse({ status: 422, error: { message: 'Attempt to upload logo for merchant m_123 failed' } });
      addBrandingRequestSpy.and.returnValue(throwError(expectedError));
      spyOn(errorService, 'show');

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.newBusinessPartnerError);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should call editBrandingAssets and proceed to agreement if partner theme already exist',() => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(businessPartnerService.editBrandingAssets).toHaveBeenCalled();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_agreement, true);
    });

    it('should not call editBrandingAssets if working is true',() => {
      spyOnProperty(component, 'working').and.returnValue(true);
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(businessPartnerService.editBrandingAssets).not.toHaveBeenCalled();
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should display an error if editBrandingAssets returns an error due to invalid vanity', () => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));
      editBrandingRequestSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 400, error: { message: 'vanity is invalid' } })));
      spyOn(errorService, 'show');

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.businessPartnerVanityInvalidError);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should display an error if editBrandingAssets returns an error other than invalid vanity', () => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      applicationSpy.and.returnValue(new BehaviorSubject<BusinessPartnerApplication>(application));
      const expectedError = new HttpErrorResponse({ status: 422, error: { message: 'Attempt to upload logo for merchant m_123 failed' } });
      editBrandingRequestSpy.and.returnValue(throwError(expectedError));
      spyOn(errorService, 'show');

      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.newBusinessPartnerError);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should process next() logic if working is false', () => {
      spyOnProperty(component, 'working').and.returnValue(false);
      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(clearThemingSpy).toHaveBeenCalledTimes(1);
      expect(processPartnerBrandingSpy).toHaveBeenCalledTimes(1);
      expect(updateBusinessPartnerBrandingSpy).toHaveBeenCalledTimes(1);
    });

    it('should not process next() logic if working is true', () => {
      spyOnProperty(component, 'working').and.returnValue(true);
      fixture.detectChanges();

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.next();

      expect(clearThemingSpy).not.toHaveBeenCalled();
      expect(processPartnerBrandingSpy).not.toHaveBeenCalled();
      expect(updateBusinessPartnerBrandingSpy).not.toHaveBeenCalled();
    });
  });

  describe('skip()', () => {
    it('should call GTMUpdate in logging service', () => {
      fixture.detectChanges();

      component.skip();

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Skip Customize Business Partner Theme');
    });

    it('should reset all theming variables to defaults on skip', () => {
      fixture.detectChanges();
      spyOn(component, 'next');

      component.brandingFormGroup.setValue({
        vanity: 'vanity',
        primary: '#2d3d55',
        secondary: '#da3831'
      });

      component.skip();

      expect(component.croppedImage).toEqual(DEFAULT_ARIO_LOGO);
      expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);
      expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);
    });

    it('should remove all theming on skip()', () => {
      fixture.detectChanges();
      headerFixture.detectChanges();

      // Navigate away, which should clear styling
      component.skip();

      const partner_logo: HTMLElement = document.body.querySelector('.partner-logo');
      expect(partner_logo.style.getPropertyValue('background-image')).toBe('');
      expect(document.body.style.getPropertyValue('--primary')).toBe('');
      expect(document.body.style.getPropertyValue('--accent')).toBe('');
    });

    it('should not process skip() logic if working is true', () => {
        spyOnProperty(component, 'working').and.returnValue(true);
        fixture.detectChanges();

        component.skip();

        expect(clearThemingSpy).not.toHaveBeenCalled();
        expect(processPartnerBrandingSpy).not.toHaveBeenCalled();
        expect(updateBusinessPartnerBrandingSpy).not.toHaveBeenCalled();
    });

    it('should proceed to the agreement component on success', () => {
      const application: BusinessPartnerApplication = businessPartnerApplicationFactory.build();
      const applicationWithPartnerTheme: BusinessPartnerApplication = businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' });
      const applicationBehaviorSubject = new BehaviorSubject<BusinessPartnerApplication>(application);
      applicationSpy.and.returnValue(applicationBehaviorSubject);

      fixture.detectChanges();
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();

      applicationBehaviorSubject.next(applicationWithPartnerTheme);
      component.skip();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_agreement, true);
    });
  });

  describe('arioDomain', () => {
    it('should return value from configuration service', () => {
      expect(component.arioDomain()).toEqual(applicationConfiguration.ario_domain_suffix);
    });
  });

  describe('vanityScheme', () => {
    it('should return `http://` if dev mode', () => {
      expect(component.vanityScheme()).toEqual('HTTP');
    });

    it('should return `https://` if not dev mode', () => {
      spyOn(devModeService, 'isDevMode').and.returnValue(false);
      expect(component.vanityScheme()).toEqual('HTTPS');
    });
  });

  describe('onPrimaryColorChanged', () => {
    describe('enhanced branding enabled', () => {
      it('should set the primary colour if enhanced branding is enabled', () => {
        fixture.detectChanges();
        component.onPrimaryColorChanged('#2d3d55');

        expect(component.brandingFormGroup.controls['primary'].value).toEqual('#2d3d55');
        expect(component.primaryColor).toEqual('#2d3d55');
        expect(document.body.style.getPropertyValue('--primary')).toBe('#2d3d55');
      });

      it('should not set the primary colour if hex value is invalid.', () => {
        fixture.detectChanges();
        spyOn(component.brandingFormGroup.controls['primary'], 'setValue');
        // no #
        component.onPrimaryColorChanged('FFFFFF');
        expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);

        // invalid hex
        component.onPrimaryColorChanged('!23%I*');
        expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);

        // blank
        component.onPrimaryColorChanged('');
        expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);

        // number
        component.onPrimaryColorChanged('0o0');
        expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);

        component.onPrimaryColorChanged(null);
        expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);

        component.onPrimaryColorChanged(undefined);
        expect(component.primaryColor).toEqual(DEFAULT_PRIMARY_COLOR);
      });
    });
  });

  describe('onSecondaryColorChanged', () => {
    describe('enhanced branding enabled', () => {
      it('should set the secondary colour', () => {
        fixture.detectChanges();
        component.onSecondaryColorChanged('#da3831');

        expect(component.brandingFormGroup.controls['secondary'].value).toEqual('#da3831');
        expect(component.secondaryColor).toEqual('#da3831');
        expect(document.body.style.getPropertyValue('--accent')).toBe('#da3831');
      });

      it('should not set the secondary colour if a valid hex value is not used.', () => {
        fixture.detectChanges();
        spyOn(component.brandingFormGroup.controls['secondary'], 'setValue');

        // no #
        component.onSecondaryColorChanged('FFFFFF');
        expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);

        // invalid hex
        component.onSecondaryColorChanged('!23%I*');
        expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);

        // blank
        component.onSecondaryColorChanged('');
        expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);

        // number
        component.onSecondaryColorChanged('0o0');
        expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);

        component.onSecondaryColorChanged(null);
        expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);

        component.onSecondaryColorChanged(undefined);
        expect(component.secondaryColor).toEqual(DEFAULT_SECONDARY_COLOR);
      });
    });

    it('should block progress by invalidating the accent colour if it is too light', () => {
      fixture.detectChanges();
      spyOn(component.brandingFormGroup.controls['secondary'], 'setValue');
      component.onSecondaryColorChanged('#ffffff');

      expect(component.validSecondaryColor).toEqual(false);
    });
  });

  describe('onFileChangedEvent', () => {
    it('should set the imageFile', () => {
      const file: File = uploadOutputMock.file.nativeFile;
      component.onFileChangedEvent(file);

      expect(component.imageFile).toEqual(file);
    });

    it('should reset cropped image if null file is received', () => {
      component.onFileChangedEvent(null);

      expect(component.imageFile).toBeNull();
      expect(component.croppedImage).toBeNull();
    });
  });

  describe('imageLoaded', () => {
    it('should set showCropper to true', () => {
      expect(component.showCropper).toBeFalsy();
      component.imageLoaded();

      expect(component.showCropper).toBeTruthy();
    });
  });

  describe('imageCropped', () => {
    it('should set logo preview image', () => {
      fixture.detectChanges();
      headerFixture.detectChanges();

      const event: ImageCroppedEvent = {
        base64: 'data:image/png;base64,base64TestString==',
        cropperPosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        height: 52,
        imagePosition: { x1: 0, y1: 0, x2: 200, y2: 150 },
        width: 200
      };
      component.imageCropped(event);

      const partner_logo: HTMLElement = document.body.querySelector('.partner-logo');
      expect(partner_logo.style.getPropertyValue('background-image')).toBe(`url("${event.base64}")`);
    });
  });

  describe('loadImageFailed', () => {
    it('should set showCropper to false and clear croppedImage', () => {
      component.showCropper = true;
      component.croppedImage = 'base64TestString';

      component.loadImageFailed();

      expect(component.showCropper).toBeFalsy();
      expect(component.croppedImage).toBeNull();
    });
  });
});
