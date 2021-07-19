import { Observer } from 'rxjs';

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const fakeObserver: Observer<unknown> = {
    next: /* istanbul ignore next */ () => undefined,
    complete: /* istanbul ignore next */ () => undefined,
    error: /* istanbul ignore next */() => undefined
};
