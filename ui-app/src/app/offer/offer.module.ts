import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConnectBankComponent } from 'app/components/containers/connect-bank/connect-bank.component';
import { OfferApplyButtonComponent } from 'app/offer/offer-apply-button/offer-apply-button.component';
import { OfferGaugeCircleComponent } from 'app/offer/offer-gauge/offer-gauge-circle/offer-gauge-circle.component';
import { OfferGaugeComponent } from 'app/offer/offer-gauge/offer-gauge.component';
import { OfferRefreshComponent } from 'app/offer/offer-refresh/offer-refresh.component';
import { OfferApplyButtonWcaComponent } from 'app/offer/offer-wca/offer-apply-button-wca/offer-apply-button-wca.component';
import { OfferWcaComponent } from 'app/offer/offer-wca/offer-wca.component';
import { OfferWithdrawalComponent } from 'app/offer/offer-withdrawal/offer-withdrawal.component';
import { OfferComponent } from 'app/offer/offer.component';
import { SharedModule } from 'app/shared/shared.module';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { OfferProcessingComponent } from './offer-processing/offer-processing.component';

@NgModule({
  declarations: [
    ConnectBankComponent,
    OfferApplyButtonComponent,
    OfferApplyButtonWcaComponent,
    OfferComponent,
    OfferGaugeCircleComponent,
    OfferGaugeComponent,
    OfferProcessingComponent,
    OfferRefreshComponent,
    OfferWcaComponent,
    OfferWithdrawalComponent
  ],
  imports: [
    NgCircleProgressModule.forRoot({
      'animateTitle': false,
      'animation': false,
      'backgroundPadding': 0,
      'clockwise': false,
      'innerStrokeColor': '#efeeef',
      'innerStrokeWidth': 12,
      'maxPercent': 100,
      'outerStrokeColor': '#692670',
      'outerStrokeGradientStopColor': '#B72CC7',
      'outerStrokeGradient': true,
      'outerStrokeLinecap': 'butt',
      'outerStrokeWidth': 12,
      'radius': 100,
      'renderOnClick': false,
      'responsive': true,
      'showBackground': false,
      'showSubtitle': false,
      'showUnits': false,
      'showZeroOuterStroke': false,
      'space': -12,
      'titleColor': '#001226', // $black
      'titleFontSize': '24',
      'titleFontWeight': '700'
    }),
    RouterModule,
    SharedModule
  ],
  exports: [
    ConnectBankComponent,
    OfferApplyButtonComponent,
    OfferApplyButtonWcaComponent,
    OfferComponent,
    OfferGaugeCircleComponent,
    OfferGaugeComponent,
    OfferProcessingComponent,
    OfferRefreshComponent,
    OfferWcaComponent,
    OfferWithdrawalComponent
  ]
})
export class OfferModule {
}
