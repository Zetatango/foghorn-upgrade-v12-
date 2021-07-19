import { NgModule } from '@angular/core';
import { MarketingComponent } from './marketing.component';
import { MarketingCampaignComponent } from './marketing-campaign/marketing-campaign.component';
import { MarketingRoutingModule } from './marketing-routing.module';
import { SocialConnectionsComponent } from './social-connections/social-connections.component';
import { SocialConnectionsService } from 'app/services/social-connections.service';
import { FacebookService } from 'app/services/facebook.service';
import { SharedModule } from 'app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    MarketingCampaignComponent,
    MarketingComponent,
    SocialConnectionsComponent
  ],
  imports: [
    MarketingRoutingModule,
    TranslateModule.forChild(),
    SharedModule
  ],
  providers: [
    FacebookService,
    SocialConnectionsService
  ]
})
export class MarketingModule {}
