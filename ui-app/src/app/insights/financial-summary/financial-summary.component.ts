import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';

@Component({
  selector: 'ztt-financial-summary',
  templateUrl: './financial-summary.component.html',
})
export class FinancialSummaryComponent implements OnInit, OnDestroy {
  isMobile = false;
  mobileBreakpoint = 992;

  unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.setIsMobile();
    fromEvent(window, 'resize')
      .subscribe(() => {
        this.setIsMobile();
      });
  }

  setIsMobile(): void {
    this.isMobile = window.innerWidth <= this.mobileBreakpoint;
  }

}
