import { Injectable, NgZone } from '@angular/core';
import { QUICKBOOKS_CONNECT } from 'app/constants';
import { UtilityService } from './utility.service';
import { LoggingService } from './logging.service';
import { OmniauthProviderService } from './omniauth-provider.service';
import { AppRoutes } from 'app/models/routes';
import { MerchantService } from 'app/services/merchant.service';
import { BehaviorSubject, Observable, Observer, Subject, Subscription } from 'rxjs';
import { delay, finalize, map, take, takeWhile } from 'rxjs/operators';
import { Merchant } from 'app/models/api-entities/merchant';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class QuickbooksService extends OmniauthProviderService {
  quickbooksImportSubscription: Subscription;
  quickbooksOpen: Subject<void> = new Subject();

  private _quickbooksUrl = AppRoutes.quickbooks.root_link;
  private _quickbooksImportPollInterval = QUICKBOOKS_CONNECT.IMPORT_REFRESH_INTERVAL;
  private _importObserver: Observer<void>;

  constructor(
    private _utilityService: UtilityService,
    private _merchantService: MerchantService,
    loggingService: LoggingService,
    ngZone: NgZone
  ) {
    super(ngZone, loggingService);
  }

  quickbooksAuthUrl(locale?: string): string {
    const encodedUrl = btoa(window.location.href);
    const params = {
      return_url: encodedUrl
    };
    if (locale) params['locale'] = locale;

    return this._utilityService.getAugmentedUrl(QUICKBOOKS_CONNECT.URL_ROUTE, params);
  }

  authFlowUrl(): string {
    return this._quickbooksUrl;
  }

  importCheckObservable(): Observable<void> {
    return new Observable<void>((observer: Observer<void>) => {
      this._importObserver = observer;
      this.importCheck();
    });
  }

  importCheck(): void {
    const readyForNextSource: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

    readyForNextSource
      .pipe(
        takeWhile(() => !this.isQuickBooksImportDone()),
        delay(this._quickbooksImportPollInterval),
        finalize(() => this._importObserver.complete()),
        map(() => this._merchantService.loadMerchant())
      )
      .subscribe((merchantObs: Observable<ZttResponse<Merchant>>) => {
        merchantObs
          .pipe(take(1))
          .subscribe(
            () => {
              readyForNextSource.next(true);
            },
            (err: ErrorEvent) => {
              this._importObserver.error(err);
            }
          );
      });
  }

  private isQuickBooksImportDone(): boolean {
    const merchant = this._merchantService.getMerchant();
    return merchant && !!merchant.quickbooks_imported_at;
  }
}
