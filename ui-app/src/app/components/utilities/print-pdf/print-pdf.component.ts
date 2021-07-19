import { Component, Input, OnDestroy } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { GeneratePdfService } from 'app/services/generate-pdf.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-print-pdf',
  templateUrl: './print-pdf.component.html'
})
export class PrintPdfComponent implements OnDestroy {

  @Input() text: string;
  @Input() heading: string;
  @Input() fileName: string;
  template: string;
  private _downloading = false;
  unsubscribe$ = new Subject<void>();

  constructor(private markdownService: MarkdownService,
              private errorService: ErrorService,
              private generatePdfService: GeneratePdfService) {}


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  generatePdf(): void {
    this.downloading = true;
    this.generatePdfService.loadPdf(this.text)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (res: Blob) => {
            this.downloadPdf(res);
          },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.general);
        });
  }

  downloadPdf(pdfBlob: Blob): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = this.fileName + '.pdf';
    document.body.append(link);
    link.click();
    link.remove();
    // in case the Blob uses a lot of memory
    /* istanbul ignore next */
    window.addEventListener('focus', () => URL.revokeObjectURL(link.href), {once: true});
    this.downloading = false;
  }

  print(): void {
    this.setTemplate(true);
    const popup = this.openPopup();
    this.writeToDocument(popup);
  }

  setTemplate(print = false): void {
    // compiling markdown and cleaning the string from unwanted characters.
    const html = this.markdownService.compile(this.text).replace(/[^\x00-\x7F]/g, '');
    const printString = print ? 'onload="window.print();window.close()"' : '';
    this.template = `
      <html>
        <head>
          <title>${this.heading}</title>
        </head>
    <body ${printString}><h1>${this.heading}</h1> ${html}</body>
      </html>`;
  }

  openPopup(): Window {
    return window.open('', '_blank', 'top=10,left=10,height=90%,width=auto,rel="noopener"');
  }

  writeToDocument(popup: Window): void {
    if (popup && popup.document) {
      popup.document.open();
      popup.document.write(this.template);
      popup.document.close();
    }
  }

  get downloading(): boolean {
    return this._downloading;
  }

  set downloading(value: boolean) {
    this._downloading = value;
  }
}
