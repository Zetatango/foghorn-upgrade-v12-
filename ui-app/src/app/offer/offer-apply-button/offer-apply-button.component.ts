import { Component, HostBinding, Injector, Input } from '@angular/core';
import { OfferType } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';

// Components
// --- parent
import { OfferComponent } from 'app/offer/offer.component';
import { StateRoutingService } from 'app/services/state-routing.service';

@Component({
  selector: 'ztt-offer-apply-button',
  templateUrl: './offer-apply-button.component.html'
})
export class OfferApplyButtonComponent extends OfferComponent {
  @HostBinding('class') componentClass = 'ztt-offer-apply-button';
  reasons: string[] = [];

  @Input() requestedAmount: number;
  @Input() isButtonDisabled: boolean;

  constructor(
    injector: Injector,
    private stateRoutingService: StateRoutingService
  ) {
    super(injector);

    this.offerMetrics = false;
    this.offerType = OfferType.LineOfCredit;
  }

  get hasReasons(): boolean {
    return this.reasons.length > 0;
  }

  /**
   * Navigates to AppRoutes.application.root after verifying this.offer.
   */
  applyForOffer(): void {
    if (this.isOfferDisabled) return;
    // Note: [Graham] look into what happens if this isn't set.
    if (this.requestedAmount) {
      this.offerService.requestedAmount = this.requestedAmount;
    }

    this.offerService.setOffer(this.offer);
    this.stateRoutingService.navigate(AppRoutes.application.root);
  }

  protected populateReasons(): void {
    this.reasons = [];

    if (!this.isOfferAvailable) {
      this.reasons.push('NO_LENDING_OFFER_AVAILABLE');
    }

    if (!this.offerFundsAccessible && !this.hasInProgressApplication) {
      this.reasons.push('OFFER_GAUGE.BELOW_MINIMUM_FUNDS');
    }

    if (this.hasPaymentPlan) {
      this.reasons.push('DASHBOARD.PAYMENT_PLAN.RESTRICTIONS_DESC');
    }

    if (this.hasInProgressApplication) {
      this.reasons.push('SHOW_LENDING_OFFERS.INFO_CARD.OFFERS.LOC.IN_PROGRESS');
    }
  }
}
