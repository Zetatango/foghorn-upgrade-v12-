import { GeneratePdfService } from 'app/services/generate-pdf.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from './utility.service';
import { API_PDFS } from '../constants';
import { HTTP_ERRORS } from '../test-stubs/api-errors-stubs';

describe('GeneratePdfService', () => {
  let pdfService: GeneratePdfService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService,
        UtilityService,
        GeneratePdfService]
    });
  });

  beforeEach(() => {
    pdfService = TestBed.inject(GeneratePdfService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(pdfService).toBeTruthy();
  });

  describe('loadPdf', () => {
    it('should succeed when server returns 200', () => {
      const content = `
        1. Outer list one
          - inner list
        2. Outer list two`;
      pdfService.loadPdf(content).subscribe(
        (res) => {
          expect(res).toBeTruthy();
          expect(res instanceof Blob);
      },
        (err) => fail('Prevented this test to fail silently: ' + err.statusText));

      const exp_url = API_PDFS.GET_PDF;
      const pdfRequest = httpMock.expectOne(exp_url);
      expect(pdfRequest.request.method).toEqual('POST');
      const debug = { hello: 'world' };
      const blob = new Blob([JSON.stringify(debug, null, 2)], {type : 'application/json'});
      pdfRequest.flush(blob);
    });
    it('should reject when server returns error', () => {
      const content = 'Partly valid\xE4 UTF-8 encoding: äöüß';
      HTTP_ERRORS.forEach(httpError => {
        pdfService.loadPdf(content)
          .subscribe(() => fail('Prevented silent failure of this unit test.'),
          (err) => expect(err.status).toEqual(httpError.status));

        const exp_url = API_PDFS.GET_PDF;
        const pdfRequest = httpMock.expectOne(exp_url);
        expect(pdfRequest.request.method).toEqual('POST');
        const debug = { hello: 'world' };
        const blob = new Blob([JSON.stringify(debug, null, 2)], {type : 'application/json'});
        pdfRequest.flush(blob, { status: httpError.status, statusText: httpError.statusText });
      });
    });
  }); // describe - loadPdf
});
