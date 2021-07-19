import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { UtilityService } from 'app/services/utility.service';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { BsModalRef, BsModalService, ModalModule, ModalOptions } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { ErrorModalComponent } from './error-modal.component';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { CONSTANTS } from 'app/constants';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';

describe('ErrorModalComponent', () => {
  let component: ErrorModalComponent;
  let fixture: ComponentFixture<ErrorModalComponent>;

  let errorService: ErrorService;
  let merchantService: MerchantService;
  let modalService: BsModalService;
  let stateRoutingService: StateRoutingService;
  let loggingService: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        ModalModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [ErrorModalComponent],
      providers: [
        CookieService,
        LoggingService,
        MerchantService,
        ErrorService,
        BsModalService,
        StateRoutingService,
        UtilityService
      ]
    });

    fixture = TestBed.createComponent(ErrorModalComponent);
    component = fixture.componentInstance;

    errorService = TestBed.inject(ErrorService);
    merchantService = TestBed.inject(MerchantService);
    loggingService = TestBed.inject(LoggingService);

    modalService = TestBed.inject(BsModalService);
    spyOn(modalService, 'show').and.returnValue(new BsModalRef());

    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'performRedirect');
  });


  // LIFE CYCLE


  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ------------------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    it('should register itself in the error service', () => {
      spyOn(errorService, 'registerInstance');
      fixture.detectChanges();

      expect(errorService.registerInstance).toHaveBeenCalledOnceWith(component);
    });

    it('should set logoutUrl', () => {
      merchantService.logoutUrl = '/logout';
      fixture.detectChanges();

      expect(component.logoutUrl).toBeTruthy();
    });

    it('should set accountInfoUrl', () => {
      merchantService.accountInfoUrl = '/portal';
      fixture.detectChanges();

      expect(component.accountInfoUrl).toBeTruthy();
    });

    it('should set merchantName', () => {
      const merchant = merchantDataFactory.build();
      spyOnProperty(merchantService, 'merchantObs').and.returnValue(new BehaviorSubject(merchant));
      fixture.detectChanges();

      expect(component.merchantName).toEqual(merchant.name);
    });
  }); // describe - ngOnInit()

  // PUBLIC HELPERS


  // ----------------------------------------------------------------------------------- show()
  describe('show()', () => {
    describe('without a custom error modal context', () => {
      it('uses the default context', () => {
        component.show(UiError.general);
        expect(component.context).toEqual(ErrorModalComponent.DEFAULT_CONTEXT);
      });
    });

    describe('when defining a custom error modal context', () => {
      it('sets the context', () => {
        const context: ErrorModalContext = new ErrorModalContext(
          'HEADING',
          [
            'ERROR_KEY_1',
            'ERROR_KEY_2'
          ]
        );
        component.show(UiError.general, context);

        expect(component.context).toEqual(context);
      });
    });

    describe('when defining a custom context with route destination specified', () => {
      it('sets the context', () => {
        const context: ErrorModalContext = new ErrorModalContext(
          'HEADING',
          [
            'ERROR_KEY_1',
            'ERROR_KEY_2'
          ],
          AppRoutes.documents.root
        );
        component.show(UiError.general, context);

        expect(component.context).toEqual(context);
      });

      it('sets the context with no route destination', () => {
        const context: ErrorModalContext = new ErrorModalContext(
          'HEADING',
          [
            'ERROR_KEY_1',
            'ERROR_KEY_2'
          ]);
        component.show(UiError.general, context);
        expect(component.context).toEqual(context);
      });

      it('Routes to specified route on hidden event', fakeAsync(() => {
        spyOn(stateRoutingService, 'navigate');

        const context: ErrorModalContext = new ErrorModalContext(
          'HEADING',
          [
            'ERROR_KEY_1',
            'ERROR_KEY_2'
          ],
          AppRoutes.documents.root);
        component.show(UiError.general, context);
        tick();

        spyOn(modalService.onHidden, 'emit').and.callThrough();
        modalService.onHidden.emit();
        component.hide();

        tick();

        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.documents.root, false);
      }));

      it('Routes to specified route on hidden event, and skips URL change when declared', fakeAsync(() => {
        spyOn(stateRoutingService, 'navigate');

        const context: ErrorModalContext = new ErrorModalContext(
          'HEADING',
          [
            'ERROR_KEY_1',
            'ERROR_KEY_2'
          ],
          AppRoutes.documents.root,
          true);
        component.show(UiError.general, context);
        tick();

        spyOn(modalService.onHidden, 'emit').and.callThrough();
        modalService.onHidden.emit();
        component.hide();

        tick();

        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.documents.root, true);
      }));
    });

    describe('if the current error is different from the previous one', () => {
      it('should disable modal btn', () => {
        component.btnActionDisabled = true;
        component.show(UiError.general);

        expect(component.btnActionDisabled).toEqual(false);
      });

      it('should set current UI error', () => {
        component.btnActionDisabled = true;
        component.show(UiError.general);

        expect(component.error).toEqual(UiError.general);
      });

      it('should assign & show modal', fakeAsync(() => {
        component.show(UiError.general);
        tick();

        expect(component.modalRef).toBeTruthy();
        expect(modalService.show).toHaveBeenCalledOnceWith(component.template, component.defaultModalOptions);
      }));
    }); // describe - if the current error is different from the previous one
  }); // describe - show()


  // ----------------------------------------------------------------------------------- hide()
  describe('hide()', () => {
    it('should disable modal action btn', fakeAsync(() => {
      component.show(UiError.general);
      tick();
      component.hide();

      expect(component.btnActionDisabled).toEqual(true);
    }));

    it('should call hide on the modal ref', fakeAsync(() => {
      component.show(UiError.general);
      tick();
      expect(component.modalRef).toBeTruthy();

      spyOn(component.modalRef, 'hide').and.callThrough();
      component.hide();

      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    }));

    it('Should subscribe to the modal service on hidden event', fakeAsync(() => {
      component.show(UiError.general);
      tick();

      spyOn(modalService.onHidden, 'emit').and.callThrough();
      modalService.onHidden.emit();
      component.hide();

      tick();
      modalService.onHidden.subscribe(() => {
        expect(modalService.onHidden.subscribe).toHaveBeenCalledTimes(1);
      });
    }));
  }); // describe - hide()

  // ----------------------------------------------------------------------- intercomShow()
  describe('intercomShow()', () => {
    it('should delegate to intercomShow() from logging service', fakeAsync(() => {
      component.show(UiError.general);
      tick();

      spyOn(loggingService, 'intercomShow').and.returnValue(null);
      component.intercomShow();
      expect(loggingService.intercomShow).toHaveBeenCalledTimes(1);
    }));

    it('should call this.hide()', fakeAsync( () => {
      component.show(UiError.general);
      tick();
      spyOn(component, 'hide').and.callThrough();
      component.intercomShow();
      expect(component.hide).toHaveBeenCalledTimes(1);
    }));
  }); // describe - intercomShow()

  // ----------------------------------------------------------------------- redirectToSignIn()
  describe('redirectToSignIn()', () => {
    it('should disable modal action btn', () => {
      component.redirectToSignIn();

      expect(component.btnActionDisabled).toEqual(true);
    });

    it('should disable modal action btn', () => {
      component.redirectToSignIn();

      expect(stateRoutingService.performRedirect).toHaveBeenCalledOnceWith(CONSTANTS.UNAUTHORIZED_REDIRECT_LOGIN_URL);
    });
  }); // describe - redirectToSignIn()


  // ------------------------------------------------------------------------ getModalOptions()
  describe('getModalOptions()', () => {
    describe('if the error is sessionExpired', () => {
      it('should return options to \'freeze\' the modal', () => {
        const modalOptions: ModalOptions = component.getModalOptions(UiError.sessionExpired);

        expect(modalOptions.backdrop).toEqual('static');
        expect(modalOptions.keyboard).toEqual(false);
      });
    }); // describe - if the error is related to expired session

    describe('if the error is anything but sessionExpired', () => {
      it('should return empty modal options', () => {
        Object.keys(UiError)
          .filter(key => key !== 'sessionExpired') // UiError.sessionExpired
          .forEach(key => {
            const uiError: UiError = UiError[key];
            const modalOptions: ModalOptions = component.getModalOptions(uiError);

            expect(modalOptions).toEqual(component.defaultModalOptions);
          });
      });
    }); // describe - if the error is related to expired session
  }); // describe - getModalOptions()


  // ------------------------------------------------------------------ isDelegatedAccessMode()
  describe('isDelegatedAccessMode()', () => {
    it('should return true', () => {
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(true);
      expect(component.isDelegatedAccessMode()).toEqual(true);
    });

    it('should return false', () => {
      spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);
      expect(component.isDelegatedAccessMode()).toEqual(false);
    });
  }); // describe - isDelegatedAccessMode()

  // ---------------------------------------------------------------------------- ngOnDestroy()
  describe('ngOnDestroy()', () => {
    it('should unregister itself from the error service', () => {
      spyOn(errorService, 'removeInstances');
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(errorService.removeInstances).toHaveBeenCalledWith();
      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()
});
