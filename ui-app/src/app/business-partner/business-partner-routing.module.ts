import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BusinessPartnerDashboardComponent } from './business-partner-dashboard/business-partner-dashboard.component';
import { PartnerDashboardComponent } from './partner-dashboard.component';
import { StateRoute } from 'app/models/routes';

const routes: Routes = [
  {
    path: '',
    component: PartnerDashboardComponent,
    children: [
      { path: StateRoute.business_partner_dashboard, component: BusinessPartnerDashboardComponent, data: { title_key: 'PARTNER_DASHBOARD' }},
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
export class BusinessPartnerRoutingModule {}
