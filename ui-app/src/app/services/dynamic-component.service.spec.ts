import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { DynamicComponentService } from './dynamic-component.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { UploadDocumentsComponent } from 'app/components/containers/upload-documents/upload-documents.component';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { ApprovalPrerequisitesDirective } from 'app/components/states/approval-prerequisites/approval-prerequisites.directive';
import { ApprovalPrerequisitesComponent } from 'app/components/states/approval-prerequisites/approval-prerequisites.component';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { LoadingService } from 'app/services/loading.service';
import { ErrorService } from 'app/services/error.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { CookieService } from 'ngx-cookie-service';
import { MerchantService } from 'app/services/merchant.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from './state-routing.service';
import { RouterTestingModule } from '@angular/router/testing';
import { OfferService } from 'app/services/offer.service';
import { MockProvider } from 'ng-mocks';
import { AppLoadService } from './app-load.service';

describe('DynamicComponentService', () => {
  let service: DynamicComponentService;
  let directive: ApprovalPrerequisitesDirective;
  let component: ApprovalPrerequisitesComponent;
  let fixture: ComponentFixture<ApprovalPrerequisitesComponent>;

  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      TranslateModule.forRoot(),
      HttpClientTestingModule,
      RouterTestingModule
    ],
    declarations: [
      ApprovalPrerequisitesDirective,
      ApprovalPrerequisitesComponent,
      SetUpBankComponent,
      UploadDocumentsComponent,
      ApprovalPendingComponent
    ],
    providers: [
      MockProvider(AppLoadService),
      DynamicComponentService,
      UtilityService,
      LoadingService,
      ErrorService,
      CookieService,
      OfferService,
      MerchantService,
      BankAccountService,
      LoggingService,
      StateRoutingService
    ],
    schemas: [ NO_ERRORS_SCHEMA ]
  }).overrideModule(BrowserDynamicTestingModule, {
    set: {
      entryComponents: [
        SetUpBankComponent,
        UploadDocumentsComponent,
        ApprovalPendingComponent
      ],
    }
  }).compileComponents());

  beforeEach(() => {
    service = TestBed.inject(DynamicComponentService);
    fixture = TestBed.createComponent(ApprovalPrerequisitesComponent);
    component = fixture.componentInstance;
    directive = component.approvalPrerequisitesDirective;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set viewContainerRef', () => {
    service.viewContainerRef = directive.viewContainerRef;
    expect(service.viewContainerRef).toEqual(directive.viewContainerRef);
  });

  it('loadComponent should create a new component in the view container and return component ref', () => {
    service.viewContainerRef = directive.viewContainerRef;
    spyOn(service.viewContainerRef, 'clear');
    spyOn(service.viewContainerRef, 'createComponent').and.callThrough();

    const componentRef = service.loadComponent(SetUpBankComponent);

    expect(componentRef).toBeTruthy();
    expect(service.viewContainerRef.clear).toHaveBeenCalledTimes(1);
    expect(service.viewContainerRef.createComponent).toHaveBeenCalledTimes(1);
  });

  it('loadComponent should update Intercom with component className as parameter if it has a className', inject(
    [LoggingService], (loggingService: LoggingService) => {
      spyOn(loggingService, 'logCurrentPage');
      service.viewContainerRef = directive.viewContainerRef;

      // array with components that have static className
      const componentsArray = [SetUpBankComponent, UploadDocumentsComponent, ApprovalPendingComponent];
      componentsArray.forEach((comp) => {
        service.loadComponent(comp);

        expect(loggingService.logCurrentPage).toHaveBeenCalledWith(comp.className);
      });
      expect(loggingService.logCurrentPage).toHaveBeenCalledTimes(componentsArray.length);
  }));

  it('loadComponent should update Intercom with component name as parameter if it has no className', inject(
    [LoggingService], (loggingService: LoggingService) => {
      spyOn(loggingService, 'logCurrentPage');
      service.viewContainerRef = directive.viewContainerRef;

      SetUpBankComponent.className = null;
      service.loadComponent(SetUpBankComponent);

      expect(loggingService.logCurrentPage).toHaveBeenCalledOnceWith(SetUpBankComponent.name);
  }));
});
