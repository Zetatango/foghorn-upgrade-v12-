import { Injectable } from '@angular/core';
import { UiError } from 'app/models/ui-error';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';

interface ErrorComponentType {
  show(error: UiError, context: ErrorModalContext): void;
  hide(): void;
}

@Injectable()
export class ErrorService {
  private instances: ErrorComponentType;

  public registerInstance(instance: ErrorComponentType): void {
    this.instances = instance;
  }

  public removeInstances(): void {
    delete this.instances;
  }

  public hide(): void {
    this.instances?.hide();
  }

  public show(error: UiError, context?: ErrorModalContext): void {
    this.instances?.show(error, context);
  }
}
