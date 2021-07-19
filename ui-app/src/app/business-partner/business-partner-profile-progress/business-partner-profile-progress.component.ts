import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LoggingService, GTMEvent } from 'app/services/logging.service';

import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { UpdateProfileEvent } from 'app/models/api-entities/update-profile-event';

@Component({
  selector: 'ztt-business-partner-profile-progress',
  templateUrl: './business-partner-profile-progress.component.html'
})
export class BusinessPartnerProfileProgressComponent {
  private _businessPartnerApplication: BusinessPartnerApplication;
  private _businessPartnerProfile: BusinessPartnerProfile;
  private _selectedInfoBox: number;
  private _completedActions: number[];
  private _incompleteActions: number[];

  readonly BUSINESS_PARTNER_PROFILE_STEPS = {
    agreement: 0,
    partner_training: 1,
    invited: 2,
    invoiced: 3
  };

  @Output() sendSchedulePartnerTrainingEvent = new EventEmitter();
  @Output() sendUpdateProfileEvent = new EventEmitter<UpdateProfileEvent>();

  constructor(private loggingService: LoggingService,
              private _translateService: TranslateService) {}

  getDefaultSelectedInfoBox(): void {
    this.selectedInfoBox = 0;

    if (this.businessPartnerProfile && !this.businessPartnerProfile.created_at) {
      this.selectedInfoBox = this.BUSINESS_PARTNER_PROFILE_STEPS.agreement;
    } else if (this.businessPartnerProfile && !this.businessPartnerProfile.partner_training_completed_at) {
      this.selectedInfoBox = this.BUSINESS_PARTNER_PROFILE_STEPS.partner_training;
    } else if (this.businessPartnerProfile && !this.businessPartnerProfile.first_customer_invited_at) {
      this.selectedInfoBox = this.BUSINESS_PARTNER_PROFILE_STEPS.invited;
    } else if (this.businessPartnerProfile && !this.businessPartnerProfile.first_customer_invoiced_at) {
      this.selectedInfoBox = this.BUSINESS_PARTNER_PROFILE_STEPS.invoiced;
    }
  }

  nextStep(): void {
    if (this.nextStepAllowed()) {
      this.selectedInfoBox++;
    }
  }

  previousStep(): void {
    if (this.selectedInfoBox > 0) {
      this.selectedInfoBox--;
    }
  }

  nextStepAllowed(): boolean {
    return this.selectedInfoBox < (Object.keys(this.BUSINESS_PARTNER_PROFILE_STEPS).length - 1);
  }

  schedulePartnerTrainingWithCalendly(): void {
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Schedule Training');
    this.sendSchedulePartnerTrainingEvent.emit();
  }

  marketingCompleted(): boolean {
    return !!(this.businessPartnerProfile.facebook_sharing_requested_at ||
              this.businessPartnerProfile.linkedin_sharing_requested_at ||
              this.businessPartnerProfile.twitter_sharing_requested_at);
  }

  receiveUpdateProfileEvent($event: UpdateProfileEvent): void {
    this.sendUpdateProfileEvent.emit($event);
  }

  private getCompleteActions(): void {
    this.completedActions = [];
    if (this.businessPartnerProfile && this.businessPartnerProfile.created_at) {
      this.completedActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.agreement);
    }

    if (this.businessPartnerProfile && this.businessPartnerProfile.partner_training_completed_at) {
      this.completedActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.partner_training);
    }

    if (this.businessPartnerProfile && this.businessPartnerProfile.first_customer_invited_at) {
      this.completedActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.invited);
    }

    if (this.businessPartnerProfile && this.businessPartnerProfile.first_customer_invoiced_at) {
      this.completedActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.invoiced);
    }
  }

  private getIncompleteActions(): void {
    this.incompleteActions = [];
    if (this.businessPartnerProfile && !this.businessPartnerProfile.created_at) {
      this.incompleteActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.agreement);
    }

    if (this.businessPartnerProfile && !this.businessPartnerProfile.partner_training_completed_at) {
      this.incompleteActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.partner_training);
    }

    if (this.businessPartnerProfile && !this.businessPartnerProfile.first_customer_invited_at) {
      this.incompleteActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.invited);
    }

    if (this.businessPartnerProfile && !this.businessPartnerProfile.first_customer_invoiced_at) {
      this.incompleteActions.push(this.BUSINESS_PARTNER_PROFILE_STEPS.invoiced);
    }
  }

  onSelectTab(label: string): void {
    const translatedLabel = this.translateService.instant(label);

    this.loggingService.GTMUpdate(GTMEvent.TAB_CLICKED, translatedLabel);
  }

  get businessPartnerApplication(): BusinessPartnerApplication {
    return this._businessPartnerApplication;
  }

  @Input()
  set businessPartnerApplication(value: BusinessPartnerApplication) {
    this._businessPartnerApplication = value;
  }

  @Input()
  set businessPartnerProfile(value: BusinessPartnerProfile) {
    this._businessPartnerProfile = value;
    this.getCompleteActions();
    this.getIncompleteActions();
    this.getDefaultSelectedInfoBox();
  }

  get businessPartnerProfile(): BusinessPartnerProfile {
    return this._businessPartnerProfile;
  }

  get translateService(): TranslateService {
    return this._translateService;
  }

  get selectedInfoBox(): number {
    return this._selectedInfoBox;
  }

  set selectedInfoBox(value: number) {
    this._selectedInfoBox = value;
  }

  get completedActions(): number[] {
    return this._completedActions;
  }

  set completedActions(value: number[]) {
    this._completedActions = value;
  }

  get incompleteActions(): number[] {
    return this._incompleteActions;
  }

  set incompleteActions(value: number[]) {
    this._incompleteActions = value;
  }
}
