/**
 * What goes here?
 *
 * UI Modules that are intended to be reused across many places.
 */

import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DataTablesModule } from 'angular-datatables';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MarkdownModule } from 'ngx-markdown';
import { NgxUploaderModule } from 'ngx-uploader';

const import_modules = [
  AlertModule.forRoot(),
  CollapseModule.forRoot(),
  DataTablesModule.forRoot(),
  FontAwesomeModule,
  InfiniteScrollModule,
  MarkdownModule.forRoot(),
  ModalModule.forRoot(),
  NgxUploaderModule,
  ProgressbarModule.forRoot(),
  TabsModule.forRoot(),
  TooltipModule.forRoot()
];

const export_modules = [
  AlertModule,
  CollapseModule,
  DataTablesModule,
  FontAwesomeModule,
  InfiniteScrollModule,
  MarkdownModule,
  ModalModule,
  NgxUploaderModule,
  ProgressbarModule,
  TabsModule,
  TooltipModule
];

@NgModule({
  imports: import_modules,
  exports: export_modules
})
export class SharedUiModule {
}
