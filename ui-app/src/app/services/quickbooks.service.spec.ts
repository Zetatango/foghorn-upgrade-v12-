import { discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { QUICKBOOKS_CONNECT } from 'app/constants';
import { QuickbooksService } from './quickbooks.service';
import { UtilityService } from './utility.service';
import { AppRoutes } from 'app/models/routes';
import { LoggingService } from './logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MerchantService } from 'app/services/merchant.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { merchantDataFactory, merchantWithQuickBooksImportData } from 'app/test-stubs/factories/merchant';
import { delay, map } from 'rxjs/operators';

describe('QuickbooksService', () => {
  let quickbooksService: QuickbooksService;
  let merchantService: MerchantService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        QuickbooksService,
        UtilityService,
        CookieService,
        MerchantService,
        LoggingService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    quickbooksService = TestBed.inject(QuickbooksService);
    merchantService = TestBed.inject(MerchantService);
  });

  it('should be created', () => {
    expect(quickbooksService).toBeTruthy();
  });

  describe('quickbooksAuthUrl()', () => {
    it('should set quickbooksAuthUrl without locale if called without locale parameter', () => {
      const quickbooksUrl = quickbooksService.quickbooksAuthUrl();

      expect(quickbooksUrl).toEqual(QUICKBOOKS_CONNECT.URL_ROUTE + '?return_url=' + btoa(window.location.href));
    });

    it('should set quickbooksAuthUrl with locale if called with locale parameter', () => {
      const quickbooksUrl = quickbooksService.quickbooksAuthUrl('fr-CA');

      expect(quickbooksUrl).toEqual(QUICKBOOKS_CONNECT.URL_ROUTE + '?return_url=' + btoa(window.location.href) + '&locale=fr-CA');
    });
  });  // describe - quickbooksAuthUrl()

  describe('authFlowUrl()', () => {
    it('returns the quickbooks route', () => {
      expect(quickbooksService.authFlowUrl()).toEqual(AppRoutes.quickbooks.root_link);
    });
  });

  describe('importCheckObservable()', () => {
    let loadMerchantSpy: jasmine.Spy;
    let getMerchantSpy: jasmine.Spy;
    const loadInterval = QUICKBOOKS_CONNECT.IMPORT_REFRESH_INTERVAL;

    beforeEach(() => {
      loadMerchantSpy = spyOn(merchantService, 'loadMerchant').and.returnValue(of(null));
      getMerchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
    });

    it('should start the polling', () => {
      spyOn(quickbooksService, 'importCheck');
      quickbooksService.importCheckObservable().subscribe();
      expect(quickbooksService.importCheck).toHaveBeenCalledTimes(1);
    });

    it('loads merchant until import is done', fakeAsync(() => {
      // first time is called on the takeWhile, then called 3 times
      getMerchantSpy.and.returnValues(merchantDataFactory.build(), merchantDataFactory.build(), merchantDataFactory.build(), merchantWithQuickBooksImportData);

      quickbooksService.importCheckObservable().subscribe();

      expect(merchantService.loadMerchant).not.toHaveBeenCalled(); // getMerchant is called in pipe before the first wait
      tick(loadInterval);
      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      tick(loadInterval);
      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(2);
      tick(loadInterval);
      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(3);
      discardPeriodicTasks();
    }));

    it('handles error in load merchant', fakeAsync(() => {
      loadMerchantSpy.and.returnValues(of(null), throwError(new HttpErrorResponse({})));
      quickbooksService.importCheckObservable().subscribe(
        () => undefined,
        () => expect(merchantService.loadMerchant).toHaveBeenCalledTimes(2)
      );
      tick(loadInterval * 2);
      discardPeriodicTasks();
    }));

    it('will call complete on the observer', fakeAsync(() => {
      getMerchantSpy.and.returnValues(merchantDataFactory.build(), merchantWithQuickBooksImportData);
      quickbooksService.importCheckObservable().subscribe(
        () => undefined,
        () => undefined,
      () => expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1)
      );
      tick(loadInterval * 2);
      discardPeriodicTasks();
    }));

    it('should not call loadMerchant before the load interval', fakeAsync(() => {
      quickbooksService.importCheckObservable().subscribe();
      tick(loadInterval - 1);
      expect(merchantService.loadMerchant).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should call loadMerchant after load interval', fakeAsync(() => {
      quickbooksService.importCheckObservable().subscribe();
      tick(loadInterval);
      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      discardPeriodicTasks();
    }));

    it('should not re-call loadMerchant before load interval has passed since the last load ', fakeAsync(() => {
      const responseTime = 1000;
      loadMerchantSpy.and.returnValues(of(null).pipe(delay(responseTime), map(() => this)), of(null));
      quickbooksService.importCheckObservable().subscribe();
      expect(merchantService.loadMerchant).not.toHaveBeenCalled();
      tick(loadInterval * 2 + responseTime - 1);
      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(1);
      tick(1);
      expect(merchantService.loadMerchant).toHaveBeenCalledTimes(2);
      discardPeriodicTasks();
    }));
  }); // describe - importCheckObservable()
}); // describe - QuickbooksService
