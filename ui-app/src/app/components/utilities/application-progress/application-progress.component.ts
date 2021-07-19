import { Component, Input, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProgressLabel } from '../../../models/progress-label';

@Component({
  selector: 'ztt-application-progress',
  templateUrl: './application-progress.component.html'
})
export class ApplicationProgressComponent implements OnInit, AfterViewInit {
  readonly progressBarMax = 100;

  @Input() step: number;
  @Input() stepLabels: ProgressLabel;
  @Input() subtext: string;

  constructor(public translateService: TranslateService) {}

  ngOnInit(): void {
    this.step = this.step || 1;
    this.stepLabels = this.stepLabels || {};

    if (Object.keys(this.stepLabels).length) return;

    // default labels for application progress
    this.stepLabels = {
      first: this.translateService.instant('APPLICATION_PROGRESS.SELECT_ADVANCE'),
      second: this.translateService.instant('APPLICATION_PROGRESS.REVIEW_AND_CONFIRM'),
      third: this.translateService.instant('APPLICATION_PROGRESS.SIGN_THE_AGREEMENT'),
      fourth: this.translateService.instant('APPLICATION_PROGRESS.SET_UP_BANKING'),
    };
  }

  /* istanbul ignore next */
  ngAfterViewInit(): void {
    this.resizeProgressBar();
  }

  // TEAMPLATE HELPERS
  /* istanbul ignore next */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.resizeProgressBar();
  }

  /* istanbul ignore next */
  private resizeProgressBar(): void {
    const activeStep: HTMLElement = document.querySelector('.active-step');
    const progressStripe: HTMLElement = document.querySelector('.progress-bar');

    if (activeStep === null || progressStripe === null) return;

    const activeStepBounds = activeStep.getBoundingClientRect();
    const progressStripeBounds = progressStripe.getBoundingClientRect();

    if (this.step === 2.5) {
      progressStripe.style.width = '50%';
    } else {
      progressStripe.style.width = activeStepBounds.left + (activeStepBounds.width / 2) - progressStripeBounds.left + 'px';
    }
  }

  isWaiting(): boolean {
    return this.step === 2.5;
  }

  isActiveStep(referenceStep: number): boolean {
    return this.step === referenceStep;
  }

  isCompletedStep(referenceStep: number): boolean {
    return this.step > referenceStep;
  }
}
