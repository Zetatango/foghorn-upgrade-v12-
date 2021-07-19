import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UtilityService } from 'app/services/utility.service';
import { EncryptionBundle } from 'app/models/encryption-bundle';
import { API_CRYPTO } from 'app/constants';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable({
  providedIn: 'root'
})

export class CryptoService {

  constructor(
    public http: HttpClient,
    private utilityService: UtilityService) {}

  fetchEncryptionBundle(filename: string): Observable<ZttResponse<EncryptionBundle>> {
    const url = API_CRYPTO.ENCRYPTION_BUNDLE;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.post<ZttResponse<EncryptionBundle>>(url, { filename: filename }, httpOptions);
  }
}
