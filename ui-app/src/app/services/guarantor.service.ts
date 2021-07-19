import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UtilityService } from 'app/services/utility.service';
import { GUARANTOR } from 'app/constants';
import { Observable } from 'rxjs';
import { GuarantorPost } from 'app/models/api-entities/guarantor';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable({
  providedIn: 'root'
})
export class GuarantorService {

  constructor(private utility: UtilityService,
              private http: HttpClient) {
  }

  addGuarantor(guarantor: GuarantorPost): Observable<ZttResponse<void | ErrorEvent>> {
    const url = GUARANTOR.POST_ADD_GUARANTOR;
    const httpOptions = this.utility.getHttpOptionsForBody();

    return this.http.post<ZttResponse<void>>(url, guarantor, httpOptions);
  }
}
