import { TestBed } from '@angular/core/testing';
import { UblsResolver } from './ubls.resolver';
import { UblService } from 'app/services/ubl.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { throwError, of } from 'rxjs';

describe('UblsResolver', () => {
  let resolver: UblsResolver;
  let errorService: ErrorService;
  let ublService: UblService;

  let loadUblsSpy;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService, UblService, UtilityService, ErrorService]
    });

    errorService = TestBed.inject(ErrorService);
    ublService = TestBed.inject(UblService);
    resolver = new UblsResolver(errorService, ublService);

    loadUblsSpy = spyOn(ublService, 'loadUbls$');
    spyOn(errorService, 'show');
  });

  it('should be truthy', () => {
    expect(resolver).toBeTruthy();
  });

  it('should call loadUbls$', () => {
    loadUblsSpy.and.returnValue(of(null));
    resolver.resolve().subscribe(
      () => expect(ublService.loadUbls$).toHaveBeenCalledTimes(1),
      () => fail('should not fail')
    );
  });

  it('should call ErrorService on error', () => {
    loadUblsSpy.and.returnValue(throwError(null));
    resolver.resolve().subscribe(
      (res) => {
        expect(ublService.loadUbls$).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadUbls);
        expect(res).toEqual(null);
      },
      () => fail('should not fail')
    );
  });
});
