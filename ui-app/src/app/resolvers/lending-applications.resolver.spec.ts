import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { LendingApplicationsResolver } from './lending-applications.resolver';
import { ErrorService } from 'app/services/error.service';
import { throwError, of } from 'rxjs';
import { UiError } from 'app/models/ui-error';

describe('LendingApplicationsResolver', () => {
  let resolver: LendingApplicationsResolver;
  let errorService: ErrorService;
  let lendingApplicationsService: LendingApplicationsService;

  let loadApplicationSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService, LendingApplicationsService, UtilityService, ErrorService]
    });

    errorService = TestBed.inject(ErrorService);
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    resolver = new LendingApplicationsResolver(errorService, lendingApplicationsService);

    loadApplicationSpy = spyOn(lendingApplicationsService, 'loadApplications');
    spyOn(errorService, 'show');
  });

  it('should be truthy', () => {
    expect(resolver).toBeTruthy();
  });

  it('should call loadApplications', () => {
    loadApplicationSpy.and.returnValue(of(null));
    resolver.resolve().subscribe(
      () => expect(lendingApplicationsService.loadApplications).toHaveBeenCalledTimes(1),
      () => fail('should not fail')
    );
  });

  it('should call ErrorService on error', () => {
    loadApplicationSpy.and.returnValue(throwError(null));
    resolver.resolve().subscribe(
      (res) => {
        expect(lendingApplicationsService.loadApplications).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadLendingApplications);
        expect(res).toEqual(null);
      },
      () => fail('should not fail')
    );
  });
});
