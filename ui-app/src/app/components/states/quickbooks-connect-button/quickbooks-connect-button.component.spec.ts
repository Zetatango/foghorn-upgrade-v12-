import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { QuickbooksConnectButtonComponent } from './quickbooks-connect-button.component';
import { LoggingService } from 'app/services/logging.service';
import { QuickbooksService } from 'app/services/quickbooks.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/services/utility.service';
import { SupportedLanguage } from 'app/models/languages';
import { MerchantService } from 'app/services/merchant.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('QuickbooksConnectButtonComponent', () => {
  let component: QuickbooksConnectButtonComponent;
  let fixture: ComponentFixture<QuickbooksConnectButtonComponent>;

  let quickbooksService: QuickbooksService;
  let stateRoutingService: StateRoutingService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuickbooksConnectButtonComponent
      ],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      providers: [
        QuickbooksService,
        LoggingService,
        CookieService,
        UtilityService,
        MerchantService,
        HttpClient,
        HttpHandler,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickbooksConnectButtonComponent);
    component = fixture.componentInstance;

    quickbooksService = TestBed.inject(QuickbooksService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    translateService = TestBed.inject(TranslateService);
    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('quickbooksStartFlowUrl', () => {
    it('gets the url from quickbooksService when language is set to English', () => {
      spyOn(quickbooksService, 'quickbooksAuthUrl');
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.en);
      component.quickbooksStartFlowUrl();
      expect(quickbooksService.quickbooksAuthUrl).toHaveBeenCalled();
      expect(quickbooksService.quickbooksAuthUrl).toHaveBeenCalledWith(SupportedLanguage.en);
    });

    it('gets the url from quickbooksService when language is set to French', () => {
      spyOn(quickbooksService, 'quickbooksAuthUrl');
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.fr);
      component.quickbooksStartFlowUrl();
      expect(quickbooksService.quickbooksAuthUrl).toHaveBeenCalled();
      expect(quickbooksService.quickbooksAuthUrl).toHaveBeenCalledWith(SupportedLanguage.fr);
    });
  });

  describe('quickbooksConnectButtonImage', () => {
    it('should return the english image when language is en', () => {
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.en);
      expect(component.quickbooksConnectButtonImage()).toEqual(`/assets/quickbooks/quickbooks-button-en.png`);
    });

    it('should return the french image when language is fr', () => {
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.fr);
      expect(component.quickbooksConnectButtonImage()).toEqual(`/assets/quickbooks/quickbooks-button-fr.png`);
    });
  });

  describe('connectQuickbooks', () => {
    it('calls initiateAuthFlow', () => {
      const initiateAuthFlowSpy = spyOn(quickbooksService, 'initiateAuthFlow');
      component.connectQuickbooks();
      expect(initiateAuthFlowSpy).toHaveBeenCalled();
    })
  });

  describe('openModal', () => {
    it('Defaults to false', () => {
      expect(component.openModal).toBe(false);
    })

    it('Displays a button when openModal is true', () => {
      component.openModal = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('a')).toBeFalsy();
    });

    it('Displays an anchor tag when openModal is false', () => {
      component.openModal = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('a')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('button')).toBeFalsy();
    });
  })
});
