import { Injectable } from '@angular/core';
import { API_PDFS } from '../constants';
import { HttpClient } from '@angular/common/http';
import { UtilityService } from './utility.service';
import { Observable } from 'rxjs';


@Injectable()
export class GeneratePdfService {
  constructor(private http: HttpClient, private utilityService: UtilityService) {
  }

  loadPdf(content: string): Observable<Blob> {
    const url = API_PDFS.GET_PDF;
    const httpOptions = this.utilityService.getHttpOptionsForBlob();
    const params = {
      content: content
    };
    return this.http.post(url, params, httpOptions);
  }
}
