import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { LoadingService } from './loading.service';
import { LoadingComponent } from 'app/components/utilities/loading/loading.component';

let loadingService: LoadingService;
const instanceName = '1';

describe('LoadingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService]
    });

    loadingService = TestBed.inject(LoadingService);
  });

  it('should be created', inject([LoadingService], (service: LoadingService) => {
    expect(service).toBeTruthy();
  }));

  it('showMainLoader should call show on mainLoader', fakeAsync(inject([LoadingService], (service: LoadingService) => {
    spyOn(service, 'show');
    service.showMainLoader();
    tick(1);

    expect(service.show).toHaveBeenCalledWith('mainLoader');
  })));

  it('getMainLoader should return mainLoader string', inject([LoadingService], (service: LoadingService) => {
    const result = service.getMainLoader();

    expect(result).toEqual('mainLoader');
  }));

  describe('registerInstance', () => {
    it('should add instance to loadingService.instances', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);
      expect(loadingService.instances[instanceName]).toEqual(loadingComponent);
    });
  });

  describe('removeInstances', () => {
    it('should not change instance if it does not exist ', () => {
      expect(loadingService.instances[instanceName]).toBeUndefined();

      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.removeInstances(instanceName, loadingComponent);

      expect(loadingService.instances[instanceName]).toBeUndefined();
    });

    it('should remove instance if it exists', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);
      loadingService.removeInstances(instanceName, loadingComponent);

      expect(loadingService.instances[instanceName]).toBeUndefined();
    });
  });

  describe('show', () => {
    it('should call instance\'s show function if it exists', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);

      spyOn(loadingComponent, 'show');
      loadingService.show(instanceName);

      expect(loadingComponent.show).toHaveBeenCalledTimes(1);
    });

    it('should not call instance\'s show function if it does not exists', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);

      const keys =  Object.keys(loadingService.instances);
      keys.forEach(key => {
        spyOn(loadingService.instances[key], 'show');
      });
      loadingService.show('2');

      keys.forEach(key => {
        expect(loadingService.instances[key].show).not.toHaveBeenCalled();
      });
    });
  });

  describe('hide', () => {
    it('should call instance\'s hide function if it exists', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);

      spyOn(loadingComponent, 'hide');
      loadingService.hide(instanceName);

      expect(loadingComponent.hide).toHaveBeenCalledTimes(1);
    });

    it('should not call instance\'s hide function if it does not exists', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);

      const keys =  Object.keys(loadingService.instances);
      keys.forEach(key => {
        spyOn(loadingService.instances[key], 'hide');
      });
      loadingService.hide('2');

      keys.forEach(key => {
        expect(loadingService.instances[key].hide).not.toHaveBeenCalled();
      });
    });
  });

  describe('showMainLoader', () => {
    it('should call show function with main loader name', fakeAsync(() => {
      spyOn(loadingService, 'show');
      loadingService.showMainLoader();
      tick(1);

      expect(loadingService.show).toHaveBeenCalledOnceWith(loadingService.getMainLoader());
    }));
  });

  describe('hideMainLoader', () => {
    it('should call hide function with main loader name', fakeAsync(() => {
      spyOn(loadingService, 'hide');
      loadingService.hideMainLoader();
      tick(1);

      expect(loadingService.hide).toHaveBeenCalledOnceWith(loadingService.getMainLoader());
    }));
  });

  describe('instances', () => {
    it('should initially be an empty object', () => {
      expect(loadingService.instances).toEqual({});
    });

    it('should return instances', () => {
      const loadingComponent = new LoadingComponent(loadingService);
      loadingService.registerInstance(instanceName, loadingComponent);
      expect(loadingService.instances).toEqual({[instanceName]: loadingComponent});
    });
  });
});
