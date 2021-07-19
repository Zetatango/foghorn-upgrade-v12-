import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PartnerOnboardingComponent } from './partner-onboarding.component';
import { AppRoutes, StateRoute } from '../models/routes';
import { BusinessPartnerAgreementComponent } from './business-partner-agreement/business-partner-agreement.component';
import { BusinessPartnerBrandingComponent } from './business-partner-branding/business-partner-branding.component';
import { BusinessPartnerLandingComponent } from './business-partner-landing/business-partner-landing.component';
import { SetUpBankComponent } from '../components/states/set-up-bank/set-up-bank.component';
import { BankingContext } from 'app/services/banking-flow.service';

const routes: Routes = [
  {
    path: '',
    component: PartnerOnboardingComponent,
    children: [
      { path: StateRoute.business_partner_agreement, component: BusinessPartnerAgreementComponent, data: { title_key: 'PARTNER_ONBOARDING' } },
      { path: StateRoute.business_partner_branding, component: BusinessPartnerBrandingComponent, data: { title_key: 'PARTNER_ONBOARDING' } },
      { path: StateRoute.business_partner_landing, component: BusinessPartnerLandingComponent, data: { title_key: 'PARTNER_ONBOARDING' } },
      {
        path: StateRoute.set_up_bank,
        component: SetUpBankComponent,
        data: {
          title_key: 'PARTNER_ONBOARDING',
          flinks_route: AppRoutes.partner_onboarding.root,
          context: BankingContext.business_partner_registration
        }
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class PartnerOnboardingRoutingModule {}
