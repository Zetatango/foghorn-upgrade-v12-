import { CfaLandingPageComponent } from './cfa-landing-page/cfa-landing-page.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { BetterInsightsCardComponent } from 'app/insights/better-insights-card/better-insights-card.component';
import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { InsightsRoutingModule } from './insights-routing.module';
import { InsightsComponent } from './insights.component';
import { AccountBalanceChartComponent } from './account-balance-chart/account-balance-chart.component';
import { InsightsService } from 'app/services/insights.service';
import { BankingModule } from 'app/shared/banking.module';
import { SharedModule } from 'app/shared/shared.module';
import { CashBufferComponent } from './cash-buffer/cash-buffer.component';
import { InsightsEmailToggleComponent } from './insights-email-toggle/insights-email-toggle.component';
import { faBadgeCheck } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { InsightsGraphHeaderComponent } from './insights-graph-header/insights-graph-header.component';
import { CashFlowChartComponent } from './cash-flow-chart/cash-flow-chart.component';
import { LocalizeDatePipe } from '../pipes/localize-date.pipe';
import { FinancialSummaryComponent } from './financial-summary/financial-summary.component';
import { CashOnHandComponent } from './financial-summary/cash-on-hand/cash-on-hand.component';
import { CreditAvailableComponent } from './financial-summary/credit-available/credit-available.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { OperatingRatioComponent } from './financial-summary/operating-ratio/operating-ratio.component';
import { CfaCarouselComponent } from './financial-summary/carousel/cfa-carousel.component';
import { OfferModule } from 'app/offer/offer.module';
import { CashFlowStatusComponent } from './financial-summary/cash-flow-status/cash-flow-status.component';
import { InsightsErrorComponent } from './error/insights-error.component';
import { InsightsRootComponent } from './insights-root/insights-root.component';
import { InsightsPreferencesComponent } from './insights-preferences/insights-preferences.component';
import { AboutCashFlowAdvisorComponent } from './about-cash-flow-advisor/about-cash-flow-advisor.component';
import { CfaFeaturesComponent } from './cfa-features/cfa-features.component';


@NgModule({
  declarations: [
    AccountBalanceChartComponent,
    BetterInsightsCardComponent,
    CashFlowChartComponent,
    CashBufferComponent,
    InsightsComponent,
    InsightsEmailToggleComponent,
    InsightsGraphHeaderComponent,
    InsightsRootComponent,
    FinancialSummaryComponent,
    CashOnHandComponent,
    CreditAvailableComponent,
    OperatingRatioComponent,
    CfaCarouselComponent,
    CashFlowStatusComponent,
    InsightsErrorComponent,
    AboutCashFlowAdvisorComponent,
    InsightsPreferencesComponent,
    CfaFeaturesComponent,
    CfaLandingPageComponent
  ],
  imports: [
    BankingModule,
    InsightsRoutingModule,
    NgxChartsModule,
    TranslateModule.forChild(),
    BsDropdownModule.forRoot(),
    CarouselModule.forRoot(),
    OfferModule,
    SharedModule,
  ],
  providers: [
    InsightsService,
    LocalizeDatePipe
  ]
})
export class InsightsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faBadgeCheck);
  }
}
