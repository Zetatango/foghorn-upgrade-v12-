import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

// Services
import { TranslateService } from '@ngx-translate/core';
import { OfferService } from 'app/services/offer.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';

// Models
import {
  SmallBusinessGrade,
  NO_SCORE_ASSET_PATH,
  CERT_GRADE_ASSET_PATH
} from 'app/models/api-entities/offer';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-small-business-grade',
  templateUrl: './small-business-grade.component.html'
})
export class SmallBusinessGradeComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  @Input('grade')
  get grade(): SmallBusinessGrade {
    return this._grade;
  }

  set grade(value: SmallBusinessGrade) {
    this._grade = this.eidFailedOrNoGrade(this.toGrade(value)) ? SmallBusinessGrade.none : value;
    this.renderBusinessGradeImage();
  }

  @Input() isModal = false;

  cert_grade_image_src = '';
  isLoadingGrade = true;
  isMyBusinessGrade = false;
  private _applicantId: string;
  private _grade: SmallBusinessGrade;


  get tooltipBody(): string {
    return `SMALL_BUSINESS_GRADE.TOOLTIP_BODY_${this.grade}`;
  }

  get tooltipTitle(): string {
    return `SMALL_BUSINESS_GRADE.TOOLTIP_TITLE_${this.grade}`;
  }

  constructor(
    private offerService: OfferService,
    private merchantService: MerchantService,
    private userSessionService: UserSessionService,
    public translateService: TranslateService
  ) {}

  ngOnInit(): void {
    if (!this.grade) {
      this.setApplicantId();
      this.initOffersSubscription();
    } else {
      this.isLoadingGrade = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  eidFailedOrNoGrade(grade: SmallBusinessGrade): boolean {
    return !grade || (grade === SmallBusinessGrade.none || this.merchantService.isAuthenticationFailed(this._applicantId));
  }

  toGrade(gradeString: string): SmallBusinessGrade {
    return SmallBusinessGrade[gradeString] ? SmallBusinessGrade[gradeString] : SmallBusinessGrade.none;
  }

  private setApplicantId(): void {
    this._applicantId = this.userSessionService.applicantId;
  }

  /**
   * Sets up subscription to set local data when offers have been updated.
   */
  private initOffersSubscription(): void {
    this.offerService.offers$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        () => this.updateSmallBusinessGrade()
      );
  }

  private updateSmallBusinessGrade(): void {
    if (this.offerService.offersExist()) {
      const offer = this.offerService.locOffer;
      this.grade = offer ? this.toGrade(offer.small_business_grade.charAt(0).toUpperCase()) : SmallBusinessGrade.none;
    } else {
      this.grade = SmallBusinessGrade.none;
    }

    this.isMyBusinessGrade = true;
    this.isLoadingGrade = false;
  }

  private renderBusinessGradeImage(): void {
    if (this.eidFailedOrNoGrade(this.grade)) {
      this.cert_grade_image_src = NO_SCORE_ASSET_PATH(this.translateService.currentLang);
    } else {
      this.cert_grade_image_src = CERT_GRADE_ASSET_PATH(this.grade, this.translateService.currentLang);
    }
  }
}
