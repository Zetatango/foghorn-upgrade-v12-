import { Component, HostBinding, Injector } from '@angular/core';
import { OfferType } from 'app/models/api-entities/utility';

// Components
// --- parent
import { OfferComponent } from 'app/offer/offer.component';

@Component({
  selector: 'ztt-offer-gauge',
  templateUrl: './offer-gauge.component.html'
})
export class OfferGaugeComponent extends OfferComponent {
  @HostBinding('class') componentClass = 'ztt-offer-gauge';

  constructor(injector: Injector) {
    super(injector);

    this.offerType = OfferType.LineOfCredit;
  }
}
