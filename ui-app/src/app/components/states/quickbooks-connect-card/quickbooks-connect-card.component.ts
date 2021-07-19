import { Component, HostBinding, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'ztt-quickbooks-connect-card',
  templateUrl: './quickbooks-connect-card.component.html'
})
export class QuickbooksConnectCardComponent implements OnDestroy {
  @HostBinding('attr.id')
  componentID = 'ztt-quickbooks-connect-card';
  unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
