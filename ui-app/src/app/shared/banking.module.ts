import { NgModule } from '@angular/core';
import { BankAccountsErrorComponent } from 'app/components/containers/bank-accounts-error/bank-accounts-error.component';
import { BankAccountsLoadingComponent } from 'app/components/containers/bank-accounts-loading/bank-accounts-loading.component';
import { BankAccountsPickerComponent } from 'app/components/containers/bank-accounts-picker/bank-accounts-picker.component';
import { BankAccountsRegisterComponent } from 'app/components/containers/bank-accounts-register/bank-accounts-register.component';
import { BankFlinksComponent } from 'app/components/containers/bank-flinks/bank-flinks.component';
import { ConnectBankManuallyComponent } from 'app/components/containers/connect-bank-manually/connect-bank-manually.component';
import { AddBankAccountManualComponent } from 'app/components/states/add-bank-account-manual/add-bank-account-manual.component';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { OfferModule } from 'app/offer/offer.module';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
  declarations: [
    AddBankAccountManualComponent,
    BankAccountsErrorComponent,
    BankAccountsLoadingComponent,
    BankAccountsPickerComponent,
    BankAccountsRegisterComponent,
    BankFlinksComponent,
    ConnectBankManuallyComponent,
    SetUpBankComponent
  ],
  imports: [
    OfferModule,
    SharedModule
  ]
})
export class BankingModule {
}
