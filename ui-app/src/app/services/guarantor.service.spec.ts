import { TestBed, waitForAsync } from '@angular/core/testing';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';

import { take } from 'rxjs/operators';
import { GuarantorService } from './guarantor.service';
import { UtilityService } from 'app/services/utility.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { GUARANTOR } from 'app/constants';
import { guarantorCreatedResponse, guarantorPostFactory } from 'app/test-stubs/factories/guarantor';

describe('GuarantorService', () => {

  let httpMock: HttpTestingController;
  let guarantorService: GuarantorService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        CookieService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    httpMock = TestBed.inject(HttpTestingController);
    guarantorService = TestBed.inject(GuarantorService);
  });

  it('should be created', () => {
    expect(guarantorService).toBeTruthy();
  });

  it('should call the api when the `addGuarantor` method is invoked', () => {
    const guarantorCreated = guarantorCreatedResponse.build();
    guarantorService.addGuarantor(guarantorPostFactory.build())
      .subscribe((res) => expect(res.status).toBe(guarantorCreated.status));

    const guarantorRequest = httpMock.expectOne(GUARANTOR.POST_ADD_GUARANTOR);
    expect(guarantorRequest.request.method).toEqual('POST');
    guarantorRequest.flush(guarantorCreated);
  });

  it('should pass down an error to caller if posting a guarantor returns an http error',
    () => {
      HTTP_ERRORS.forEach(httpError => {
        guarantorService.addGuarantor(guarantorPostFactory.build())
          .pipe(take(1))
          .subscribe(() => fail('Prevented silent failure of this unit test.'), // Nothing to check here, shouldn't be reached
                     (err) => expect(err.status).toEqual(httpError.status));

        const guarantorRequest = httpMock.expectOne(GUARANTOR.POST_ADD_GUARANTOR);
        expect(guarantorRequest.request.method).toEqual('POST');
        guarantorRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
});
