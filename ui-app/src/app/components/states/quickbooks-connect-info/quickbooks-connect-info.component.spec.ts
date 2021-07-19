import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { QuickbooksConnectInfoComponent } from './quickbooks-connect-info.component';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { TranslateModule } from '@ngx-translate/core';
import { UtilityService } from 'app/services/utility.service';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { MerchantService } from 'app/services/merchant.service';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';
import { QuickbooksService } from 'app/services/quickbooks.service';

describe('QuickbooksConnectInfoComponent', () => {
  let component: QuickbooksConnectInfoComponent;
  let fixture: ComponentFixture<QuickbooksConnectInfoComponent>;
  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuickbooksConnectInfoComponent
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
    fixture = TestBed.createComponent(QuickbooksConnectInfoComponent);
    component = fixture.componentInstance;

    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('closeWindow', () => {
    it('will send a cancel event on messageChannel to parent window if exists', () => {
      (window as any).opener = {
        postMessage: () => undefined
      };
      spyOn(window.opener, 'postMessage');

      component.closeWindow();
      expect(window.opener.postMessage).toHaveBeenCalled(); 
      expect(window.opener.postMessage).toHaveBeenCalledWith(
        { type: 'omniauth', status: OmniauthProviderConnectEvent.cancel },
        window.location.origin
      );
    });

    it( 'will route to partner dashboard if there is no opener', () => {
      window.opener = null;
      component.closeWindow();
      expect(stateRoutingService.navigate).toHaveBeenCalled();
      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.partner_dashboard.root);
    });
  });
});
