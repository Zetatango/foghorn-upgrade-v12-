import { NavToggleService } from './nav-toggle.service';
import { TestBed, waitForAsync } from '@angular/core/testing';


describe('NavToggleService', () => {
  let navToggleService: NavToggleService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [ NavToggleService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    navToggleService = TestBed.inject(NavToggleService);
    spyOn(navToggleService, 'toggleCollapse').and.callThrough();
  });

  it('should be created', () => {
    expect(navToggleService).toBeTruthy();
  });

  it('should load in a state of being collapsed', () => {
    expect(navToggleService.isCollapsed).toBeTrue();
  });

  it('should properly set the isCollapsed property', () => {
    navToggleService.toggleCollapse();

    expect(navToggleService.isCollapsed).toBeFalse();
  });
});
