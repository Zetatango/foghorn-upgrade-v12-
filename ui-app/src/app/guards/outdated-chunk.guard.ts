import { Injectable } from '@angular/core';
import { CanLoad, Route } from '@angular/router';
import { LogSeverity } from 'app/models/api-entities/log';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from 'app/services/logging.service';

@Injectable({providedIn: 'any'})
export class OutdatedChunkGuard implements CanLoad {
  constructor(
    private configurationService: ConfigurationService,
    private loggingService: LoggingService
  ) {
  }

  canLoad(route: Route): Promise<boolean> {
    return this.configurationService.loadAppVersion().toPromise()
      .then(() => {
        if (!this.configurationService.onCurrentAppVersion) {
          this.loggingService.log({
            severity: LogSeverity.info,
            message: `Reloaded chunk at: ${route.path}`
          });
          this.reloadPageAtRoute(route.path);
        }
        return this.configurationService.onCurrentAppVersion;
      })
      .catch(() => {
        return false;
      });
  }

  /* istanbul ignore next */
  reloadPageAtRoute(path: string): void {
    location.pathname = path;
  }
}
