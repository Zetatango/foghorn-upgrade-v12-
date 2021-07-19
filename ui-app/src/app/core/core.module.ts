/* istanbul ignore file */
/**
 * What goes here?
 *
 * Code that is exclusive to my app (navbar, footer, etc.) and has no intra-project dependencies from other modules.
 * “Plumbing code” (Angular core API wrapper, error handler, HTTP interceptor, etc.)
 */

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorHandler, NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpErrorsInterceptor } from 'app/http-interceptors/http-errors-interceptor';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@NgModule({
  providers: [
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorsInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent: CoreModule) {
    if (parent) throw new Error(`CoreModule has already been loaded.`);
  }
}
