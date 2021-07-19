import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';

import { UnableTobeCertifiedComponent } from './unable-to-be-certified.component';
import { StateRoutingService } from 'app/services/state-routing.service';
import { RouterTestingModule } from '@angular/router/testing';
import { LoggingService } from 'app/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from 'app/services/utility.service';
import { AppRoutes } from 'app/models/routes';

describe('UnableTobeCertifiedComponent', () => {
  let component: UnableTobeCertifiedComponent;
  let fixture: ComponentFixture<UnableTobeCertifiedComponent>;
  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule
      ],
      declarations: [ UnableTobeCertifiedComponent ],
      providers: [
        CookieService,
        LoggingService,
        StateRoutingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnableTobeCertifiedComponent);
    component = fixture.componentInstance;
    stateRoutingService = TestBed.inject(StateRoutingService);

    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // NAVIGATION

  // -------------------------------------------------------------------------------- back()
  describe('back()', () => {
    it('should state-route to about_you', () => {
      component.back();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.about_you, true);
    });
  }); // describe - back()
});
