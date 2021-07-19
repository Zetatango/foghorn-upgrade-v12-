import * as Factory from 'factory.ts';

export const windowFactory = Factory.makeFactory<Window>(window.open());

export const closedWindow = (): Window => {
    const openWindow = window.open();
    openWindow.close();
    return openWindow;
};

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const fakeWindow: Window = windowFactory.build();
