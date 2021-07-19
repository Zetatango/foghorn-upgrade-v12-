/* istanbul ignore file */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CashFlowComponent } from 'app/components/routes/cash-flow/cash-flow.component';
import { AppLayoutComponent } from 'app/layouts/app-layout.component';
import { MinLayoutComponent } from 'app/layouts/min-layout.component';
import { QuickbooksConnectInfoComponent } from 'app/components/states/quickbooks-connect-info/quickbooks-connect-info.component';
import { ReviewGuaranteeComponent } from './components/states/review-guarantee/review-guarantee.component';
import { AppRoutes, StateRoute } from './models/routes';
import { KycFailedComponent } from './components/states/kyc-failed/kyc-failed.component';
import { NoLendingOfferComponent } from './components/states/no-lending-offers/no-lending-offers.component';
import { MarketingModule } from './marketing/marketing.module';
import { InsightsModule } from './insights/insights.module';
import { DocumentsModule } from 'app/documents/documents.module';
import { PartnerOnboardingModule } from './partner-onboarding/partner-onboarding.module';
import { BusinessPartnerModule } from './business-partner/business-partner.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ApplicationModule } from './application/application.module';
import { DashboardModule } from './dashboard/dashboard.module';

const routes: Routes = [
  // Site routes goes here. Make sure to include page titles.
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      // RAIL ALIASES
      { path: 'merchant', redirectTo: AppRoutes.application.root_link },
      { path: 'on_boarding/new', redirectTo: AppRoutes.onboarding.root_link },
      { path: AppRoutes.cash_flow.root, component: CashFlowComponent, data: { title_key: 'CASH_FLOW' } },
      // ANGULAR ROUTES
      {
        path: AppRoutes.onboarding.root,
        data: { title_key: 'ONBOARDING' },
        loadChildren: (): Promise<OnboardingModule> => import('./onboarding/onboarding.module').then(m => m.OnboardingModule),
      },
      {
        path: AppRoutes.application.root,
        data: { title_key: 'APPLICATION' },
        loadChildren: (): Promise<ApplicationModule> => import('./application/application.module').then(m => m.ApplicationModule),
      },
      {
        path: AppRoutes.dashboard.root,
        data: { title_key: 'DASHBOARD' },
        loadChildren: (): Promise<DashboardModule> => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: AppRoutes.application.root,
        data: { title_key: 'APPLICATION' },
        loadChildren: (): Promise<ApplicationModule> => import('./application/application.module').then(m => m.ApplicationModule),
      },
      {
        path: AppRoutes.insights.root,
        loadChildren: (): Promise<InsightsModule> => import('./insights/insights.module').then(m => m.InsightsModule),
        data: {
          title_key: 'INSIGHTS'
        }
      },
      {
        path: AppRoutes.documents.root,
        loadChildren: (): Promise<DocumentsModule> => import('app/documents/documents.module').then(m => m.DocumentsModule),
        data: {
          title_key: 'DOCUMENTS.MY_DOCUMENTS'
        }
      },
      {
        path: AppRoutes.marketing.root,
        loadChildren: (): Promise<MarketingModule> => import('./marketing/marketing.module').then(m => m.MarketingModule),
        data: {
          title_key: 'MARKETING'
        }
      },
      { path: AppRoutes.agreement.root, component: ReviewGuaranteeComponent, data: { title_key: 'AGREEMENT' } },
      {
        path: AppRoutes.partner_onboarding.root,
        loadChildren: (): Promise<PartnerOnboardingModule> => import('./partner-onboarding/partner-onboarding.module').then(m => m.PartnerOnboardingModule),
        data: {
          title_key: 'PARTNER_ONBOARDING'
        }
      },
      {
        path: AppRoutes.partner_dashboard.root,
        loadChildren: (): Promise<BusinessPartnerModule> => import('./business-partner/business-partner.module').then(m => m.BusinessPartnerModule),
        data: {
          title_key: 'PARTNER_DASHBOARD'
        }
      },
      {
        path: AppRoutes.error.root,
        data: { title_key: 'ERROR' },
        children: [
          { path: StateRoute.kyc_failed, component: KycFailedComponent, data: { title_key: 'ERROR' } },
          { path: StateRoute.no_offers, component: NoLendingOfferComponent, data: { title_key: 'ERROR' } }
        ]
      },
    ]
  },
  {
    path: '',
    component: MinLayoutComponent,
    children: [
      { path: AppRoutes.quickbooks.root, component: QuickbooksConnectInfoComponent, data: { title_key: 'QUICKBOOKS' } }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      {
        useHash: false,
        enableTracing: false,
        scrollPositionRestoration: 'enabled',
        relativeLinkResolution: 'legacy'
      }
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
