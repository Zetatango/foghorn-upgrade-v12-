import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { InviteParams } from 'app/models/invite-params';
import { LoggingService, GTMEvent } from 'app/services/logging.service';
import { BusinessPartnerService } from 'app/services/business-partner.service';

@Component({
  selector: 'ztt-business-partner-invite',
  templateUrl: './business-partner-invite.component.html'
})
export class BusinessPartnerInviteComponent implements OnInit {
  private _inviteFormGroup: FormGroup;
  private _inviting: boolean;

  @Output()
  inviteEvent = new EventEmitter<InviteParams>();

  constructor(private businessPartnerService: BusinessPartnerService,
              private formBuilder: FormBuilder,
              private loggingService: LoggingService) {}

  ngOnInit(): void {
    this.inviteFormGroup = this.formBuilder.group({
      email: [null, null],
      name: [null, null]
    });
  }

  sendInvite(): void {
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Send Invite');

    if (this.inviteFormGroup.valid) {
      const inviteParams: InviteParams = {
        name: this.inviteFormGroup.controls['name'].value,
        email: this.inviteFormGroup.controls['email'].value
      };
      this.inviting = true;
      this.inviteEvent.emit(inviteParams);
      this.inviteFormGroup.reset();
    }
  }

  get inviteFormGroup(): FormGroup {
    return this._inviteFormGroup;
  }

  set inviteFormGroup(formGroup: FormGroup) {
    this._inviteFormGroup = formGroup;
  }

  get inviting(): boolean {
    return this._inviting;
  }

  @Input()
  set inviting(inviting: boolean) {
    this._inviting = inviting;
  }
}
