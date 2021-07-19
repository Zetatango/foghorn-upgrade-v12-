import { Component } from '@angular/core';
import { CustomUploadFile } from 'app/models/custom-upload-file';
import { UploadBoxComponent } from 'app/components/utilities/upload-box/upload-box.component';

@Component({
  selector: 'ztt-upload-box',
  template: '',
  providers: [
    {
      provide: UploadBoxComponent,
      useClass: UploadBoxComponentStub
    }
  ]
})
export class UploadBoxComponentStub {
  files = [] as CustomUploadFile[];
}
