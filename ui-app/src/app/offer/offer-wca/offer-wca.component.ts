import { Component, HostBinding, Injector } from '@angular/core';
import { OfferType } from 'app/models/api-entities/utility';

// Components
// --- parent
import { OfferComponent } from 'app/offer/offer.component';

@Component({
  selector: 'ztt-offer-wca',
  templateUrl: './offer-wca.component.html'
})
export class OfferWcaComponent extends OfferComponent {
  @HostBinding('attr.id') componentId = 'ztt-offer-wca';

  offerApplicationState: string;

  constructor(injector: Injector) {
    super(injector);

    this.offerType = OfferType.WorkingCapitalAdvance;
  }

  protected setOfferStates(): void {
    super.setOfferStates();

    this.offerApplicationState = this.offerService.getOfferApplicationState(this.offer);
  }

  /**
   * Custom WCA offer metrics.
   */
  protected setOfferMetrics(): void {
    this.offerAvailableAmount = this.offerService.getOfferWcaAvailableAmount(this.offer);
  }
}
