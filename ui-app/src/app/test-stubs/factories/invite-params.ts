import * as Factory from 'factory.ts';
import { InviteParams } from 'app/models/invite-params';

/********************************* FACTORIES **********************************/

export const inviteParamsFactory = Factory.Sync.makeFactory<InviteParams>({
    name: 'test',
    email: 'test@user.com'
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const defaultInviteParams = inviteParamsFactory.build();
