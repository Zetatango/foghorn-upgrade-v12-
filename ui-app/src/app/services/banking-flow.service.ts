import { EventEmitter, Injectable } from '@angular/core';
import { FLINKS } from 'app/constants';
import { CookieService } from 'ngx-cookie-service';
import { ErrorModalContext } from '../components/utilities/error-modal/error-modal-context';
import { ErrorService } from 'app/services/error.service';
import { TranslateService } from '@ngx-translate/core';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';

export enum BankingContext {
  application = 'application',
  dashboard = 'dashboard',
  insights = 'insights',

  // DEPRECATED
  business_partner_registration = 'business_partner_registration',
  cash_flow = 'cash_flow',
  direct_debit = 'direct_debit',
  pre_authorized_financing = 'pre_authorized_financing',
}

export enum BankingStatus {
  need_bank_account = 'need_bank_account',
  need_connection_refresh = 'need_connection_refresh',
  need_sales_volume = 'need_sales_volume',
  bank_status_optimal = 'bank_status_optimal'
}

/**
 * This service stores logic related to the banking flow
 *
 */
@Injectable({
  providedIn: 'root'
})
export class BankingFlowService {
  // Event signifying start of banking flow
  private _startEvent = new EventEmitter<void>();
  // Event signifying interruption of banking flow
  private _cancelEvent = new EventEmitter<void>();
  // Event signifying completion of banking flow
  private _completeEvent = new EventEmitter<void>();
  // Event signifying skipping of banking flow
  private _skipEvent = new EventEmitter<void>();
  // Event to display manual bank account entry form
  private _displayManualFormEvent = new EventEmitter<void>();

  // Stores context from which banking flow was invoked
  private _context: BankingContext;
  // Stores status of merchant bank account connection
  private _status: BankingStatus;
  // Flag for displaying skip button
  private _skippable: boolean;

  /**
   * Subjects to be subscribed to by handler components.
   */
  get startEvent(): EventEmitter<void> {
    return this._startEvent;
  }

  get cancelEvent(): EventEmitter<void> {
    return this._cancelEvent;
  }

  get completeEvent(): EventEmitter<void> {
    return this._completeEvent;
  }

  get skipEvent(): EventEmitter<void> {
    return this._skipEvent;
  }

  get displayManualFormEvent(): EventEmitter<void> {
    return this._displayManualFormEvent;
  }

  /**
   * Attributes
   */
  get context(): BankingContext {
    return this._context;
  }

  get status(): BankingStatus {
    return this._status;
  }

  get skippable(): boolean {
    return this._skippable;
  }

  get needConnectionRefresh(): boolean {
    return this.status === BankingStatus.need_connection_refresh;
  }

  get registerDescription(): string {
    if (this.context === BankingContext.business_partner_registration) {
      return 'SET_BANK_INSTRUCTIONS.BUSINESS_PARTNER';
    } else if (this.status === BankingStatus.need_sales_volume) {
      return 'SET_BANK_INSTRUCTIONS.SALES_VOLUME';
    } else if (this.status === BankingStatus.need_connection_refresh) {
      return 'SET_BANK_INSTRUCTIONS.REFRESH_BANK';
    } else if (this.context === BankingContext.insights) {
      return 'SET_BANK_INSTRUCTIONS.INSIGHTS';
    } else {
      return 'SET_BANK_INSTRUCTIONS.BANK_ACCOUNT';
    }
  }

  get pickerDescription(): string {
    if (this.context === BankingContext.business_partner_registration) {
      return 'CHOOSE_BANKACCT_INSTRUCTIONS_BUSINESS_PARTNER';
    } else if (this.status === BankingStatus.need_sales_volume) {
      return 'CHOOSE_BANKACCT_INSTRUCTIONS_SALES_VOLUME';
    } else if (this.context === BankingContext.insights) {
      return 'CHOOSE_BANKACCT_INSTRUCTIONS_INSIGHTS';
    } else {
      return 'CHOOSE_BANKACCT_INSTRUCTIONS';
    }
  }

  get allowManualInput(): boolean {
    switch (this.context) {
      case BankingContext.business_partner_registration:
        return true;
      case BankingContext.dashboard:
      case BankingContext.application:
      case BankingContext.direct_debit:
      case BankingContext.pre_authorized_financing:
        return false;
      default:
        return false;
    }
  }

  get sourceFilter(): string {
    if (this.context === BankingContext.business_partner_registration) {
      return '';
    } else if (this.status === BankingStatus.need_sales_volume) {
      return 'flinks';
    } else if (this.context === BankingContext.application || this.context === BankingContext.dashboard || this.context === BankingContext.insights) {
      return 'flinks';
    } else {
      return '';
    }
  }

  get flinksRequestId(): string {
    return this.cookieService.get(FLINKS.COOKIE_KEY.REQUEST_ID);
  }

  get flinksRoute(): string {
    return this.cookieService.get(FLINKS.COOKIE_KEY.ROUTE);
  }

  /**
   * Utility attributes
   */
  get applicationContext(): boolean {
    return this.context === BankingContext.application;
  }

  constructor(
    private cookieService: CookieService,
    private errorService: ErrorService,
    private translateService: TranslateService
  ) {
  }

  /**
   * Methods to be called to trigger events
   */
  triggerStartEvent(): void {
    this.startEvent.emit();
  }

  triggerCancelEvent(): void {
    this.cancelEvent.emit();
  }

  triggerCompleteEvent(): void {
    this.completeEvent.emit();
  }

  triggerSkipEvent(): void {
    this.skipEvent.emit();
  }

  triggerDisplayManualFormEvent(): void {
    this.displayManualFormEvent.emit();
  }

  /**
   * Sets attributes needed for the banking flow.
   *
   * @param context - indicates the context from which flow was invoked.
   * @param skippable - indicates whether flow should include skip button.
   * @param status - indicates the status of merchant re: bank account connection.
   */
  setAttributes(skippable = false, status = BankingStatus.need_bank_account): void {
    this._skippable = skippable;
    this._status = status;
  }

  setContext(context: BankingContext): void {
    this._context = context;
  }

  /**
   * Clears attributes from service.
   *
   * NOTE: This method should be called from ngOnDestroy() in any component that invokes the banking flow
   */
  clearAttributes(): void {
    this._context = null;
    this._skippable = false;
    this._status = null;
  }

  /**
   * Clears flinks_route cookie from root and on_boarding paths.
   */
  clearFlinksRouteCookie(): void {
    this.cookieService.delete(FLINKS.COOKIE_KEY.ROUTE, '/');
    this.cookieService.delete(FLINKS.COOKIE_KEY.ROUTE, '/on_boarding');
  }

  /**
   * Clears flinks_request_id cookie.
   */
  clearFlinksRequestIdCookie(): void {
    this.cookieService.delete(FLINKS.COOKIE_KEY.REQUEST_ID, '/');
  }

  /**
   * Returns true if flinks flow is in progress for given context, returns false otherwise.
   */
  isBankFlowInProgress(context: BankingContext): boolean {
    return this.flinksRoute === context;
  }

  /**
   * Displays connection error modal and routes to upload docs, shared among components
   */
  showConnectionErrorModalToUpload(): void {
    const context: ErrorModalContext = new ErrorModalContext(
      'BANK_INFO.BANK_CONNECT_ERROR_HEADER',
      [
        this.translateService.instant('BANK_INFO.BANK_CONNECT_ERROR_MESSAGE')
      ],
      AppRoutes.documents.upload_banking,
      true
    );

    this.errorService.show(UiError.bankConnectError, context);
  }
}
