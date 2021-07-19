import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessPartnerInviteComponent } from './business-partner-invite.component';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService, GTMEvent } from 'app/services/logging.service';

describe('BusinessPartnerInviteComponent', () => {
  let component: BusinessPartnerInviteComponent;
  let fixture: ComponentFixture<BusinessPartnerInviteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerInviteComponent
      ],
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BusinessPartnerService,
        CookieService,
        LoggingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerInviteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize the form group', () => {
      component.ngOnInit();
      expect(component.inviteFormGroup).not.toBeNull();
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('empty form is invalid', () => {
      expect(component.inviteFormGroup.valid).toBeFalsy();
    });

    it('should have no errors on valid input', () => {
      component.inviteFormGroup.setValue({
        email: 'test@user.com',
        name: 'test'
      });
      expect(component.inviteFormGroup.valid).toBeTruthy();
    });

    it('should enforce email as a required field', () => {
      component.inviteFormGroup.setValue({
        email: '',
        name: 'test'
      });
      expect(component.inviteFormGroup.valid).toBeFalsy();

      const errors = component.inviteFormGroup.controls['email'].errors || {};
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce email pattern', () => {
      component.inviteFormGroup.setValue({
        email: 'test',
        name: 'test'
      });
      expect(component.inviteFormGroup.valid).toBeFalsy();

      const errors = component.inviteFormGroup.controls['email'].errors || {};
      expect(errors['email']).toBeTruthy();
    });

    it('should enforce name required', () => {
      component.inviteFormGroup.setValue({
        email: 'test@user.com',
        name: ''
      });
      expect(component.inviteFormGroup.valid).toBeFalsy();

      const errors = component.inviteFormGroup.controls['name'].errors || {};
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce name pattern', () => {
      component.inviteFormGroup.setValue({
        email: 'test@user.com',
        name: '$^*W(@'
      });
      expect(component.inviteFormGroup.valid).toBeFalsy();

      const errors = component.inviteFormGroup.controls['name'].errors || {};
      expect(errors['pattern']).toBeTruthy();
    });
  });

  describe('sendInvite', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit an invite event if the form is valid', () => {
      spyOn(component.inviteEvent, 'emit');

      component.inviteFormGroup.setValue({
        email: 'test@user.com',
        name: 'test'
      });

      component.sendInvite();

      expect(component.inviteEvent.emit).toHaveBeenCalledOnceWith({
        name: 'test',
        email: 'test@user.com'
      });
    });

    it('should not emit an invite event if the form is invalid', () => {
      spyOn(component.inviteEvent, 'emit');

      component.sendInvite();

      expect(component.inviteEvent.emit).toHaveBeenCalledTimes(0);
    });

    it('should clear the form upon submission', () => {
      spyOn(component.inviteEvent, 'emit');

      component.inviteFormGroup.setValue({
        email: 'test@user.com',
        name: 'test'
      });

      component.sendInvite();

      expect(component.inviteFormGroup.valid).toBeFalsy();
      expect(component.inviteFormGroup.value.name).toBeNull();
      expect(component.inviteFormGroup.value.email).toBeNull();
    });

    it('should call logginService.GTMUpdate with correct button label', inject(
      [ LoggingService ], (loggingService: LoggingService) => {
        spyOn(loggingService, 'GTMUpdate');

        component.inviteFormGroup.setValue({
          email: 'test@user.com',
          name: 'test'
        });

        component.sendInvite();

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Send Invite');
    }));
  });
});
