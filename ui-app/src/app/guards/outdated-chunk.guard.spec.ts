import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LogSeverity } from 'app/models/api-entities/log';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { OutdatedChunkGuard } from './outdated-chunk.guard';

describe('OutdatedChunkGuard', () => {
  let guard: OutdatedChunkGuard;
  let configurationService: ConfigurationService;
  let loggingService: LoggingService;

  let loadAppVersionSpy: jasmine.Spy;
  let logSpy: jasmine.Spy;
  let onCurrentAppVersionSpy: jasmine.Spy;
  let reloadPageAtRouteSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        CookieService,
        ConfigurationService,
        LoggingService,
        UtilityService
      ]
    });

    configurationService = TestBed.inject(ConfigurationService);
    loggingService = TestBed.inject(LoggingService);
    guard = new OutdatedChunkGuard(configurationService, loggingService);

    loadAppVersionSpy = spyOn(configurationService, 'loadAppVersion').and.returnValue(of(null));
    logSpy = spyOn(loggingService, 'log')
    onCurrentAppVersionSpy = spyOnProperty(configurationService, 'onCurrentAppVersion');
    reloadPageAtRouteSpy = spyOn(guard, 'reloadPageAtRoute');
  });

  it('should be truthy', () => {
    expect(guard).toBeTruthy();
  });

  it('should return false when versions do not match', async () => {
    onCurrentAppVersionSpy.and.returnValue(false);
    guard.canLoad(null)
      .then((res) => {
        expect(res).toBeFalse();
        expect(loadAppVersionSpy).toHaveBeenCalledTimes(1);
      })
      .catch((e) => {
        fail(`should not fail ${e}`);
      });
  });

  it('should call navigate when versions do not match', async () => {
    onCurrentAppVersionSpy.and.returnValue(false);
    const fakeRoute = {path: 'insights'};
    guard.canLoad(fakeRoute)
      .then((res) => {
        expect(res).toBeFalse();
        expect(reloadPageAtRouteSpy).toHaveBeenCalledOnceWith(fakeRoute.path);
        expect(loadAppVersionSpy).toHaveBeenCalledTimes(1);
      })
      .catch((e) => {
        fail(`should not fail ${e}`);
      });
  });

  it('should call send a log when versions do not match', async () => {
    onCurrentAppVersionSpy.and.returnValue(false);
    const fakeRoute = {path: 'insights'};
    const expectedMessage = {
      severity: LogSeverity.info,
      message: `Reloaded chunk at: ${fakeRoute.path}`
    };
    guard.canLoad(fakeRoute)
      .then((res) => {
        expect(res).toBeFalse();
        expect(logSpy).toHaveBeenCalledOnceWith(expectedMessage);
      })
      .catch((e) => {
        fail(`should not fail ${e}`);
      });
  });

  it('should return true when version matches', async () => {
    onCurrentAppVersionSpy.and.returnValue(true);
    guard.canLoad(null)
      .then((res) => {
        expect(res).toBeTrue();
        expect(loadAppVersionSpy).toHaveBeenCalledTimes(1);
      })
      .catch((e) => {
        fail(`should not fail ${e}`);
      });
  });

  it('should return false on error', async () => {
    loadAppVersionSpy.and.returnValue(throwError(internalServerErrorFactory.build()));
    guard.canLoad(null)
      .then((res) => {
        expect(res).toBeFalse();
        expect(loadAppVersionSpy).toHaveBeenCalledTimes(1);
      })
      .catch((e) => {
        fail(`should not fail ${e}`);
      });
  });
});
