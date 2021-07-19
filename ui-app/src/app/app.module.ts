import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BankingFlowService } from './services/banking-flow.service';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// LAYOUTS
import { AppLayoutComponent } from 'app/layouts/app-layout.component';
import { MinLayoutComponent } from 'app/layouts/min-layout.component';

// DIRECTIVES
import { JurisdictionBusinessNumberValidatorDirective } from './directives/jurisdiction-business-number-validator.directive';
import { CashFlowDirective } from 'app/components/routes/cash-flow/cash-flow.directive';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppLoadModule } from 'app/app.load.module';

// COMPONENT - STATES
import { NoLendingOfferComponent } from './components/states/no-lending-offers/no-lending-offers.component';
import { KycFailedComponent } from './components/states/kyc-failed/kyc-failed.component';

// COMPONENT - CONTAINERS
import { DelegatedModeComponent } from './components/containers/delegated-mode/delegated-mode.component';
import { MessageCardComponent } from './components/utilities/message-card/message-card.component';
import { CashFlowComponent } from './components/routes/cash-flow/cash-flow.component';
import { CashFlowEndComponent } from './components/containers/cash-flow-end/cash-flow-end.component';
import { QuickbooksConnectSummaryComponent } from './components/containers/quickbooks-connect/quickbooks-connect-summary/quickbooks-connect-summary.component';


// SERVICES
import { AgreementService } from './services/agreement.service';
import { MerchantService } from './services/merchant.service';
import { LoadingService} from './services/loading.service';
import { ErrorService } from './services/error.service';
import { StateRoutingService } from './services/state-routing.service';
import { BankAccountService } from './services/bank-account.service';
import { ReauthService } from './services/reauth.service';
import { BusinessCertificationService } from './services/business-certification.service';
import { OfferService } from './services/offer.service';
import { InvoiceService } from './services/invoice.service';
import { SupplierService } from './services/supplier.service';
import { UtilityService } from './services/utility.service';
import { UserSessionService } from './services/user-session.service';
import { ApplicantService } from './services/applicant.service';
import { BorrowerInvoiceService } from './services/borrower-invoice.service';
import { UblService } from './services/ubl.service';
import { DynamicComponentService } from './services/dynamic-component.service';
import { BusinessPartnerService } from './services/business-partner.service';
import { BusinessPartnerMerchantService } from './services/business-partner-merchant.service';
import { QuickbooksService } from './services/quickbooks.service';
import { DirectPaymentService} from './services/direct-payment.service';
import { TransactionsService } from './services/transactions.service';
import { GeneratePdfService } from './services/generate-pdf.service';

// ANGULAR MATERIAL
import { SharedModule } from 'app/shared/shared.module';
import { LoggingService } from 'app/services/logging.service';
import { CoreModule } from 'app/core/core.module';
import { ErrorModalComponent } from 'app/components/utilities/error-modal/error-modal.component';
import { FooterComponent } from 'app/components/containers/footer/footer.component';
import { HeaderComponent } from 'app/components/containers/header/header.component';
import { LangSelectorComponent } from 'app/components/utilities/lang-selector/lang-selector.component';
import { NavToggleDirective } from 'app/directives/nav-toggle.directive';
import { HeaderService } from 'app/services/header.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

/**
 * Register fr data in addition to default en
 */
registerLocaleData(localeFr);

export function HttpLoaderFactory(httpClient: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    AppLayoutComponent,
    CashFlowComponent,
    CashFlowDirective,
    CashFlowEndComponent,
    DelegatedModeComponent,
    ErrorModalComponent,
    FooterComponent, // move header / footer to module and import there.
    HeaderComponent, // move header / footer to module and import there.
    JurisdictionBusinessNumberValidatorDirective,
    KycFailedComponent,
    LangSelectorComponent, // move header / footer to module and import there.
    MessageCardComponent,
    MinLayoutComponent,
    NavToggleDirective, // move header / footer to module and import there.
    NoLendingOfferComponent,
    QuickbooksConnectSummaryComponent,
  ],
  imports: [
    AppLoadModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CoreModule,
    HttpClientModule,
    SharedModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    AgreementService,
    ApplicantService,
    BankAccountService,
    BankingFlowService,
    BorrowerInvoiceService,
    BusinessCertificationService,
    BusinessPartnerMerchantService,
    BusinessPartnerService,
    CookieService,
    DirectPaymentService,
    DynamicComponentService,
    ErrorService,
    GeneratePdfService,
    HeaderService, // move header / footer to module and import there.
    InvoiceService,
    LoadingService,
    LoggingService,
    MerchantService,
    OfferService,
    QuickbooksService,
    ReauthService,
    StateRoutingService,
    SupplierService,
    Title,
    TransactionsService,
    TranslateService,
    UblService,
    UserSessionService,
    UtilityService
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
