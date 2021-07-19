import * as Factory from 'factory.ts';

/********************************* FACTORIES **********************************/

const objectFactory = Factory.Sync.makeFactory<Record<string, unknown>>({
  key1: 1
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// Note: Technically, these are fine since they are functions and will generate a fesh entity eveytime.

export const objectWithNoWhitespace = (): Record<string, unknown> => objectFactory.build({ key2: 'test' });
export const objectWithExtraWhitespace = (): Record<string, unknown> => objectFactory.build({ key2: '   test   ' });
export const objectWithNullValue = (): Record<string, unknown> => objectFactory.build({ key2: null });
