import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import Bugsnag from '@bugsnag/js';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { ErrorMessage } from 'app/models/error-response';
import { LoggingService, GTMEvent } from 'app/services/logging.service';

@Directive({
  selector: '[zttGtmEvent]'
})
export class GtmEventDirective implements AfterViewInit {
  @Input('zttGtmEvent') name: string;

  constructor(
    private el: ElementRef,
    private loggingService: LoggingService
  ) { }

  ngAfterViewInit(): void {
    this.el.nativeElement.onclick = () => {
      const name = this.el.nativeElement.name;
      if (!name) {
        const html = this.el.nativeElement.outerHTML;
        /* istanbul ignore next */
        Bugsnag.notify(new ErrorMessage(`Missing name for gtm: ${html}`), event => { event.severity = BugsnagSeverity.info });
        return;
      }
      this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, name);
    };
  }
}
