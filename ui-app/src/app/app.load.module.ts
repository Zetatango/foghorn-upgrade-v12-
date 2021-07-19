/* istanbul ignore file */
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AppLoadService } from 'app/services/app-load.service';
import { ZttResponse } from './models/api-entities/response';
import { ApplicationConfiguration } from './models/application-configuration';
import { UserSession } from './models/user-entities/user-session';

export function load_config(appLoadService: AppLoadService) {
  return (): Promise<ApplicationConfiguration|void> => appLoadService.loadAppConfig();
}

export function load_user_data(appLoadService: AppLoadService) {
  return (): Promise<ZttResponse<UserSession>> => appLoadService.loadUserData().toPromise();
}

@NgModule({
  imports: [ ],
  providers: [
    AppLoadService,
    { provide: APP_INITIALIZER, useFactory: load_config, deps: [ AppLoadService ], multi: true },
    { provide: APP_INITIALIZER, useFactory: load_user_data, deps: [ AppLoadService ], multi: true }
  ]
})
export class AppLoadModule {
}
