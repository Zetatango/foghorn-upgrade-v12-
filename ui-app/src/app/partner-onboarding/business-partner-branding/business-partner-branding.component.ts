import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerBranding } from 'app/models/api-entities/business-partner-branding';
import { BusinessPartnerBrandingRequestParams } from 'app/models/api-entities/business-partner-branding-request-params';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { Merchant } from 'app/models/api-entities/merchant';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { DevModeService } from 'app/services/dev-mode.service';
import { ErrorService } from 'app/services/error.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { IMAGE_MIME_TYPES } from 'app/models/mime-types';
import { AppRoutes } from 'app/models/routes';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from "app/models/error-response";
import Bugsnag from '@bugsnag/js';

declare const tinycolor;

export const DEFAULT_ARIO_LOGO = 'data:image/png;base64,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';
export const DEFAULT_PRIMARY_COLOR = '#862890';
export const DEFAULT_SECONDARY_COLOR = '#862890';
export const SECONDARY_COLOR_LIGHTNESS_LIMIT = 170;

export const COLOUR_PICKER_POSITION_BOTTOM = 'bottom';
export const COLOUR_PICKER_POSITION_BOTTOM_LEFT = 'bottom-left';
export const COLOUR_PICKER_POSITION_TOP = 'top';
export const COLOUR_PICKER_POSITION_TOP_LEFT = 'top-left';

@Component({
  selector: 'ztt-business-partner-branding',
  templateUrl: './business-partner-branding.component.html'
})
export class BusinessPartnerBrandingComponent implements OnDestroy, OnInit {
  croppedImage: string;

  private _brandingFormGroup: FormGroup;
  private _primaryColor = DEFAULT_PRIMARY_COLOR;
  private _secondaryColor = DEFAULT_SECONDARY_COLOR;
  private _validSecondaryColor = true;
  private _uploadOptions: CustomUploaderOptions;
  private _imageFile: File = null;
  private _showCropper = false;
  private _secondaryPickerColorPosition: string;
  private _secondaryPickerPosition: string;
  private _businessPartnerApplication: BusinessPartnerApplication;
  private _businessPartnerBranding: BusinessPartnerBranding;
  unsubscribe$ = new Subject<void>();
  private _working = false;
  private _themeExists = false;

  @ViewChild(ImageCropperComponent, { static: true }) imageCropper: ImageCropperComponent;

  constructor(private breakpointObserver: BreakpointObserver,
              private businessPartnerService: BusinessPartnerService,
              private configurationService: ConfigurationService,
              private devModeService: DevModeService,
              private errorService: ErrorService,
              private fb: FormBuilder,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private stateRoutingService: StateRoutingService) {}

  ngOnDestroy(): void {
    this.clearTheming();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.brandingFormGroup = this.fb.group({
      vanity: [null, Validators.required],
      primary: [null, Validators.required],
      secondary: [null, Validators.required]
    });

    this.brandingFormGroup.controls['vanity'].setValue(this.getVanityRecommendation());
    this.brandingFormGroup.controls['primary'].setValue(this.primaryColor);
    this.brandingFormGroup.controls['secondary'].setValue(this.secondaryColor);

    this.setBusinessPartnerApplicationSubscription();

    this.uploadOptions = {
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
  }

  back(): void {
    this.clearTheming();
    this.stateRoutingService.navigate(AppRoutes.partner_onboarding.business_partner_landing, true);
  }

  next(): void {
    // avoid spamming of button.
    if (this.working) { return; }

    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Create Business Partner Theme');

    this.clearTheming();
    this.processPartnerBranding();
  }

  skip(): void {
    // avoid spamming of button.
    if (this.working) { return; }

    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Skip Customize Business Partner Theme');

    this.clearTheming(true);
    this.processPartnerBranding();
  }

  // check to see if the currently loaded theme is using the default Ario logo, and if not are they using both default ario colours.
  usingDefaults(): boolean {
    const backgroundImageUrl = this.partnerLogo.style.getPropertyValue('background-image');

    return backgroundImageUrl === `url("${DEFAULT_ARIO_LOGO}")` ||
      (this.primaryColor === DEFAULT_PRIMARY_COLOR && this.secondaryColor === DEFAULT_SECONDARY_COLOR);
  }

  arioDomain(): string {
    return this.configurationService.arioDomainSuffix;
  }

  vanityScheme(): string {
    return this.devModeService.isDevMode() ? 'HTTP' : 'HTTPS';
  }

  onPrimaryColorChanged(color: string): void {
    if (this.isHex(color)) {
      this.primaryColor = color;
      this.brandingFormGroup.controls['primary'].setValue(this.primaryColor);
      this.updateCssVariable('--primary', this.primaryColor);
    }
  }

  onSecondaryColorChanged(color: string): void {
    if (this.isHex(color)) {
      this.secondaryColor = color;
      this.brandingFormGroup.controls['secondary'].setValue(this.secondaryColor);
      this.updateCssVariable('--accent', this.secondaryColor);
      // check to see if the color is too bright for visibility.
      this.validSecondaryColor = tinycolor(this.secondaryColor).getBrightness() <= SECONDARY_COLOR_LIGHTNESS_LIMIT;
    }
  }

  onFileChangedEvent(file: File): void {
    this.imageFile = file;
    if (!file) {
      this.croppedImage = null;
    }
  }

  imageLoaded(): void {
    this.showCropper = true;
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImage = event.base64;
    this.logoPreviewImage(this.croppedImage);
  }

  loadImageFailed(): void {
    this.croppedImage = null;
    this.showCropper = false;
  }

  private isHex(val: string): boolean {
    return /#[0-9a-f]{6}/gi.test(val);
  }

  private getVanityRecommendation(): string {
    let recommendation = '';

    if (this.merchant && this.merchantName) {
      recommendation = this.merchantName;
      recommendation = recommendation.toLowerCase();
      recommendation = recommendation.replace(/\s+/g, '');
      recommendation = recommendation.replace(/\./g, '');
    }

    return recommendation;
  }

  // update the variables on body, to dynamically style page.
  private updateCssVariable(key: string, value: string): void {
    document.body.style.setProperty(key, value);
  }

  // set the background image style on the partner logo for preview.
  private logoPreviewImage(img_encode: string): void {
    this.partnerLogo.style.setProperty('background-image', `url(${img_encode})`);
  }

  // remove all theming.
  private clearTheming(resetToDefaults = false): void {
    if (resetToDefaults) {
      this.croppedImage = DEFAULT_ARIO_LOGO;
      this.logoPreviewImage(this.croppedImage);
      this.primaryColor = DEFAULT_PRIMARY_COLOR;
      this.onPrimaryColorChanged(this.primaryColor);
      this.secondaryColor = DEFAULT_SECONDARY_COLOR;
      this.onSecondaryColorChanged(this.secondaryColor);
    }

    this.partnerLogo.style.removeProperty('background-image');

    document.body.style.removeProperty('--primary');
    document.body.style.removeProperty('--accent');
  }

  private processPartnerBranding(): void {
    if (this._themeExists) {
      this.updateBusinessPartnerBranding('edit');
    } else {
      this.updateBusinessPartnerBranding('create');
    }
  }

  private updateBusinessPartnerBranding(action: 'create' | 'edit'): void {
    this.working = true;
    const params: BusinessPartnerBrandingRequestParams = {
      // if this.croppedImage has not been updated, it will be null, and will not updated in the PUT.
      logo: this.croppedImage,
      primary_color: this.primaryColor,
      secondary_color: this.secondaryColor,
      vanity: this.brandingFormGroup.controls['vanity'].value.toString().trim().toLowerCase()
    };
    // Determine which function to call
    let actionObservable: Observable<ZttResponse<BusinessPartnerApplication>>;
    if (action === 'create') {
      actionObservable = this.businessPartnerService.addBrandingAssets(this.merchant.id, params);
    } else {
      actionObservable = this.businessPartnerService.editBrandingAssets(this.merchant.id, params);
    }

    actionObservable.pipe(takeUntil(this.unsubscribe$)).subscribe(
      () => {
        this.goToAgreement();
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);

        this.working = false;
        if (e.error.message === 'vanity is invalid') {
          this.errorService.show(UiError.businessPartnerVanityInvalidError);
        } else {
          this.errorService.show(UiError.newBusinessPartnerError);
        }
      }
    );
  }

  private getBusinessPartnerBranding(): void {
    this.businessPartnerService.getBrandingAssets(this.merchant.id).pipe(takeUntil(this.unsubscribe$)).subscribe(
      () => {
        this.setBusinessPartnerBranding();
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);

        this.errorService.show(UiError.newBusinessPartnerError);
      });
  }

  private setBusinessPartnerBranding(): void {
    this.businessPartnerService.getBusinessPartnerBranding()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((businessPartnerBranding: BusinessPartnerBranding) => {
        this._themeExists = true;
        this._businessPartnerBranding = businessPartnerBranding;

        this.brandingFormGroup.controls['vanity'].setValue(this._businessPartnerBranding.vanity);
        this.onPrimaryColorChanged(this._businessPartnerBranding.primary_colour);
        this.onSecondaryColorChanged(this._businessPartnerBranding.secondary_colour);
        this.logoPreviewImage(this._businessPartnerBranding.logo);
      });
  }

  private setBusinessPartnerApplicationSubscription(): void {
    this.businessPartnerService.getBusinessPartnerApplication()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((businessPartnerApplication: BusinessPartnerApplication) => {
        this.businessPartnerApplication = businessPartnerApplication;

        if (this.businessPartnerApplication.partner_theme_id) {
          this.getBusinessPartnerBranding();
        }
      });
  }

  private goToAgreement(): void {
    this.stateRoutingService.navigate(AppRoutes.partner_onboarding.business_partner_agreement, true);
  }

  get brandingFormGroup(): FormGroup {
    return this._brandingFormGroup;
  }

  set brandingFormGroup(value: FormGroup) {
    this._brandingFormGroup = value;
  }

  get primaryColor(): string {
    return this._primaryColor;
  }

  set primaryColor(value: string) {
    this._primaryColor = value;
  }

  get secondaryColor(): string {
    return this._secondaryColor;
  }

  set secondaryColor(value: string) {
    this._secondaryColor = value;
  }

  get validSecondaryColor(): boolean {
    return this._validSecondaryColor;
  }

  set validSecondaryColor(value: boolean) {
    this._validSecondaryColor = value;
  }

  get uploadOptions(): CustomUploaderOptions {
    return this._uploadOptions;
  }

  set uploadOptions(value: CustomUploaderOptions) {
    this._uploadOptions = value;
  }

  get imageFile(): File {
    return this._imageFile;
  }

  set imageFile(value: File) {
    this._imageFile = value;
  }

  get showCropper(): boolean {
    return this._showCropper;
  }

  set showCropper(value: boolean) {
    this._showCropper = value;
  }

  get partnerLogo(): HTMLElement {
    return document.body.querySelector('.partner-logo');
  }

  get businessPartnerApplication(): BusinessPartnerApplication {
    return this._businessPartnerApplication;
  }

  set businessPartnerApplication(value: BusinessPartnerApplication) {
    this._businessPartnerApplication = value;
  }

  get working(): boolean {
    return this._working;
  }

  set working(value: boolean) {
    this._working = value;
  }

  get merchant(): Merchant {
    return this.merchantService.getMerchant();
  }

  get merchantName(): string {
    return this.merchant.doing_business_as || this.merchant.name;
  }

  get businessPartnerBranding(): BusinessPartnerBranding {
    return this._businessPartnerBranding;
  }
}
