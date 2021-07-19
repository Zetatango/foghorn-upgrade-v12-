import { Component, HostBinding, Injector } from '@angular/core';

// Components
// --- parent
import { OfferGaugeComponent } from 'app/offer/offer-gauge/offer-gauge.component';


@Component({
  selector: 'ztt-offer-gauge-circle',
  templateUrl: './offer-gauge-circle.component.html'
})
export class OfferGaugeCircleComponent extends OfferGaugeComponent {
  @HostBinding('class') componentClass = 'ztt-offer-gauge-circle';

  availabilityTitle: string;

  constructor(injector: Injector) {
    super(injector);
  }

  protected updateOffer(): void {
    super.updateOffer();

    this.setGaugeAttributes();
  }

  private setGaugeAttributes(): void {
    if (!this.showOffer) {
      this.offerAvailableAmount = 0;
      this.offerCapacity = 0;

      return;
    }

    this.availabilityTitle = this.getSubtitle();
  }

  private getSubtitle(): string {
    if (this.offerAvailableAmount === 0) {
      return 'OFFER_GAUGE.NO_FUNDS_AVAILABLE';
    } else if (!this.offerFundsAccessible) {
      return 'OFFER_GAUGE.BELOW_MINIMUM_FUNDS';
    } else {
      return 'OFFER_GAUGE.AVAILABLE_TITLE';
    }
  }
}
