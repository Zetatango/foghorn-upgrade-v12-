import { TestBed } from '@angular/core/testing';
import { HeaderService } from './header.service';

describe('HeaderService', () => {
  let headerService: HeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ HeaderService ]
    });

    headerService = TestBed.inject(HeaderService);
  });

  it('should be created', () => {
    expect(headerService).toBeTruthy();
  });
});
