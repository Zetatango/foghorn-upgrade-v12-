import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Meta, By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { UploadDocumentsComponent } from './upload-documents.component';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { UtilityService } from 'app/services/utility.service';
import { ErrorService } from 'app/services/error.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { LoggingService } from 'app/services/logging.service';

import { CookieService } from 'ngx-cookie-service';
import { UploadBoxComponent } from '../../utilities/upload-box/upload-box.component';
import { MerchantService } from 'app/services/merchant.service';
import { BehaviorSubject } from 'rxjs';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';

import { RouterTestingModule } from '@angular/router/testing';

describe('UploadDocumentsComponent-UI', () => {
  let component: UploadDocumentsComponent;
  let fixture: ComponentFixture<UploadDocumentsComponent>;

  let lendingApplicationsService: LendingApplicationsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        NgxUploaderModule,
        RouterTestingModule
      ],
      declarations: [ UploadDocumentsComponent, UploadBoxComponent ],
      providers: [
        CookieService,
        ErrorService,
        LoggingService,
        UtilityService,
        ErrorService,
        Meta,
        MerchantService,
        StateRoutingService
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDocumentsComponent);
    component = fixture.componentInstance;
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(lendingApplicationApproved));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------- Child component
  describe('Child component', () => {
    function expectOnlyOneToBePresent(elems: Element[]) {
      expect(elems.length).toEqual(1);
      expect(elems[0]).toBeTruthy();
    }

    beforeEach( () => {
      spyOn(component, 'setLendingApplicationSubscription');
    });

    it('upload-box should be present', ()  => {
      // Unsure that minimal skeleton of the uploaded is in the template
      const uploadBoxes = fixture.debugElement.queryAll(By.css('.upload-box'));
      expectOnlyOneToBePresent(uploadBoxes.map(el => el.nativeElement));
    });
  }); // describe - Child component
}); // describe - UploadDocumentsComponent UI
