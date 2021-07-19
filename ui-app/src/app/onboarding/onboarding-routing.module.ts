import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OnboardingFlowComponent } from 'app/components/routes/onboarding-flow/onboarding-flow.component';
import { AboutBusinessComponent } from 'app/components/states/about-business/about-business.component';
import { AboutYouComponent } from 'app/components/states/about-you/about-you.component';
import { AuthenticateApplicantComponent } from 'app/components/states/authenticate-applicant/authenticate-applicant.component';
import { UnableTobeCertifiedComponent } from 'app/components/states/unable-to-be-certified/unable-to-be-certified.component';
import { WaitingLendingOffersComponent } from 'app/components/states/waiting-lending-offers/waiting-lending-offers.component';
import { StateRoute } from 'app/models/routes';
import { AboutYouAutofillResolver } from 'app/resolvers/about-you-autofill.resolver';
import { AboutBusinessAutofillResolver } from 'app/resolvers/about-business-autofill.resolver';

const routes: Routes = [{
  path: '',
  component: OnboardingFlowComponent,
  children: [
    {
      path: StateRoute.about_business,
      component: AboutBusinessComponent,
      data: { title_key: 'ONBOARDING' },
      resolve: {
        merchantInfo: AboutBusinessAutofillResolver
      }
    },
    {
      path: StateRoute.about_you,
      component: AboutYouComponent,
      data: { title_key: 'ONBOARDING' },
      resolve: {
        applicantInfo: AboutYouAutofillResolver
      }
    },
    { path: StateRoute.authenticate_applicant, component: AuthenticateApplicantComponent, data: { title_key: 'ONBOARDING' } },
    { path: StateRoute.waiting_lending_offers, component: WaitingLendingOffersComponent, data: { title_key: 'ONBOARDING' } },
    { path: StateRoute.unable_to_be_certified, component: UnableTobeCertifiedComponent, data: { title_key: 'ONBOARDING' } }
  ]
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class OnboardingRoutingModule { }
