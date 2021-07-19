/* istanbul ignore file */
import { Component, HostBinding, Injector } from '@angular/core';
import { AppRoutes } from 'app/models/routes';

// Components
// --- parent
import { OfferWcaComponent } from 'app/offer/offer-wca/offer-wca.component';
import { StateRoutingService } from 'app/services/state-routing.service';

// Note: [Graham] this component is getting merged into the generic Offer.
@Component({
  selector: 'ztt-offer-apply-button-wca',
  templateUrl: './offer-apply-button-wca.component.html'
})
export class OfferApplyButtonWcaComponent extends OfferWcaComponent {
  @HostBinding('class') componentClass = 'ztt-offer-apply-button-wca';

  // component variables
  buttonLabel: string;

  constructor(
    injector: Injector,
    private stateRoutingService: StateRoutingService
  ) {
    super(injector);

    this.offerMetrics = false;
  }

  /**
   * Navigates to AppRoutes.application.root after verifying this.offer.
   */
  applyForOffer(): void {
    if (!this.isOfferAvailable) {
      return;
    }

    this.offerService.setOffer(this.offer);
    this.stateRoutingService.navigate(AppRoutes.application.root);
  }

  protected setOfferStates(): void {
    super.setOfferStates();

    this.buttonLabel = `SHOW_OFFERS.INFO_CARD.OFFERS.WCA.BTN_LABEL.${this.offerApplicationState}`;
  }
}
