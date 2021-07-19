/**
 * What goes here?
 *
 * Code that is intended to be reused across many places.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardDataListComponent } from 'app/components/containers/dashboard-data-list/dashboard-data-list.component';
import { GenericErrorPageComponent } from 'app/components/states/generic-error-page/generic-error-page.component';
import { QuickbooksConnectButtonComponent } from 'app/components/states/quickbooks-connect-button/quickbooks-connect-button.component';
import { QuickbooksConnectCardComponent } from 'app/components/states/quickbooks-connect-card/quickbooks-connect-card.component';
import { QuickbooksConnectInfoComponent } from 'app/components/states/quickbooks-connect-info/quickbooks-connect-info.component';
import { AddressFormComponent } from 'app/components/utilities/address-form/address-form.component';
import { ApplicationProgressComponent } from 'app/components/utilities/application-progress/application-progress.component';
import { DatePickerComponent } from 'app/components/utilities/date-picker/date-picker.component';
import { ExpandableListComponent } from 'app/components/utilities/expandable-list/expandable-list.component';
import { LoadingComponent } from 'app/components/utilities/loading/loading.component';
import { PafTermsModalComponent } from 'app/components/utilities/paf-terms-modal/paf-terms-modal.component';
import { PrintPdfComponent } from 'app/components/utilities/print-pdf/print-pdf.component';
import { SearchBoxComponent } from 'app/components/utilities/search-box/search-box.component';
import { UploadBoxComponent } from 'app/components/utilities/upload-box/upload-box.component';
import { SharedDirectivesModule } from 'app/shared/shared-directives.module';
import { SharedFormsModule } from 'app/shared/shared-forms.module';
import { SharedPipesModule } from 'app/shared/shared-pipes.module';
import { SharedUiModule } from 'app/shared/shared-ui.module';

const declarations = [
  AddressFormComponent,
  ApplicationProgressComponent,
  DashboardDataListComponent,
  DatePickerComponent,
  ExpandableListComponent,
  GenericErrorPageComponent,
  LoadingComponent,
  PafTermsModalComponent,
  PrintPdfComponent,
  QuickbooksConnectButtonComponent, // move quickbooks to its own module
  QuickbooksConnectCardComponent, // move quickbooks to its own module
  QuickbooksConnectInfoComponent, // move quickbooks to its own module
  SearchBoxComponent, // only used in data list component
  UploadBoxComponent
];

const modules = [
  CommonModule,
  NgSelectModule,
  SharedDirectivesModule,
  SharedFormsModule,
  SharedPipesModule,
  SharedUiModule,
  TranslateModule
];

@NgModule({
  declarations: declarations,
  imports: modules,
  exports: [...modules, ...declarations]
})
export class SharedModule {
}
