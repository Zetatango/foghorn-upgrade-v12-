import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';

import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

import { LoggingService, GTMEvent } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';

import { BusinessPartnerProfileProgressComponent } from './business-partner-profile-progress.component';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { UpdateProfileEventRequestType } from 'app/models/api-entities/update-profile-event';
import { businessPartnerApplicationFactory } from 'app/test-stubs/factories/business-partner';
import { businessPartnerProfileFactory } from 'app/test-stubs/factories/business-partner-profile';

describe('BusinessPartnerProfileProgress', () => {
  let component: BusinessPartnerProfileProgressComponent;
  let fixture: ComponentFixture<BusinessPartnerProfileProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerProfileProgressComponent
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        CookieService,
        LoggingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerProfileProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.translateService).toBeTruthy();
  });

  describe('getDefaultSelectedInfoBox', () => {
    it('should be set to the agreement step if it is the first incomplete step', () => {
      const profile = businessPartnerProfileFactory.build({ created_at: '' });
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(profile);

      component.getDefaultSelectedInfoBox();

      expect(component.selectedInfoBox).toEqual(component.BUSINESS_PARTNER_PROFILE_STEPS.agreement);
    });

    it('should be set to the training step if it is the first incomplete step', () => {
      const profile = businessPartnerProfileFactory.build();
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(profile);

      component.getDefaultSelectedInfoBox();

      expect(component.selectedInfoBox).toEqual(component.BUSINESS_PARTNER_PROFILE_STEPS.partner_training);
    });

    it('should be set to the invited step if it is the first incomplete step', () => {
      const profile = businessPartnerProfileFactory.build({
        partner_training_completed_at: Date.now().toString(),
        facebook_sharing_requested_at: Date.now().toString()
      });
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(profile);

      component.getDefaultSelectedInfoBox();

      expect(component.selectedInfoBox).toEqual(component.BUSINESS_PARTNER_PROFILE_STEPS.invited);
    });

    it('should be set to the invoiced step if it is the first incomplete step', () => {
      const profile = businessPartnerProfileFactory.build({
        partner_training_completed_at: Date.now().toString(),
        facebook_sharing_requested_at: Date.now().toString(),
        first_customer_invited_at: Date.now().toString()
      });
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(profile);

      component.getDefaultSelectedInfoBox();

      expect(component.selectedInfoBox).toEqual(component.BUSINESS_PARTNER_PROFILE_STEPS.invoiced);
    });

    it('should be set to the agreement step by default', () => {
      const profile = businessPartnerProfileFactory.build({
        partner_training_completed_at: Date.now().toString(),
        facebook_sharing_requested_at: Date.now().toString(),
        first_customer_invited_at: Date.now().toString(),
        first_customer_invoiced_at: Date.now().toString()
      });
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(profile);

      component.getDefaultSelectedInfoBox();

      expect(component.selectedInfoBox).toEqual(component.BUSINESS_PARTNER_PROFILE_STEPS.agreement);
    });
  });

  describe('nextStep', () => {
    it('should increment the selected item if next step is allowed', () => {
      const step = 0;
      component.selectedInfoBox = step;

      component.nextStep();

      expect(component.selectedInfoBox).toEqual(step + 1);
    });

    it('should not increment the selected item if selected item is greater than the number of steps', () => {
      const step = 100;
      component.selectedInfoBox = step;

      component.nextStep();

      expect(component.selectedInfoBox).toEqual(step);
    });

    it('should not increment the selected item if selected item is equal to the number of steps', () => {
      const step = Object.keys(component.BUSINESS_PARTNER_PROFILE_STEPS).length - 1;
      component.selectedInfoBox = step;

      component.nextStep();

      expect(component.selectedInfoBox).toEqual(step);
    });
  });

  describe('previousStep', () => {
    it('should decrement the selected item if previous step is allowed', () => {
      const step = Object.keys(component.BUSINESS_PARTNER_PROFILE_STEPS).length - 1;
      component.selectedInfoBox = step;

      component.previousStep();

      expect(component.selectedInfoBox).toEqual(step - 1);
    });

    it('should not decrement the selected item if previous step is less than 0', () => {
      const step = -1;
      component.selectedInfoBox = step;

      component.previousStep();

      expect(component.selectedInfoBox).toEqual(step);
    });

    it('should not decrement the selected item if previous step is 0', () => {
      const step = 0;
      component.selectedInfoBox = step;

      component.previousStep();

      expect(component.selectedInfoBox).toEqual(step);
    });
  });

  describe('nextStepAllowed', () => {
    it('should return true if next step is allowed', () => {
      component.selectedInfoBox = 0;
      expect(component.nextStepAllowed()).toBeTruthy();
    });

    it('should return false if next step is not allowed (current selected item greater than number of items)', () => {
      component.selectedInfoBox = 100;
      expect(component.nextStepAllowed()).toBeFalsy();
    });

    it('should return false if next step is not allowed (current selected item is last)', () => {
      component.selectedInfoBox = Object.keys(component.BUSINESS_PARTNER_PROFILE_STEPS).length - 1;
      expect(component.nextStepAllowed()).toBeFalsy();
    });
  });

  describe('schedulePartnerTrainingWithCalendly', () => {
    it('should emit a sendSchedulePartnerTrainingEvent', () => {
      spyOn(component.sendSchedulePartnerTrainingEvent, 'emit');

      component.schedulePartnerTrainingWithCalendly();

      expect(component.sendSchedulePartnerTrainingEvent.emit).toHaveBeenCalledTimes(1);
    });

    it('should call loggingService.GTMUpdate with correct button label', inject(
      [ LoggingService ], (loggingService: LoggingService) => {
        spyOn(loggingService, 'GTMUpdate');

        component.schedulePartnerTrainingWithCalendly();

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Schedule Training');
    }));
  });

  describe('marketingCompleted', () => {
    it('should return true if Facebook sharing has been requested', () => {
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(businessPartnerProfileFactory.build({
        facebook_sharing_requested_at: Date.now().toString()
      }));

      expect(component.marketingCompleted()).toBeTruthy();
    });

    it('should return true if LinkedIn sharing has been requested', () => {
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(businessPartnerProfileFactory.build({
        linkedin_sharing_requested_at: Date.now().toString()
      }));

      expect(component.marketingCompleted()).toBeTruthy();
    });

    it('should return true if Twitter sharing has been requested', () => {
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(businessPartnerProfileFactory.build({
        twitter_sharing_requested_at: Date.now().toString()
      }));

      expect(component.marketingCompleted()).toBeTruthy();
    });

    it('should return false if no marketing tasks have been completed', () => {
      spyOnProperty(component, 'businessPartnerProfile').and.returnValue(businessPartnerProfileFactory.build());

      expect(component.marketingCompleted()).toBeFalsy();
    });
  });

  describe('getCompleteActions', () => {
    it('should set completedActions to empty list if no actions completed', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ created_at: '' });

      expect(component.completedActions).toEqual([]);
    });

    it('should add agreement step to completedActions if agreement is completed', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build();

      expect(component.completedActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.agreement]);
    });

    it('should add training step to completedActions if training is completed', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ created_at: '',
                                                                               partner_training_completed_at: Date.now().toString() });

      expect(component.completedActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.partner_training]);
    });

    it('should add invited step to completedActions if invited is completed', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ created_at: '',
                                                                               first_customer_invited_at: Date.now().toString() });

      expect(component.completedActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.invited]);
    });

    it('should add invoiced step to completedActions if invoiced is completed', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ created_at: '',
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.completedActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.invoiced]);
    });

    it('should completedActions to all steps if all completed', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ partner_training_completed_at: Date.now().toString(),
                                                                               first_customer_invited_at: Date.now().toString(),
                                                                               facebook_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.completedActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.agreement,
                                                  component.BUSINESS_PARTNER_PROFILE_STEPS.partner_training,
                                                  component.BUSINESS_PARTNER_PROFILE_STEPS.invited,
                                                  component.BUSINESS_PARTNER_PROFILE_STEPS.invoiced]);
    });
  });

  describe('getIncompleteActions', () => {
    it('should set incompleteActions to empty list if no actions incomplete (Facebook)', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ partner_training_completed_at: Date.now().toString(),
                                                                               first_customer_invited_at: Date.now().toString(),
                                                                               facebook_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([]);
    });

    it('should set incompleteActions to empty list if no actions incomplete (LinkedIn)', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ partner_training_completed_at: Date.now().toString(),
                                                                               first_customer_invited_at: Date.now().toString(),
                                                                               linkedin_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([]);
    });

    it('should set incompleteActions to empty list if no actions incomplete (Twitter)', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ partner_training_completed_at: Date.now().toString(),
                                                                               first_customer_invited_at: Date.now().toString(),
                                                                               twitter_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([]);
    });

    it('should add agreement step to incompleteActions if agreement is incomplete', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ created_at: '',
                                                                               partner_training_completed_at: Date.now().toString(),
                                                                               first_customer_invited_at: Date.now().toString(),
                                                                               facebook_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.agreement]);
    });

    it('should add training step to incompleteActions if training is incomplete', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ first_customer_invited_at: Date.now().toString(),
                                                                               facebook_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.partner_training]);
    });

    it('should add invited step to incompleteActions if invited is incomplete', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ partner_training_completed_at: Date.now().toString(),
                                                                               facebook_sharing_requested_at: Date.now().toString(),
                                                                               first_customer_invoiced_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.invited]);
    });

    it('should add invoiced step to incompleteActions if invoiced is incomplete', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ partner_training_completed_at: Date.now().toString(),
                                                                               first_customer_invited_at: Date.now().toString(),
                                                                               facebook_sharing_requested_at: Date.now().toString() });

      expect(component.incompleteActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.invoiced]);
    });

    it('should set incompleteActions to all steps if all incomplete', () => {
      component.businessPartnerProfile = businessPartnerProfileFactory.build({ created_at: '' });

      expect(component.incompleteActions).toEqual([component.BUSINESS_PARTNER_PROFILE_STEPS.agreement,
                                                   component.BUSINESS_PARTNER_PROFILE_STEPS.partner_training,
                                                   component.BUSINESS_PARTNER_PROFILE_STEPS.invited,
                                                   component.BUSINESS_PARTNER_PROFILE_STEPS.invoiced]);
    });
  });

  describe('receiveUpdateProfileEvent', () => {
    it('should emit an update profile event', () => {
      spyOn(component.sendUpdateProfileEvent, 'emit');

      const params: BusinessPartnerProfileRequestParams = {
        facebook_sharing_requested: true
      };
      component.receiveUpdateProfileEvent({ params: params, requestType: UpdateProfileEventRequestType.setFacebookSharingRequest});

      expect(component.sendUpdateProfileEvent.emit).toHaveBeenCalledOnceWith({
        params: params,
        requestType: UpdateProfileEventRequestType.setFacebookSharingRequest
      });
    });
  });

  describe('businessPartnerApplication', () => {
    it('should set the input value', () => {
      component.businessPartnerApplication = businessPartnerApplicationFactory.build();

      expect(component.businessPartnerApplication).toEqual(businessPartnerApplicationFactory.build());
    });
  });

  describe('onSelectTab()', () => {
    it('should call loggingService.GTMUpdate with translated tab label', inject(
      [ LoggingService, TranslateService ], (loggingService: LoggingService, translateService: TranslateService) => {
        spyOn(loggingService, 'GTMUpdate');

        const translationKey = 'PARTNER_DASHBOARD.PROFILE_INVOICE_INFO_LABEL';
        const expectedTranslation = translateService.instant(translationKey);

        component.onSelectTab(translationKey);

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.TAB_CLICKED, expectedTranslation);
    }));
  });
});
