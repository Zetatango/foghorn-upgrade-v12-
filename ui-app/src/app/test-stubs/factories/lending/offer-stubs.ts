import { BehaviorSubject, of } from 'rxjs';
import { offer, offerWca } from 'app/test-stubs/factories/lending/offers';
import { offerFee } from 'app/test-stubs/factories/lending/offer-fee';

/**=============================== TEST STUBS ===============================**/

// Setup Offer[]
export const offers = [offer, offerWca];
export const loadOffers$ = of(null);
export const noloadOffers$ = of(null);
export const offers$ = new BehaviorSubject(offers);
export const noOffers$ = new BehaviorSubject([]);

// Setup Offer
export const loadOffer$ = of(null);
export const offer$ = new BehaviorSubject(offer);
export const offerWca$ = new BehaviorSubject(offerWca);

// Setup OfferFee
export const loadOfferFee$ = of(null);
export const offerFee$ = new BehaviorSubject(offerFee);
