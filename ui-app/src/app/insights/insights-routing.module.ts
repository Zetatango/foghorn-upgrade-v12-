import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BankingContext } from 'app/services/banking-flow.service';
import { SetUpBankComponent } from '../components/states/set-up-bank/set-up-bank.component';
import { AppRoutes, StateRoute } from '../models/routes';

import { OffersResolver } from 'app/resolvers/offers.resolver';
import { InsightsRootComponent } from './insights-root/insights-root.component';
import { CfaGraphResolver } from 'app/resolvers/cfa-graph.resolver';
import { InsightsErrorComponent } from './error/insights-error.component';
import { InsightsComponent } from './insights.component';
import { InsightsPreferencesComponent } from './insights-preferences/insights-preferences.component';
import { CfaRouteGuard } from 'app/guards/cfa-route.guard';
import { AboutCashFlowAdvisorComponent } from './about-cash-flow-advisor/about-cash-flow-advisor.component';
import { CfaLandingPageComponent } from './cfa-landing-page/cfa-landing-page.component';

const routes: Routes = [
  {
    path: '',
    component: InsightsRootComponent,
    children: [
      {
        path: StateRoute.dashboard,
        component: InsightsComponent,
        data: {
          title_key: 'INSIGHTS'
        },
        canActivate: [
          CfaRouteGuard
        ],
        resolve: {
          offers: OffersResolver,
          graphData: CfaGraphResolver
        },
      },
      {
        path: StateRoute.set_up_bank,
        component: SetUpBankComponent,
        data: {
          title_key: 'INSIGHTS',
          flinks_route: AppRoutes.insights.root,
          context: BankingContext.insights
        }
      },
      {
        path: StateRoute.no_insights_data,
        component: InsightsErrorComponent,
        data: {
          title_key: 'INSIGHTS'
        }
      },
      {
        path: StateRoute.preferences,
        component: InsightsPreferencesComponent,
        data: {
          title_key: 'INSIGHTS'
        }
      },
      {
        path: StateRoute.about_cfa,
        component: AboutCashFlowAdvisorComponent,
        data: {
          title_key: 'INSIGHTS'
        }
      },
      {
        path: StateRoute.cfa_landing,
        component: CfaLandingPageComponent,
        data: {
          title_key: 'INSIGHTS'
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
export class InsightsRoutingModule {
}
