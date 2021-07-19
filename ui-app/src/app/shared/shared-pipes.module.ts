/**
 * What goes here?
 *
 * Pipes that are intended to be reused across many places.
 */

import { NgModule } from '@angular/core';
import { DefaultPipe } from 'app/pipes/default.pipe';
import { FriendlyDatePipe } from 'app/pipes/friendly-date.pipe';
import { LocalizeDatePipe } from 'app/pipes/localize-date.pipe';
import { MaskPipe } from 'app/pipes/mask.pipe';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';

const declarations = [
  DefaultPipe, // only quickbooks
  FriendlyDatePipe, // only select lending offer
  LocalizeDatePipe,
  MaskPipe,
  ZttCurrencyPipe
];

@NgModule({
  declarations: declarations,
  exports: [...declarations]
})
export class SharedPipesModule {
}
