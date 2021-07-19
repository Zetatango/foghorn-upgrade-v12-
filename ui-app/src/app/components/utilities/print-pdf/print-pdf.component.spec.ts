import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PrintPdfComponent } from './print-pdf.component';

import { GeneratePdfService } from 'app/services/generate-pdf.service';
import {of, throwError} from 'rxjs';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from 'app/services/utility.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownService } from 'ngx-markdown';
import Bugsnag from '@bugsnag/js';

describe('PrintPdfComponent', () => {
  let component: PrintPdfComponent;
  let fixture: ComponentFixture<PrintPdfComponent>;
  let pdfService: GeneratePdfService;
  let errorService: ErrorService;

  const generateHTML = (text: string) => `<p>${text}</p>`;
  const generateTemplate =
    (heading: string, html: string): string => {
      const printString = '';
      const template = `<head><title>${heading}</title></head>
                       <body ${printString}><h1>${heading}</h1>
                       ${html}</body>`;
      return template.replace(/\s/g, '');
    };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrintPdfComponent ],
      imports: [
        HttpClientTestingModule,
        MarkdownModule.forRoot()
      ],
      providers: [
        MarkdownService,
        GeneratePdfService,
        CookieService,
        ErrorService,
        UtilityService,
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));


  beforeEach(() => {
    pdfService = TestBed.inject(GeneratePdfService);
    fixture = TestBed.createComponent(PrintPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    errorService = TestBed.inject(ErrorService);
  });

  describe('Print PDF', () => {
    beforeEach(() => {
      component.heading = 'Testing-1';
      component.text = 'Testing-2';
      component.fileName = 'Testing-3';
      component.template = '';
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('generatePdf() should call loadPdf and downloadPdf once', () => {
      const debug = { hello: 'world' };
      const blob = new Blob([JSON.stringify(debug, null, 2)], {type : 'application/json'});
      spyOn(pdfService, 'loadPdf').and.returnValue(of(blob));
      spyOn(component, 'downloadPdf');

      component.generatePdf();

      expect(pdfService.loadPdf).toHaveBeenCalledTimes(1);
      expect(component.downloadPdf).toHaveBeenCalledTimes(1);
    });

    it('generatePdf() should display error and bugsnag if loadPdf Fails', () => {
      spyOn(errorService, 'show');
      spyOn(Bugsnag, 'notify');
      spyOn(pdfService, 'loadPdf').and.returnValue(throwError({ status: 500, message: 'Content is invalid' }));
      component.generatePdf();

      fixture.detectChanges();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
      expect(pdfService.loadPdf).toHaveBeenCalledTimes(1);
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('downloadPdf sets downloading to false', () => {
      const debug = { hello: 'world' };
      const blob = new Blob([JSON.stringify(debug, null, 2)], {type : 'application/json'});

      component.downloadPdf(blob);

      expect(component.downloading).toBeFalse();
    });

    it('print() should open with correct window attributes including rel="noopener"', () => {
      spyOn(component, 'setTemplate').and.callThrough();
      spyOn(window, 'open');

      component.print();

      expect(component.setTemplate).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledOnceWith('', '_blank', 'top=10,left=10,height=90%,width=auto,rel="noopener"');
    });

    // Test is written like an integration test to ensure code coverage
    // and due to lack of ability to properly unit test external elements
    it('print() methods should write popup\'s document with correct content', () => {
      spyOn(window, 'open').and.callThrough();

      component.setTemplate();
      const popup = component.openPopup();
      const doc = popup.document;
      const html = generateHTML(component.text);

      spyOn(doc, 'open').and.callThrough();
      spyOn(doc, 'write').and.callThrough();
      spyOn(doc, 'close').and.callThrough();

      component.writeToDocument(popup);

      const expected = generateTemplate(component.heading, html);
      const documentString = doc.documentElement.innerHTML.replace(/\s/g, '');

      expect(documentString).toBe(expected);
      expect(doc.open).toHaveBeenCalledTimes(1);
      expect(doc.write).toHaveBeenCalledTimes(1);
      expect(doc.close).toHaveBeenCalledTimes(1);
    });
  });
});
