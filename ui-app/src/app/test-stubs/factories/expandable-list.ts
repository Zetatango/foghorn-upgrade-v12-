import * as Factory from 'factory.ts';
import { ExpandableListItem } from 'app/models/expandable-list';
import { invoiceResponse } from './invoice';

/********************************* FACTORIES **********************************/

export const expandableListItemFactory = Factory.Sync.makeFactory<ExpandableListItem>({
    isOpen: false,
    isSelected: false,
    data: invoiceResponse
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const listItem = expandableListItemFactory.build();
