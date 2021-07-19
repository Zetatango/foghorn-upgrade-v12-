import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';

import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { UpdateProfileEvent, UpdateProfileEventRequestType } from 'app/models/api-entities/update-profile-event';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService, GTMEvent } from 'app/services/logging.service';

@Component({
  selector: 'ztt-business-partner-social-sharing',
  templateUrl: './business-partner-social-sharing.component.html'
})
export class BusinessPartnerSocialSharingComponent {
  private _modalRef: BsModalRef;
  private _businessPartnerApplication: BusinessPartnerApplication;

  @Output()
  sendUpdateProfileEvent = new EventEmitter<UpdateProfileEvent>();

  @ViewChild('socialSharingModal', { static: true })
  socialSharingModal: TemplateRef<any>; // eslint-disable-line

  constructor(private bsModalService: BsModalService,
              private configurationService: ConfigurationService,
              private loggingService: LoggingService) {}

  vanityUrl(): string {
    if (!this.businessPartnerApplication || !this.businessPartnerApplication.vanity) {
      return '';
    }
    return 'https://' + this.businessPartnerApplication.vanity + '.' + this.configurationService.arioDomainSuffix;
  }

  shareTabOpened($event): void { // eslint-disable-line
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, $event);

    if ($event !== 'twitter') {
      this.showSocialSharingSuggestionModal();
    }
  }

  shareTabClosed($event): void { // eslint-disable-line
    if ($event === 'facebook') {
      const params: BusinessPartnerProfileRequestParams = {
        facebook_sharing_requested: true
      };
      this.sendUpdateProfileEvent.emit({ params: params, requestType: UpdateProfileEventRequestType.setFacebookSharingRequest });
      this.hideModal();
    } else if ($event === 'linkedin') {
      const params: BusinessPartnerProfileRequestParams = {
        linkedin_sharing_requested: true
      };
      this.sendUpdateProfileEvent.emit({ params: params, requestType: UpdateProfileEventRequestType.setLinkedInSharingRequest });
      this.hideModal();
    } else {
      const params: BusinessPartnerProfileRequestParams = {
        twitter_sharing_requested: true
      };
      this.sendUpdateProfileEvent.emit({ params: params, requestType: UpdateProfileEventRequestType.setTwitterSharingRequest });
    }
  }

  private hideModal(): void {
    this.modalRef.hide();
  }

  private showSocialSharingSuggestionModal() {
    const config: ModalOptions = { class: 'modal-lg' };
    this.modalRef = this.bsModalService.show(this.socialSharingModal, config);
  }

  get modalRef(): BsModalRef {
    return this._modalRef;
  }

  set modalRef(value: BsModalRef) {
    this._modalRef = value;
  }

  get businessPartnerApplication(): BusinessPartnerApplication {
    return this._businessPartnerApplication;
  }

  @Input()
  set businessPartnerApplication(value: BusinessPartnerApplication) {
    this._businessPartnerApplication = value;
  }
}
