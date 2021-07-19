import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoadingComponent } from './loading.component';



import { LoadingService } from 'app/services/loading.service';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;
  let loadingService: LoadingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoadingComponent],
      providers: [LoadingService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;

    loadingService = TestBed.inject(LoadingService);
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component.showLoader).toBeTrue();
    expect(component.isVisible).toBeFalse();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadingService.registerInstance with name and component', () => {
      spyOn(loadingService, 'registerInstance');
      component.name = '1';
      component.ngOnInit();

      expect(loadingService.registerInstance).toHaveBeenCalledOnceWith(component.name, component);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call loadingService.removeInstances with name and component', () => {
      spyOn(loadingService, 'removeInstances');
      component.name = '1';
      component.ngOnDestroy();

      expect(loadingService.removeInstances).toHaveBeenCalledOnceWith(component.name, component);
    });
  });

  describe('show()', () => {
    it('should set isVisible to true', () => {
      component.isVisible = false;
      component.show();

      expect(component.isVisible).toBeTrue();
    });
  });

  describe('hide()', () => {
    it('should set isVisible to false', () => {
      component.isVisible = true;
      component.hide();

      expect(component.isVisible).toBeFalse();
    });
  });
});
