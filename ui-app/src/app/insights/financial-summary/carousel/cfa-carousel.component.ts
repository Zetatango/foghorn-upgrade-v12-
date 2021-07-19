import { Component, Injector, Input } from '@angular/core';
import { OfferComponent } from "app/offer/offer.component";

@Component({
  selector: 'ztt-cfa-carousel',
  templateUrl: './cfa-carousel.component.html',
})
export class CfaCarouselComponent extends OfferComponent {
  @Input() itemPerSlide: number;
  @Input() showIndicators: boolean;

  constructor(injector: Injector) {
    super(injector);
  }
  
}
