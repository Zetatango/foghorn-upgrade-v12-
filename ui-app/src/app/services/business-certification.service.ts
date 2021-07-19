import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MerchantQuerySelectPost } from 'app/models/api-entities/merchant-query';
import { CONSTANTS, ONBOARDING } from 'app/constants';
import { UtilityService } from 'app/services/utility.service';
import { ApplicantPost } from 'app/models/api-entities/applicant-post';
import { StateRoutingService } from 'app/services/state-routing.service';
import { SubmitApplicantResponse } from 'app/models/api-entities/applicant';
import { ZttResponse } from 'app/models/api-entities/response';
import { Merchant } from 'app/models/api-entities/merchant';
import { Observable } from 'rxjs';

/**
 * @deprecated
 *  `selectBusiness` should belong the the merchant.service.ts
 *  `reauth` probably should belong to the user-session.service.ts
 *  `submitApplication` should belong to a dedicated applicant.service.ts
 */
@Injectable()
export class BusinessCertificationService {

  constructor(private utilityService: UtilityService,
              private http: HttpClient) {}

  // TODO [Refactor]: Should be moved to merchant service.
  selectBusiness(merchantQuerySelectData: MerchantQuerySelectPost): Observable<ZttResponse<Merchant>> {
    const url = ONBOARDING.POST_MERCHANT_QUERY_SELECT_PATH;
    const postHttpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<Merchant>>(url , merchantQuerySelectData, postHttpOptions)
  }

  // TODO [Refactor]: Should be moved to userSession service.
  reauth(sessionParams = {}): void {
    const login_url = this.utilityService.getAugmentedUrl(CONSTANTS.AUTO_LOGIN_URL, sessionParams);
    StateRoutingService.performRedirect(login_url);
  }

  // TODO [Refactor]: Should be moved to a (new) standalone applicant service.
  async submitApplicant(applicant: ApplicantPost): Promise<ZttResponse<SubmitApplicantResponse>> {
    const url = ONBOARDING.POST_APPLICANT_PATH;
    const httpHeaders = this.utilityService.getHttpOptionsForBody();
    return this.http.post<ZttResponse<SubmitApplicantResponse>>(url, UtilityService.trimParameters(applicant), httpHeaders)
      .toPromise();
  }
}
