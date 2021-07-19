import { inject, TestBed } from '@angular/core/testing';
import { ReauthService } from './reauth.service';
import { REAUTH } from 'app/constants';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { fakeObserver } from 'app/test-stubs/observer';

describe('ReauthService', () => {
  let reauthService: ReauthService;

  // Calculate width, height, left, and top in the same way that the re-auth service does
  const WIDTH = 500;
  const HEIGHT = 600;
  const WINDOW_LEFT = window.screenLeft ? window.screenLeft : window.screenX;
  const LEFT = WINDOW_LEFT + (window.innerWidth / 2) - (WIDTH / 2);
  const WINDOW_TOP = window.screenTop ? window.screenTop : window.screenY;
  const TOP = WINDOW_TOP + (window.innerHeight / 2) - (HEIGHT / 2);
  const authAttributes = `width=${WIDTH}, height=${HEIGHT}, top=${TOP}, left=${LEFT}, rel="noopener"`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReauthService]
    });
  });

  beforeEach(() => {
    reauthService = TestBed.inject(ReauthService);
  });


  it('should be created', inject([ReauthService], (service: ReauthService) => {
    expect(service).toBeTruthy();
  }));

  it('should remove flow type from local storage after reading', () => {
    localStorage.setItem('reauth_return', 'application');
    const reauthReturn = ReauthService.getReauthReturn();

    expect(reauthReturn).toEqual('application');
    expect(localStorage.getItem('reauth_return')).toBeNull();
  });

  it('should correctly set observer', () => {
    reauthService.observer = fakeObserver;
    expect(reauthService.observer).toEqual(fakeObserver);
  });

  it('should correctly set windowInstance', () => {
    const win = window.open();
    reauthService.windowInstance = win;
    expect(reauthService.windowInstance).toEqual(win);
    win.close();
  });

  describe('open()', () => {
    it('should pass down an error to caller if re-authentication returns an http error', () => {
      spyOn(window, 'open');

      localStorage.setItem('reauth_return', 'application');
      reauthService.open().subscribe(
        () => {
          expect(window.open).toHaveBeenCalledWith(
            REAUTH.URL_ROUTE + '?reauth_return=application', '_blank', authAttributes);
        },
        () => fail('Unexpected error'));
    });

    it('should pass down an error to caller if re-authentication returns an http error', () => {
      spyOn(window, 'open');

      HTTP_ERRORS.forEach(httpError => {
        localStorage.setItem('reauth_return', 'application');
        reauthService.open().subscribe(
          () => fail('Prevent silent failure of this unit test.'), // Nothing to check here, won't be reached
          err => expect(err.status).toEqual(httpError.status));

        expect(window.open).toHaveBeenCalledWith(
          REAUTH.URL_ROUTE + '?reauth_return=application', '_blank', authAttributes);
      });
    });

    it('should start the polling after opening the window', () => {
      spyOn(window, 'open');
      spyOn(window, 'setInterval');

      localStorage.setItem('reauth_return', 'application');
      reauthService.open().subscribe(
        res => expect(res).toBeTruthy(),
        () => fail('Unexpected error'));
      expect(window.setInterval).toHaveBeenCalledTimes(1);
    });

    it('should open with window\'s rel attribute set to "noopener"', () => {
      spyOn(window, 'open').and.callThrough();

      localStorage.setItem('reauth_return', 'application');
      reauthService.open().subscribe(
        res => expect(res).toBeTruthy(),
        () => fail('Unexpected error'));

      expect(window.open).toHaveBeenCalledWith(
        REAUTH.URL_ROUTE + '?reauth_return=application', '_blank', authAttributes);
    });
  }); // describe - open()

  describe('checkIfClosed()', () => {
    it('should check if window is closed', () => {
      spyOn(window, 'open');
      spyOn(reauthService, 'checkIfClosed');

      localStorage.setItem('reauth_return', 'application');
      reauthService.open().subscribe(
        () => expect(reauthService.checkIfClosed).toHaveBeenCalledTimes(1),
        () => fail('Unexpected error'));
    });

    it('should clear interval if window is closed', () => {
      spyOnProperty(reauthService, 'windowInstance').and.returnValue({ closed: true });
      spyOnProperty(reauthService, 'observer').and.returnValue({ next: () => undefined, complete: () => undefined, error: () => undefined });
      spyOn(window, 'clearInterval');

      reauthService.checkIfClosed();
      expect(window.clearInterval).toHaveBeenCalledTimes(1);
    });

    it('should call next and complete on observer if window is closed', () => {
      reauthService.observer = fakeObserver;

      spyOnProperty(reauthService, 'windowInstance').and.returnValue({ closed: true });
      spyOn(reauthService.observer, 'next');
      spyOn(reauthService.observer, 'complete');

      reauthService.checkIfClosed();

      expect(reauthService.observer.next).toHaveBeenCalledOnceWith({ status: 'fail' });
      expect(reauthService.observer.complete).toHaveBeenCalledTimes(1);
    });

    it('should not clear interval if window is not closed', () => {
      spyOnProperty(reauthService, 'windowInstance').and.returnValue({ closed: false });
      spyOn(window, 'clearInterval');

      reauthService.checkIfClosed();

      expect(window.clearInterval).not.toHaveBeenCalled();
    });
  });

  describe('reauthUrl()', () => {
    it('should set reauthUrl without locale if called without locale parameter', () => {
      localStorage.setItem('reauth_return', 'application');
      const reauthUrl = reauthService.reauthUrl();

      expect(reauthUrl).toEqual(REAUTH.URL_ROUTE + '?reauth_return=application');
    });

    it('should set reauthUrl with locale if called with locale parameter', () => {
      localStorage.setItem('reauth_return', 'application');
      const reauthUrl = reauthService.reauthUrl('fr-CA');

      expect(reauthUrl).toEqual(REAUTH.URL_ROUTE + '?reauth_return=application' + '&locale=fr-CA');
    });
  });  // describe - reauthUrl()
});
