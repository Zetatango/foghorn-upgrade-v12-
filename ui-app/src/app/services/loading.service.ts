import { Injectable } from '@angular/core';

interface LoadingComponentType {
  show(): void;
  hide(): void;
}

@Injectable()
export class LoadingService {
  private _mainLoader = 'mainLoader';
  private _instances: {[key: string]: LoadingComponentType} = {};

  registerInstance(name: string, instance: LoadingComponentType): void {
    this.instances[name] = instance;
  }

  removeInstances(name: string, instance: LoadingComponentType): void {
    if (this.instances[name] === instance) {
      delete this.instances[name];
    }
  }

  hide(name: string): void {
    if (this.instances[name]) {
      this.instances[name].hide();
    }
  }

  show(name: string): void {
    if (this.instances[name]) {
      this.instances[name].show();
    }
  }

  showMainLoader(): void {
    setTimeout(() => this.show(this._mainLoader), 1);
  }

  hideMainLoader(): void {
    setTimeout(() => this.hide(this._mainLoader), 1);
  }

  // Note: [Graham] this could be a getter, or a public var.
  getMainLoader(): string {
    return this._mainLoader;
  }

  get instances(): {[key: string]: LoadingComponentType} {
    return this._instances;
  }
}
