/**
 * What goes here?
 *
 * Form Modules that are intended to be reused across many places.
 */

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IMaskModule } from 'angular-imask';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxCleaveDirectiveModule } from 'ngx-cleave-directive';

const import_modules = [
  BsDatepickerModule.forRoot(),
  FormsModule,
  IMaskModule,
  NgxCleaveDirectiveModule,
  ReactiveFormsModule
];

const export_modules = [
  BsDatepickerModule,
  FormsModule,
  IMaskModule,
  NgxCleaveDirectiveModule,
  ReactiveFormsModule
];

@NgModule({
  imports: import_modules,
  exports: export_modules
})
export class SharedFormsModule {
}
