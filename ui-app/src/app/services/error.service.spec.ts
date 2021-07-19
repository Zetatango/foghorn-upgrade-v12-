import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { ErrorService } from './error.service';
import { ErrorModalComponent } from 'app/components/utilities/error-modal/error-modal.component';
import { UiError } from 'app/models/ui-error';
import { RouterTestingModule } from '@angular/router/testing';

describe('ErrorService', () => {
  let errorModalComponent: ErrorModalComponent;
  let errorModalComponentFixture: ComponentFixture<ErrorModalComponent>;
  let service: ErrorService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule, ModalModule.forRoot(), RouterTestingModule ],
      declarations: [ ErrorModalComponent ],
      providers: [
        BsModalService,
        CookieService,
        ErrorService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        UtilityService
      ]
    });

    errorModalComponentFixture = TestBed.createComponent(ErrorModalComponent);
    errorModalComponent = errorModalComponentFixture.componentInstance;
    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show()', () => {
    describe('when an ErrorModalComponent instance is set', () => {
      it('calls the instance show method', () => {
        service.registerInstance(errorModalComponent);
        spyOn(errorModalComponent, 'show');
        service.show(UiError.general);
        expect(errorModalComponent.show).toHaveBeenCalledTimes(1);
      });

      it('does not call if the instance is falsy', () => {
        spyOn(errorModalComponent, 'show');
        service.show(UiError.general);
        expect(errorModalComponent.show).not.toHaveBeenCalled();
      });
    });
  });

  describe('hide()', () => {
    describe('when an ErrorModalComponent instance is set', () => {
      it('calls the instance hide method', () => {
        service.registerInstance(errorModalComponent);
        spyOn(errorModalComponent, 'hide');
        service.hide();
        expect(errorModalComponent.hide).toHaveBeenCalledTimes(1);
      });

      it('does not call if the instance is falsy', () => {
        spyOn(errorModalComponent, 'hide');
        service.hide();
        expect(errorModalComponent.hide).not.toHaveBeenCalled();
      });
    });
  });
});

