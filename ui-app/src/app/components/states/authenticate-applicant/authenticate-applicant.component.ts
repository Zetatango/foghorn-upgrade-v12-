import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { take, finalize } from 'rxjs/operators';
import { ApplicantAuthentication, AuthenticationQuestion } from 'app/models/api-entities/applicant-authentication';
import { AuthenticateApplicant } from 'app/models/authenticate-applicant';
import { UiError } from 'app/models/ui-error';
import { ApplicantService } from 'app/services/applicant.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UserSessionService } from 'app/services/user-session.service';
import { Observable } from 'rxjs';
import { LoadingService } from 'app/services/loading.service';
import { AppRoutes } from 'app/models/routes';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from "app/models/error-response";
import { Merchant } from 'app/models/api-entities/merchant';

@Component({
  selector: 'ztt-authenticate-applicant',
  templateUrl: './authenticate-applicant.component.html'
})

export class AuthenticateApplicantComponent implements OnInit {
  readonly step = 3;
  verifyYourselfForm: FormGroup;

  applicantId: string;
  model: AuthenticateApplicant;
  authenticationQuestions: ApplicantAuthentication;
  questions: AuthenticationQuestion[] = [];
  answers: number[] = [];

  submittingAuthentication = false;
  failedAuthentication = false;

  loaded = false;
  public mainLoader: string;

  constructor(private stateRoutingService: StateRoutingService,
              private fb: FormBuilder,
              private userSessionService: UserSessionService,
              private applicantService: ApplicantService,
              private translateService: TranslateService,
              private errorService: ErrorService,
              private merchantService: MerchantService,
              private loadingService: LoadingService) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  ngOnInit(): void {
    this.loadingService.showMainLoader();
    this.onInitNavigationGuard();

    this.setApplicantId();

    // Does not generate questions if user is in delegated access mode
    if (!this.isDelegatedAccessMode()) {
      this.getAuthenticationQuestions(this.getLanguage());
      this.createForm(new AuthenticateApplicant());
    }
  }

  // SERVICE CALLS

  getAuthenticationQuestions(language: string): void {
    this.applicantService.initAuthentication(this.applicantId, language)
      .pipe(take(1), finalize(() => this.loadingService.hideMainLoader()))
      .subscribe(() => {
        this.applicantService.getInitAuthenticateSubject()
          .pipe(take(1), finalize(() => this.loaded = true))
          .subscribe((value: any) => { // eslint-disable-line
            this.submittingAuthentication = false;
            this.authenticationQuestions = value;
            this.answers = new Array(this.authenticationQuestions.questions.length);
            this.questions = this.authenticationQuestions.questions;

            // Scroll back to the top of the page so the user sees the error dialog and it is clear that they must attempt to answer the auth questions again.
            window.scrollTo(0, 0);
          });
    },
    (err: ErrorResponse) => this.handleErrorResponse(err));
  }

  authenticate(): void {
    this.applicantService.authenticate(this.applicantId, this.authenticationQuestions.guid, this.answers)
      .pipe(take(1))
      .subscribe(() => {
        this.applicantService.getAuthenticateSubject()
          .pipe(take(1))
          .subscribe((value: any) => { // eslint-disable-line
            if (value.authenticated) {
              this.failedAuthentication = false;
              this.reloadMerchant()
                .pipe(take(1))
                .subscribe(() => this.next());
            } else { // Authentication failed but the user can attempt authentication again
              this.failedAuthentication = true;
              this.reloadMerchant()
                .pipe(take(1))
                .subscribe(() => this.getAuthenticationQuestions(this.getLanguage()));
            }
          });
      },
      (err: ErrorResponse) => {
        this.submittingAuthentication = false;
        this.handleErrorResponse(err);
      });
  }

  handleErrorResponse(err: ErrorResponse): void {
    if (err.statusCode === 503) {
      this.errorService.show(UiError.equifaxAuthentication);
    } else {
      this.reloadMerchant()
        .pipe(take(1))
        .subscribe(() => this.next());
    }
  }

  reloadMerchant(): Observable<ZttResponse<Merchant>> {
    return this.merchantService.loadMerchant();
  }

  // FORM

  submit(): void {
    // Note: Don't bother trying to authenticate if the user hasn't responded
    //       to all of the questions yet or if the user is in delegated mode.
    if (this.isDelegatedAccessMode()) {
      this.errorService.show(UiError.delegatedMode);
      return;
    }

    if (this.answers.filter(Number).length === this.questions.length) {
      this.submittingAuthentication = true;
      this.authenticate();
    }
  }

  // NAVIGATION

  onInitNavigationGuard(): void {
    if (this.authenticationCheckComplete()) {
      this.next();
    }
  }

  next(): void {
    this.stateRoutingService.navigate(AppRoutes.onboarding.waiting_lending_offers, true);
  }

  // HELPERS

  createForm(model: AuthenticateApplicant): void {
    this.verifyYourselfForm = this.fb.group(model);
  }

  setApplicantId(): void {
    this.applicantId = this.userSessionService.applicantId;
  }

  getLanguage(): string {
    return (this.translateService.currentLang === 'fr') ? 'French' : 'English';
  }

  isDelegatedAccessMode(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  /** Require applicantId to be set.
   */
  authenticationCheckComplete(): boolean {
    return this.merchantService.authenticationCheckComplete(this.applicantId);
  }
}
