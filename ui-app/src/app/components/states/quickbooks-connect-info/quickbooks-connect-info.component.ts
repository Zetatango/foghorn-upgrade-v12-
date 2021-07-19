import { Component } from '@angular/core';
import { StateRoutingService } from 'app/services/state-routing.service';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-quickbooks-connect-info',
  templateUrl: './quickbooks-connect-info.component.html'
})
export class QuickbooksConnectInfoComponent {
  constructor(private stateRoutingService: StateRoutingService) {}

  readonly noteList = [
    'QUICKBOOKS.NOTE_1',
    'QUICKBOOKS.NOTE_2'
  ];

  closeWindow(): void {
    if (window.opener) {
      window.opener.postMessage({ type: 'omniauth', status: OmniauthProviderConnectEvent.cancel }, window.location.origin);
    } else {
      this.stateRoutingService.navigate(AppRoutes.partner_dashboard.root);
    }
  }
}
