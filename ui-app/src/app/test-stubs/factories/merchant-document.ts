import * as Factory from 'factory.ts';
import { DocumentState } from 'app/models/api-entities/merchant-document-status';
import { MerchantDocumentStatus, DocumentCode } from 'app/models/api-entities/merchant-document-status';

/********************************* FACTORIES **********************************/

const merchantDocumentFactory = Factory.makeFactory<MerchantDocumentStatus>({
  code: DocumentCode.cra_tax_assessment,
  state: DocumentState.required
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const merchDocumentTaxRequired = merchantDocumentFactory.build();
/** @deprecated Prefer factories instead. */
export const merchDocumentBankRequired = merchantDocumentFactory.build({
  code: DocumentCode.bank_statements
});
/** @deprecated Prefer factories instead. */
export const merchDocumentTaxCollected = merchantDocumentFactory.build({
  state: DocumentState.collected
});
/** @deprecated Prefer factories instead. */
export const merchDocumentBankCollected = merchantDocumentFactory.build({
  code: DocumentCode.bank_statements,
  state: DocumentState.collected
});
