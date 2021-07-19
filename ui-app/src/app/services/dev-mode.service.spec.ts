import { TestBed } from '@angular/core/testing';
import { DevModeService } from './dev-mode.service';

describe('DevModeService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [ DevModeService ]
  }));

  it('should be created', () => {
    const service: DevModeService = TestBed.inject(DevModeService);
    expect(service).toBeTruthy();
  });

  it('should return the value of the built in isDevMode function', () => {
    const service: DevModeService = TestBed.inject(DevModeService);
    expect(service.isDevMode()).toBeTruthy();
  });
});
