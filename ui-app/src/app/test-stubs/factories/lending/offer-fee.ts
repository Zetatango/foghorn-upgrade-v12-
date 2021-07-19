import * as Factory from 'factory.ts';
import { OfferFee } from 'app/models/api-entities/offer';
import { Currency } from 'app/models/api-entities/utility';
import { lendingTerm60Days } from 'app/test-stubs/factories/lending-term';
import { offerApproved } from 'app/test-stubs/factories/lending/offers';

/********************************* FACTORIES **********************************/

export const offerFeeFactory = Factory.Sync.makeFactory<OfferFee>({
  offer_id: offerApproved.id,
  fee: 3.00,
  principal_amount: 100,
  currency: Currency.CAD,
  loan_term: lendingTerm60Days,
  repayment_amount: 10
});

/********************************** FIXTURES **********************************/

export const offerFee = offerFeeFactory.build();
