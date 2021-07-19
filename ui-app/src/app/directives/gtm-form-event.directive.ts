import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import Bugsnag from '@bugsnag/js';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { ErrorMessage } from 'app/models/error-response';
import { LoggingService } from 'app/services/logging.service';

@Directive({
  selector: '[zttGtmFormEvent]'
})
export class GtmFormEventDirective implements AfterViewInit {
  @Input('zttGtmFormEvent') name;

  constructor(
    private el: ElementRef,
    private loggingService: LoggingService
  ) { }

  ngAfterViewInit(): void {
    const form = this.el.nativeElement;
    if (!form.name) {
      const html = this.el.nativeElement.outerHTML;
      /* istanbul ignore next */
      Bugsnag.notify(new ErrorMessage(`Missing name for gtm form: ${html}`), event => { event.severity = BugsnagSeverity.info });
      return;
    }

    const formControls: NodeListOf<HTMLElement> = form.querySelectorAll('[formcontrolname]');
    formControls.forEach((input) => {
      input.onblur = () => {
        const controlName = input.getAttribute('formcontrolname');

        this.loggingService.GTMOnBlur(form.name, controlName);
      };
    });
  }
}
