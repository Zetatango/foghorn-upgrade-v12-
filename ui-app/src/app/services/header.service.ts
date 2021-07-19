import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class HeaderService {
  dashboardLinkEnabled: BehaviorSubject<boolean> = new BehaviorSubject(true);
  partnerDashboardLinkEnabled: BehaviorSubject<boolean> = new BehaviorSubject(true);
}
