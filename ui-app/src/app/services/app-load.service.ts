import { Injectable } from '@angular/core';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from 'app/services/logging.service';
import { LogSeverity } from 'app/models/api-entities/log';
import { UserSessionService } from './user-session.service';
import { BusinessPartnerService } from './business-partner.service';
import { MerchantService } from './merchant.service';
import { LeadService } from './lead.service';
import { TranslateService } from '@ngx-translate/core';
import { SupportedLanguage } from 'app/models/languages';
import { ApplicationConfiguration } from 'app/models/application-configuration';
import { ErrorHandlerService } from './error-handler.service';
import { ErrorResponse } from "app/models/error-response";
import { BankAccountService } from './bank-account.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ZttResponse } from 'app/models/api-entities/response';
import { UserSession } from 'app/models/user-entities/user-session';

@Injectable()
export class AppLoadService {

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private bankAccountService: BankAccountService,
    private configService: ConfigurationService,
    private errorHandlerService: ErrorHandlerService,
    private leadService: LeadService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private translateService: TranslateService,
    private userSessionService: UserSessionService) {
  }

  loadAppConfig(): Promise<ApplicationConfiguration | void> {
    return this.configService.loadConfig().toPromise()
      .then(() => {
        this.errorHandlerService.initBugsnagClient(this.configService.bugsnagApiKey, this.configService.initialAppVersion);
      })
      .catch((err: ErrorResponse) => this.loggingService.log({
        message: `Error occurred trying to load config from configuration service: ${err.statusCode} - ${err.message}`,
        severity: LogSeverity.warn
      }));
  }

  loadUserData(): Observable<ZttResponse<UserSession>> {
    return this.userSessionService.loadUserSession()
      .pipe(
        tap(
          () => {
            this.setApplicationLanguage(this.userSessionService.preferredLanguage);
            this.leadService.setLead(this.userSessionService.userSession.lead);
            this.merchantService.setMerchant(this.userSessionService.userSession.merchant);
            this.bankAccountService.setBankAccountOwner(this.userSessionService.userSession.merchant || this.userSessionService.userSession.lead);

            if (this.configService.businessPartnerEnabled) {
              this.businessPartnerService.setBusinessPartnerApplication(this.userSessionService.userSession.business_partner_application);
            }

            const metadata = {
              applicantId: this.userSessionService.applicantId,
              leadId: this.userSessionService.leadId,
              merchantId: this.merchantService.merchantId,
              userId: this.userSessionService.userId,
            };
            this.errorHandlerService.initMetadata(metadata);
          },
          (err: ErrorResponse) => {
            this.loggingService.log({
              message: `Error occurred trying to load user data from user session service: ${err.statusCode} - ${err.message}`,
              severity: LogSeverity.warn
            });
          }
        )
      );
  }

  setApplicationLanguage(preferredLanguage: SupportedLanguage): void {
    if (!Object.values(SupportedLanguage).includes(preferredLanguage)) {
      preferredLanguage = SupportedLanguage.default;
    }
    this.translateService.use(preferredLanguage);
  }
}
