import { ComponentFactoryResolver, ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { LoggingService } from 'app/services/logging.service';

@Injectable()
export class DynamicComponentService {

  private _viewContainerRef: ViewContainerRef;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private loggingService: LoggingService
  ) {}

  set viewContainerRef(viewContainerRef: ViewContainerRef) {
    this._viewContainerRef = viewContainerRef;
  }

  get viewContainerRef(): ViewContainerRef {
    return this._viewContainerRef;
  }

  loadComponent(component: Type<any>): ComponentRef<any> { // eslint-disable-line
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    const componentName = this.componentName(component);
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    this.loggingService.logCurrentPage(componentName);
    return componentRef;
  }

  private componentName(component): string {
    return component.className || component.name;
  }
}
