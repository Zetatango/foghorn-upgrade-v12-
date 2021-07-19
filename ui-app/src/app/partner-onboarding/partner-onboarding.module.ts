import { NgModule } from '@angular/core';
import { ColorPickerModule } from 'ngx-color-picker';
import { ImageCropperModule } from 'ngx-image-cropper';
import { PartnerOnboardingComponent } from './partner-onboarding.component';
import { PartnerOnboardingRoutingModule } from './partner-onboarding-routing.module';
import { BusinessPartnerAgreementComponent } from './business-partner-agreement/business-partner-agreement.component';
import { BusinessPartnerBrandingComponent } from './business-partner-branding/business-partner-branding.component';
import { BusinessPartnerLandingComponent } from './business-partner-landing/business-partner-landing.component';
import { SharedModule } from 'app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    BusinessPartnerAgreementComponent,
    BusinessPartnerBrandingComponent,
    BusinessPartnerLandingComponent,
    PartnerOnboardingComponent
  ],
  imports: [
    ColorPickerModule,
    ImageCropperModule,
    PartnerOnboardingRoutingModule,
    TranslateModule.forChild(),
    SharedModule
  ]
})
export class PartnerOnboardingModule {}
