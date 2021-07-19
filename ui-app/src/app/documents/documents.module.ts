import { NgModule } from '@angular/core';
import { DocumentsComponent } from 'app/documents/documents.component';
import { DocumentsRoutingModule } from 'app/documents/documents-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { UploadBankingComponent } from 'app/documents/upload-banking/upload-banking.component';
import { MyDocumentsComponent } from './my-documents/my-documents.component';
import { UploadedDocumentsComponent } from 'app/documents/uploaded-documents/uploaded-documents.component';

@NgModule({
  declarations: [
    DocumentsComponent,
    UploadBankingComponent,
    MyDocumentsComponent,
    UploadedDocumentsComponent
  ],
  imports: [
    DocumentsRoutingModule,
    SharedModule,
    TranslateModule.forChild()
  ]
})
export class DocumentsModule {}
