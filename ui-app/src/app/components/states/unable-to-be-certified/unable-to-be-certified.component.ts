import { Component } from '@angular/core';
import { AppRoutes } from 'app/models/routes';
import { StateRoutingService } from 'app/services/state-routing.service';

@Component({
  selector: 'ztt-unable-to-be-certified',
  templateUrl: './unable-to-be-certified.component.html'
})

export class UnableTobeCertifiedComponent {
  readonly step = 2;
  constructor(private stateRoutingService: StateRoutingService) {}

  back(): void {
    this.stateRoutingService.navigate(AppRoutes.onboarding.about_you, true);
  }
}
