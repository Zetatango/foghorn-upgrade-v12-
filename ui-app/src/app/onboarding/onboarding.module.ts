import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { OnboardingRoutingModule } from './onboarding-routing.module';
import { AboutYouComponent } from 'app/components/states/about-you/about-you.component';
import { AuthenticateApplicantComponent } from 'app/components/states/authenticate-applicant/authenticate-applicant.component';
import { AboutBusinessComponent } from 'app/components/states/about-business/about-business.component';
import { OnboardingFlowComponent } from 'app/components/routes/onboarding-flow/onboarding-flow.component';
import { WaitingLendingOffersComponent } from 'app/components/states/waiting-lending-offers/waiting-lending-offers.component';
import { UnableTobeCertifiedComponent } from 'app/components/states/unable-to-be-certified/unable-to-be-certified.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    AboutYouComponent,
    AboutBusinessComponent,
    AuthenticateApplicantComponent,
    OnboardingFlowComponent,
    WaitingLendingOffersComponent,
    UnableTobeCertifiedComponent,
  ],
  imports: [
    OnboardingRoutingModule,
    TranslateModule.forChild(),
    SharedModule
  ]
})
export class OnboardingModule {}
