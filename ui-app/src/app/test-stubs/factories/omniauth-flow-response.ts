import * as Factory from 'factory.ts';
import { OmniauthFlowResponse, QuickbooksFlowMessage } from 'app/models/api-entities/omniauth-flow-response';

/********************************* FACTORIES **********************************/

export const omniauthFlowResponseFactory = Factory.Sync.makeFactory<OmniauthFlowResponse>({
  status: true
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const omniauthSuccessFlowResponse = omniauthFlowResponseFactory.build();
/** @deprecated Prefer factories instead. */
export const omniauthFailedFlowResponse = omniauthFlowResponseFactory.build({
  status: false
});
/** @deprecated Prefer factories instead. */
export const quickbooksRealmIDChangedErrorResponse = omniauthFlowResponseFactory.build({
  status: false,
  message: QuickbooksFlowMessage.realmIdChangedError
});
