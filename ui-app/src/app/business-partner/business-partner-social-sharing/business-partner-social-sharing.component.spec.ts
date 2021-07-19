import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessPartnerSocialSharingComponent } from './business-partner-social-sharing.component';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { UpdateProfileEventRequestType } from 'app/models/api-entities/update-profile-event';
import { ConfigurationService } from 'app/services/configuration.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService, GTMEvent } from 'app/services/logging.service';
import { businessPartnerApplicationFactory } from 'app/test-stubs/factories/business-partner';

describe('BusinessPartnerSocialSharingComponent', () => {
  let component: BusinessPartnerSocialSharingComponent;
  let fixture: ComponentFixture<BusinessPartnerSocialSharingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerSocialSharingComponent
      ],
      imports: [
        HttpClientTestingModule,
        ModalModule.forRoot(),
        TranslateModule.forRoot()
      ],
      providers: [
        BsModalService,
        ConfigurationService,
        CookieService,
        LoggingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerSocialSharingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('shareTabOpened', () => {
    it('should open the social sharing modal when facebook button clicked', inject([BsModalService], (bsModalService: BsModalService) => {
      spyOn(bsModalService, 'show');
      component.shareTabOpened('facebook');

      expect(bsModalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).not.toBeNull();
    }));

    it('should open the social sharing modal when linkedin button clicked', inject([BsModalService], (bsModalService: BsModalService) => {
      spyOn(bsModalService, 'show');
      component.shareTabOpened('linkedin');

      expect(bsModalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).not.toBeNull();
    }));

    it('should not open the social sharing modal when twitter button clicked', inject([BsModalService], (bsModalService: BsModalService) => {
      spyOn(bsModalService, 'show');
      component.shareTabOpened('twitter');

      expect(bsModalService.show).toHaveBeenCalledTimes(0);
      expect(component.modalRef).not.toBeDefined();
    }));

    it('should call loggingService.GTMUpdate with correct button label', inject(
      [ LoggingService ], (loggingService: LoggingService) => {
        spyOn(loggingService, 'GTMUpdate');
        const socialButton = 'twitter';

        component.shareTabOpened(socialButton);

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, socialButton);
    }));
  });

  describe('shareTabClosed', () => {
    beforeEach(inject([BsModalService], (bsModalService: BsModalService) => {
      spyOn(bsModalService, 'show').and.callThrough();
      spyOn(component.sendUpdateProfileEvent, 'emit');
      spyOn(component, 'vanityUrl').and.returnValue('https://test.ario.com');

      fixture.detectChanges();
    }));

    it('should emit an update profile event and dismiss dialogs when facebook closed', () => {
      component.shareTabOpened('facebook');
      spyOn(component.modalRef, 'hide');

      component.shareTabClosed('facebook');

      const params: BusinessPartnerProfileRequestParams = {
        facebook_sharing_requested: true
      };

      expect(component.sendUpdateProfileEvent.emit).toHaveBeenCalledOnceWith({
        params: params,
        requestType: UpdateProfileEventRequestType.setFacebookSharingRequest
      });
      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });

    it('should emit an update profile event and dismiss dialogs when linkedin closed', () => {
      component.shareTabOpened('linkedin');
      spyOn(component.modalRef, 'hide');

      component.shareTabClosed('linkedin');

      const params: BusinessPartnerProfileRequestParams = {
        linkedin_sharing_requested: true
      };

      expect(component.sendUpdateProfileEvent.emit).toHaveBeenCalledOnceWith({
        params: params,
        requestType: UpdateProfileEventRequestType.setLinkedInSharingRequest
      });
      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });

    it('should emit an update profile event when twitter closed', () => {
      component.shareTabOpened('twitter');
      component.shareTabClosed('twitter');

      const params: BusinessPartnerProfileRequestParams = {
        twitter_sharing_requested: true
      };

      expect(component.sendUpdateProfileEvent.emit).toHaveBeenCalledOnceWith({
        params: params,
        requestType: UpdateProfileEventRequestType.setTwitterSharingRequest
      });

      expect(component.modalRef).toBeUndefined();
    });
  });

  describe('vanityUrl', () => {
    it('should generate proper vanity URL for sharing', inject([ConfigurationService], (configurationService: ConfigurationService) => {
      spyOnProperty(configurationService, 'arioDomainSuffix').and.returnValue('zetatango.com');

      component.businessPartnerApplication = businessPartnerApplicationFactory.build();
      expect(component.vanityUrl()).toEqual('https://hellokitty.zetatango.com');
    }));

    it('should return empty string if business partner application is null', () => {
      expect(component.vanityUrl()).toEqual('');
    });

    it('should return empty string if bussiness partner application vanity is null', () => {
      component.businessPartnerApplication = businessPartnerApplicationFactory.build({ vanity: null });
      expect(component.vanityUrl()).toEqual('');
    });

    it('should return empty string if bussiness partner application vanity is empty string', () => {
      component.businessPartnerApplication = businessPartnerApplicationFactory.build({ vanity: '' });
      expect(component.vanityUrl()).toEqual('');
    });
  });
});
