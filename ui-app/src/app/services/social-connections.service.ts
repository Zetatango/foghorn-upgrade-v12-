import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_SOCIAL_CONNECTIONS } from 'app/constants';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { UtilityService } from './utility.service';
import { SocialConnections } from 'app/models/api-entities/social-connections';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class SocialConnectionsService {
  private socialConnections: BehaviorSubject<SocialConnections> = new BehaviorSubject<SocialConnections>(null);

  constructor(public http: HttpClient, private utilityService: UtilityService) {}

  private setSocialConnections(response: SocialConnections) {
    this.socialConnections.next(response);
  }

  getSocialConnections(): BehaviorSubject<SocialConnections> {
    return this.socialConnections;
  }

  loadSocialConnections(): Observable<ZttResponse<SocialConnections>> {
    const url: string = this.utilityService.getAugmentedUrl(API_SOCIAL_CONNECTIONS.GET_SOCIAL_CONNECTIONS_PATH);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<SocialConnections>) => {
          this.setSocialConnections(res.data);
        })
      );
  }
}
