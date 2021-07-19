import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentsComponent } from 'app/documents/documents.component';
import { BANKING_DOC_SELECT_OPTIONS, DOC_SELECT_OPTIONS } from 'app/models/api-entities/merchant-document-status';
import { StateRoute } from 'app/models/routes';
import { UploadBankingComponent } from 'app/documents/upload-banking/upload-banking.component';
import { MyDocumentsComponent } from 'app/documents/my-documents/my-documents.component';

/**
 * The DocumentComponent has a base template, which will render
 * different content sections based on the child path.
 *
 * @documentTypes will be limited by the specified route.
 * @showMerchantDocuments will be determined by the specified route.
 */
const routes: Routes = [
  {
    path: '',
    component: DocumentsComponent,
    data: {
      title_key: 'DOCUMENTS.MY_DOCUMENTS',
      documentTypes: DOC_SELECT_OPTIONS,
      showMerchantDocuments: true
    },
    children: [
      { path: '', component: MyDocumentsComponent },
      {
        path: StateRoute.upload_banking,
        component: UploadBankingComponent,
        data: {
          title_key: 'DOCUMENTS.UPLOAD_BANKING',
          documentTypes: BANKING_DOC_SELECT_OPTIONS,
          showMerchantDocuments: false
        }
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class DocumentsRoutingModule {}
