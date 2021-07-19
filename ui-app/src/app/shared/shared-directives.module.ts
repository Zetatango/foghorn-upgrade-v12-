/**
 * What goes here?
 *
 * Directives that are intended to be reused across many places.
 */

import { NgModule } from '@angular/core';
import { ExcludeEmojiDirective } from 'app/directives/exclude-emoji.directive';
import { ExcludeNumberDirective } from 'app/directives/exclude-number.directive';
import { GtmEventDirective } from 'app/directives/gtm-event.directive';
import { GtmFormEventDirective } from 'app/directives/gtm-form-event.directive';
import { TrimWhitespaceDirective } from 'app/directives/trim-whitespace.directive';
import { CarouselSwiperDirective } from 'app/directives/carousel-swiper.directive';


const declarations = [
  ExcludeNumberDirective,
  ExcludeEmojiDirective,
  GtmEventDirective,
  GtmFormEventDirective,
  TrimWhitespaceDirective,
  CarouselSwiperDirective
];

@NgModule({
  declarations: declarations,
  exports: [...declarations]
})
export class SharedDirectivesModule {
}
