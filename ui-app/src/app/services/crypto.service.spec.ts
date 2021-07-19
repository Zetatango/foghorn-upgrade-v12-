import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs/internal/operators/take';

// Services
import { CryptoService } from './crypto.service';
import { UtilityService } from './utility.service';
import { CookieService } from 'ngx-cookie-service';

// Others
import { API_CRYPTO } from 'app/constants';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  let httpMock: HttpTestingController;
  const defaultFilename = 'default.png';
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ CookieService, UtilityService, CryptoService ]
    });
  });

  beforeEach(() => {
    cryptoService = TestBed.inject(CryptoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(cryptoService).toBeTruthy();
  });

  // API CALLS
  // ----------------------------------------------------------------------- fetchEncryptionBundle()
  describe('fetchEncryptionBundle()', () => {
    it('should be able to fetch encryption bundle', () => {
      cryptoService.fetchEncryptionBundle(defaultFilename).subscribe();

      const fetchEncryptionBundleRequest = httpMock.expectOne(API_CRYPTO.ENCRYPTION_BUNDLE);
      expect(fetchEncryptionBundleRequest.request.method).toEqual('POST');
      fetchEncryptionBundleRequest.flush({ status: 200 });
    });

    it('should pass down an error to caller if fetching encryption bundle returns an http error', () => {
      cryptoService.fetchEncryptionBundle(defaultFilename)
        .pipe(take(1))
        .subscribe(
              () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
              (err) => expect(err.status).toEqual(500));

      const fetchEncryptionBundleRequest = httpMock.expectOne(API_CRYPTO.ENCRYPTION_BUNDLE);
      expect(fetchEncryptionBundleRequest.request.method).toEqual('POST');
      fetchEncryptionBundleRequest.flush([], { status: 500, statusText: 'Internal Server Error' });
    });
  }); // describe - fetchEncryptionBundle()
});
