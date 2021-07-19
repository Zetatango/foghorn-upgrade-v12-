import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UserSessionService } from 'app/services/user-session.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'ztt-insights-email-toggle',
  templateUrl: './insights-email-toggle.component.html'
})
export class InsightsEmailToggleComponent implements OnDestroy, OnInit {
  @HostBinding('attr.id')
  componentID = 'ztt-insights-email-toggle';
  unsubscribe$ = new Subject<void>();

  error = false;
  success = false;

  insightsPreferenceForm = this.fb.group({
    isOptedIn: ['', [Validators.required]]
  });
  isOptedIn: AbstractControl = this.insightsPreferenceForm.get('isOptedIn');

  constructor(
    private userSessionService: UserSessionService,
    private stateRouterService: StateRoutingService,
    private fb: FormBuilder,
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.isOptedIn.setValue(this.userSessionService.insightsPreference || false);
  }

  async savePreference(): Promise<void> {
    this.insightsPreferenceForm.disable();
    this.error = false;
    this.success = false;
    try {
      await this.userSessionService.updateInsightsPreference(this.isOptedIn.value);
      this.success = true;

      // Refresh to reload user session information
      this.stateRouterService.performRedirect(window.location.href);
    } catch (e) {
      this.error = true;
    }
    this.insightsPreferenceForm.enable();
  }
}
