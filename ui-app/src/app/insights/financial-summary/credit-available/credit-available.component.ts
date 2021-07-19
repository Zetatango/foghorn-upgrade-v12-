import { Component, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OfferComponent } from 'app/offer/offer.component';
import { OfferType } from 'app/models/api-entities/utility';

@Component({
  selector: 'ztt-credit-available',
  templateUrl: './credit-available.component.html'
})
export class CreditAvailableComponent extends OfferComponent {

  public translateService: TranslateService;
  requestedAmount = 0;
  isRequestFundButtonDisabled = false;

  constructor(injector: Injector) {
    super(injector);
    this.offerType = OfferType.LineOfCredit;
  }
}
