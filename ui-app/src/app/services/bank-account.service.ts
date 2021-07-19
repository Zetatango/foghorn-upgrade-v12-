import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ZttResponse } from 'app/models/api-entities/response';
import { tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { BankAccount, BankAccountOwner, BankAccountPost, BankAccountSource } from 'app/models/bank-account';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { API_BANK_ACCOUNTS, API_MERCHANT, FLINKS } from 'app/constants';
import { FlinksRequestResponse } from 'app/models/api-entities/flinks-request';
import { Merchant } from 'app/models/api-entities/merchant';
import { Lead } from 'app/models/api-entities/lead';
import { LeadService } from './lead.service';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage } from 'app/models/error-response';
import { BankingStatus } from './banking-flow.service';

@Injectable()
export class BankAccountService {
  addingBankAccount = new Subject<boolean>();
  bankAccountState = new Subject<string>();
  acceptButtonState = new Subject<boolean>();
  selectedBankAccount: BankAccount;
  selectedInsightsBankAccounts: BankAccount[];
  insightsBankAccounts: BankAccount[];
  selectedBankAccountId: string;
  selectedInsightsBankAccountsIds: string[] = [];
  owner: BankAccountOwner;
  owner$: BehaviorSubject<BankAccountOwner> = new BehaviorSubject(new BankAccountOwner(null));
  // New generic flow variables
  private _bankAccount = new BehaviorSubject<BankAccount>(null);
  bankAccounts: BankAccount[] = []; // TODO: Convert to a BehaviourSubject.
  bankAccountLoadingState = new Subject<BankAccountLoadingState>();
  private _increaseLimit = false;
  get bankAccount(): BehaviorSubject<BankAccount> {
    return this._bankAccount;
  }

  get increaseLimit(): boolean {
    return this._increaseLimit;
  }

  set increaseLimit(value: boolean) {
    this._increaseLimit = value;
  }

  constructor(
    private http: HttpClient,
    private leadService: LeadService,
    private merchantService: MerchantService,
    private utilityService: UtilityService) {
      this.setBankAccountOwner(null);
    }

  loadBankAccounts(source = ''): Observable<ZttResponse<BankAccount[]>> {
    const url = this.utilityService.getAugmentedUrl(API_BANK_ACCOUNTS.GET_BANK_ACCOUNTS_PATH, { source: source });
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.get(url, httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<BankAccount[]>) => this.bankAccounts = res?.data
        )
      );
  }

  postBankAccount(body: BankAccountPost): Observable<ZttResponse<Merchant>> {
    const url = API_BANK_ACCOUNTS.CREATE_NEW_BANK_ACCOUNT_PATH;
    return this.http.post<ZttResponse<Merchant>>(url, UtilityService.trimParameters(body), this.utilityService.getHttpOptionsForBody());
  }

  createBankAccount(body: BankAccountPost): Observable<ZttResponse<Merchant>> {
    return this.postBankAccount(body)
      .pipe(
        tap((res: ZttResponse<Merchant>) => this.merchantService.setMerchant(res.data))
      );
  }

  setSelectedBankAccount(bankAccount: BankAccount): Observable<ZttResponse<Merchant>> {
    this.selectedBankAccount = bankAccount;
    this.selectedBankAccountId = bankAccount.id;
    let resp: Observable<ZttResponse<Merchant>>;
    // only record sales volume for merchant if they already have a bank account & sales volume required
    if (this.merchantService.merchantHasSelectedBankAccount() && this.merchantService.merchantSalesVolumeRequired()) {
      resp = this.selectSalesVolumeAccounts(this.selectedBankAccount.owner_guid, [this.selectedBankAccount.id]);
    } else {
      resp = this.selectBankAccount(this.selectedBankAccount.owner_guid, this.selectedBankAccount.id);
    }
    return resp;
  }

  setSelectedInsightsBankAccounts(bankAccounts: BankAccount[]): Observable<ZttResponse<Lead | Merchant>> {
    this.selectedInsightsBankAccounts = bankAccounts;
    this.selectedInsightsBankAccountsIds = this.selectedInsightsBankAccounts.map(account => account.id);

    return this.selectInsightsBankAccounts(this.selectedInsightsBankAccountsIds);
  }

  loadBankAccount(id: string): Observable<ZttResponse<BankAccount>> {
    const url = API_BANK_ACCOUNTS.GET_BANK_ACCOUNT_PATH.replace(':id', id);

    return this.http.get(url, this.utilityService.getHttpOptionsForBody())
      .pipe(
        tap((res: ZttResponse<BankAccount>) => this._bankAccount.next(res.data))
      );
  }

  pollFlinks(requestId: string): Observable<FlinksRequestResponse> {
    const options = this.utilityService.getHttpOptionsForBody();
    return this.http.get<FlinksRequestResponse>(FLINKS.GET_REQUEST_STATE_PATH.concat(`/${requestId}`), options);
  }

  selectBankAccount(ownerGuid: string, bankAccountId: string): Observable<ZttResponse<Merchant>> {
    const url = API_BANK_ACCOUNTS.SELECT_BANK_ACCOUNT_PATH;
    const params = {
      owner_guid: ownerGuid,
      bank_account_id: bankAccountId
    };
    const options = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<Merchant>>(url, params, options)
      .pipe(
        tap((res: ZttResponse<Merchant>) => this.merchantService.setMerchant(res.data))
      );
  }

  selectSalesVolumeAccounts(ownerGuid: string, bankAccountIds: string[]): Observable<ZttResponse<Merchant>> {
    const url = API_BANK_ACCOUNTS.SELECT_SALES_VOLUME_ACCOUNTS_PATH;
    const params = {
      owner_guid: ownerGuid,
      bank_account_ids: bankAccountIds
    };
    const options = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<Merchant>>(url, params, options)
      .pipe(
        tap((res: ZttResponse<Merchant>) => this.merchantService.setMerchant(res.data))
      );
  }

  selectInsightsBankAccounts(bankAccountIds: string[]): Observable<ZttResponse<Lead | Merchant>> {
    let observable$ = of(null);
    if (this.owner.isLead()) {
      observable$ = this.leadService.updateSelectedInsightsAccounts(this.owner.id, bankAccountIds);
    } else if (this.owner.isMerchant()) {
      observable$ = this.selectMerchantInsightsBankAccounts(bankAccountIds);
    } else {
      Bugsnag.notify(new ErrorMessage('Unknown owner'));
    }
    return observable$.pipe(
      tap((res: ZttResponse<Lead | Merchant>) => {
        this.setBankAccountOwner(res?.data);
      })
    );
  }

  updateDesiredBankBalance(amount: number): Observable<ZttResponse<Lead | Merchant>> {
    let observable$ = of(null);
    if (this.owner.isLead()) {
      observable$ = this.leadService.updateDesiredBankAccountBalance(this.owner.id, amount);
    } else if (this.owner.isMerchant()) {
      observable$ = this.merchantService.updateDesiredBankAccountBalance(this.owner.id, amount);
    } else {
      Bugsnag.notify(new ErrorMessage('Unknown owner'));
    }

    return observable$.pipe(
      tap((res: ZttResponse<Lead | Merchant>) => {
        this.setBankAccountOwner(res?.data);
      })
    );
  }

  postIncreaseLimit(): Observable<ZttResponse<void>> {
    const url = API_MERCHANT.INCREASE_LIMIT_PATH;
    return this.http.post<ZttResponse<void>>(url, {}, this.utilityService.getHttpOptionsForBody());
  }

  private selectMerchantInsightsBankAccounts(bankAccountIds: string[]): Observable<ZttResponse<Merchant>> {
    const url = API_BANK_ACCOUNTS.SELECT_INSIGHTS_BANK_ACCOUNTS_PATH;
    const params = {
      owner_guid: this.owner.id,
      bank_account_ids: bankAccountIds
    };
    const options = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<Merchant>>(url, params, options)
      .pipe(
        tap((res: ZttResponse<Merchant>) => this.merchantService.setMerchant(res.data))
      );
  }

  /**
   * New generic flow methods
   */
  setBankAccountLoadingState(value: BankAccountLoadingState): void {
    this.bankAccountLoadingState.next(value);
  }

  // HELPERS

  isBankAccountVerified(bankAccount: BankAccount): boolean {
    return !!bankAccount && bankAccount.verified === 'true';
  }

  isBankAccountFromManual(bankAccount: BankAccount): boolean {
    return !!bankAccount && bankAccount.source === BankAccountSource.manual;
  }

  isBankAccountFromFlinks(bankAccount: BankAccount): boolean {
    return !!bankAccount && bankAccount.source === BankAccountSource.flinks;
  }

  setBankAccountOwner(owner: Lead | Merchant): void {
    this.owner = new BankAccountOwner(owner);
    this.owner$.next(this.owner);
    this.selectedInsightsBankAccountsIds = this.owner.selected_insights_bank_accounts;
  }

  /**
   * Returns status for triggering bank account. Returns null if there is no status to trigger banking flow.
   *
   * Used by components to determine UX for the banking flow.
   */
   getBankingStatus(): BankingStatus {
    if (this.merchantService.merchantHasSelectedBankAccount()) {
      if (this.merchantService.merchantSalesVolumeRequired()) {
        return BankingStatus.need_sales_volume;
      }
      else if (this.owner.bankConnectionRequired()) {
        return BankingStatus.need_connection_refresh;
      } 
      else {
        return BankingStatus.bank_status_optimal;
      }
    } else {
      return BankingStatus.need_bank_account;
    }
  }

}

/**
 * Indicates current state of bank accounts loading.
 *
 * - LOADED: indicates bank accounts exist and have been loaded
 * - LOADING: indicates a request is still in process and bank accounts are still loading
 * - READY: indicates no bank accounts have been loaded
 * - FAILED: indicates that request to flinks failed
 */
export enum BankAccountLoadingState {
  LOADED = 'loaded',
  LOADING = 'loading',
  READY = 'ready',
  FAILED = 'failed',
  MANUAL = 'manual'
}
