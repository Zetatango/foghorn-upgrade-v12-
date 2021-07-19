import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { LoadingService } from 'app/services/loading.service';

@Component({
  selector: 'ztt-loading',
  templateUrl: './loading.component.html'
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Input() name: string;
  @Input() showLoader = true;
  isVisible = false;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.registerInstance(this.name, this);
  }

  ngOnDestroy(): void {
    this.loadingService.removeInstances(this.name, this);
  }

  show(): void {
    this.isVisible = true;
  }
  hide(): void {
    this.isVisible = false;
  }
}
