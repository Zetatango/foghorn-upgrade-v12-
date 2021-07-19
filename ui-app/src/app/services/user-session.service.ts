import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONSTANTS } from 'app/constants';
import { UserProfile } from 'app/models/user-entities/user-profile';
import { UserProperties } from 'app/models/user-entities/user-properties';
import { ProductPreference, UpdateInsightsPreferencePut, UserSession } from 'app/models/user-entities/user-session';
import { UtilityService } from './utility.service';
import { ZttResponse } from 'app/models/api-entities/response';
import { SupportedLanguage } from 'app/models/languages';
import { Observable } from 'rxjs';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { LoggingService } from './logging.service';
import { tap } from 'rxjs/operators';

@Injectable()
export class UserSessionService {
  private _userSession: UserSession;
  private _userProfile: UserProfile;
  private _userProfiles: UserProfile[];
  private _userProperties: UserProperties;

  // PUBLIC GETTERS
  get userSession(): UserSession {
    return this._userSession;
  }

  get userProfile(): UserProfile {
    return this._userProfile;
  }

  get userProfiles(): UserProfile[] {
    return this._userProfiles;
  }

  get userProperties(): UserProperties {
    return this._userProperties;
  }

  get applicantId(): string {
    return this.userProperties?.applicant || this.userSession?.applicant_guid;
  }

  get leadId(): string {
    return this.userSession?.lead?.id;
  }

  get partner(): string {
    return this.userProperties?.partner;
  }

  get preferredLanguage(): SupportedLanguage {
    return this.userSession?.preferred_language;
  }

  get productPreference(): ProductPreference {
    return this.userSession?.product_preference;
  }

  get insightsPreference(): boolean {
    return this.userSession?.insights_preference;
  }

  get userId(): string {
    return this.userSession?.id;
  }

  // use base64 to pass email instead of in the clear
  get userEmail(): string {
    return btoa(this.userSession?.email);
  }

  get hasApplicant(): boolean {
    return !!this.applicantId;
  }

  get hasGuarantor(): boolean {
    return !!this.userProperties?.guarantor;
  }

  get hasMerchant(): boolean {
    return !!this.userProperties?.merchant;
  }

  get hasPartner(): boolean {
    return !!this.partner;
  }

  get areMultipleBusinessesSupported(): boolean {
    return !!this.userSession?.partner?.conf_allow_multiple_businesses;
  }

  get isMerchantOnboardingSupported(): boolean {
    return !!this.userSession?.partner?.conf_onboard_supported;
  }

  get isCfaCustomer(): boolean {
    return this.productPreference === ProductPreference.CFA;
  }

  get isLocCustomer(): boolean {
    return this.productPreference === ProductPreference.LOC;
  }

  get isMyBusinessLinkVisible(): boolean {
    return (this.isCfaCustomer && this.hasMerchant) || this.isLocCustomer;
  }

  constructor(private http: HttpClient,
    private loggingService: LoggingService,
    private utilityService: UtilityService) {
  }

  loadUserSession(): Observable<ZttResponse<UserSession>> {
    const url = CONSTANTS.CURRENT_USER_DATA_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get<ZttResponse<UserSession>>(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<UserSession>) => {
          this._userSession = res?.data;
          this._userProfile = this.userSession?.selected_profile;
          this._userProperties = this.userProfile?.properties;
          this._userProfiles = this.userSession?.profiles;
        }));
  }

  private putUpdateInsightsPreference(body: UpdateInsightsPreferencePut): Observable<ZttResponse<void>> {
    const url = CONSTANTS.UPDATE_INSIGHTS_PREFERENCE_PATH;
    return this.http.put<ZttResponse<void>>(url, UtilityService.trimParameters(body), this.utilityService.getHttpOptionsForBody());
  }

  async updateInsightsPreference(opt_in: boolean): Promise<ZttResponse<void>> {
    const body: UpdateInsightsPreferencePut = {
      opt_in: opt_in
    };

    const result: ZttResponse<void> = await this.putUpdateInsightsPreference(body).toPromise();

    const message = 'Updated insights preference';
    const logMessage: LogMessage = { message: message, severity: LogSeverity.info };
    this.loggingService.log(logMessage);

    return result;
  }
}
