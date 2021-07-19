import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DashboardComponent } from "app/components/routes/dashboard/dashboard.component";
import { ActiveUblsComponent } from "app/components/states/active-ubls/active-ubls.component";
import { SetUpBankComponent } from "app/components/states/set-up-bank/set-up-bank.component";
import { AppRoutes, StateRoute } from "app/models/routes";
import { BankingContext } from "app/services/banking-flow.service";


const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: { title_key: 'DASHBOARD' },
    children: [
      { path: StateRoute.active_ubls, component: ActiveUblsComponent, data: { title_key: 'DASHBOARD' } },
      {
        path: StateRoute.set_up_bank,
        component: SetUpBankComponent,
        data: {
          title_key: 'DASHBOARD',
          flinks_route: AppRoutes.dashboard.root,
          context: BankingContext.dashboard
        }
      },
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class DashboardRoutingModule {}
