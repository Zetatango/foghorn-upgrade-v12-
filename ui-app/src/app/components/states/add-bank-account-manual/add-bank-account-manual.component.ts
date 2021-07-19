import { BankAccountPost } from 'app/models/bank-account';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";
import { take } from 'rxjs/operators';

@Component({
  selector: 'ztt-add-bank-account-manual',
  templateUrl: './add-bank-account-manual.component.html'
})
export class AddBankAccountManualComponent implements OnInit {

  private _bankInformationFormGroup: FormGroup;

  // Loose validations regexp
  readonly transitNumberMinLength = 5;
  readonly transitNumberMaxLength = 5;

  readonly institutionNumberMinLength = 3;
  readonly institutionNumberMaxLength = 3;

  readonly accountNumberMinLength = 5;
  readonly accountNumberMaxLength = 12;

  readonly transitNumberRegexp = `^[0-9]{${this.transitNumberMinLength},${this.transitNumberMinLength}}$`;
  readonly institutionNumberRegexp = `^[0-9]{${this.institutionNumberMinLength},${this.institutionNumberMinLength}}$`;
  readonly accountNumberRegexp = `^[0-9]{${this.accountNumberMinLength},${this.accountNumberMaxLength}}$`;

  // UI Flags
  private _creatingBankAccount = false;
  private _cancelling = false;

  // GETTERS & SETTERS

  // Form related

  get bankInformationFormGroup(): FormGroup {
    return this._bankInformationFormGroup;
  }

  set bankInformationFormGroup(fg: FormGroup) { // Note: Used for stubbing form in unit tests.
    this._bankInformationFormGroup = fg;
  }

  // Transit Number

  get isTransitNumberTouched(): boolean {
    return this.isFormControlTouched('transit_number');
  }

  get isTransitNumberValid(): boolean {
    return this.isFormControlValid('transit_number');
  }

  get isTransitNumberInvalid(): boolean {
    return this.isFormControlInvalid('transit_number');
  }

  // Institution Number

  get isInstitutionNumberTouched(): boolean {
    return this.isFormControlTouched('institution_number');
  }

  get isInstitutionNumberValid(): boolean {
    return this.isFormControlValid('institution_number');
  }

  get isInstitutionNumberInvalid(): boolean {
    return this.isFormControlInvalid('institution_number');
  }

  // Account Number

  get isAccountNumberTouched(): boolean {
    return this.isFormControlTouched('account_number');
  }

  get isAccountNumberValid(): boolean {
    return this.isFormControlValid('account_number');
  }

  get isAccountNumberInvalid(): boolean {
    return this.isFormControlInvalid('account_number');
  }

  // Form

  get isFormInvalid(): boolean {
    return this._bankInformationFormGroup && this._bankInformationFormGroup.invalid;
  }

  // Ui Flags

  get creatingBankAccount(): boolean {
    return this._creatingBankAccount;
  }

  get cancelling(): boolean {
    return this._cancelling;
  }

  constructor(private bankAccountService: BankAccountService,
              private bankingFlowService: BankingFlowService,
              private errorService: ErrorService,
              private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  // FORM

  private initializeForm(): void {
    this._bankInformationFormGroup = this.fb.group({
      transit_number: [ '',
        [ Validators.required,
          Validators.minLength(this.transitNumberMinLength),
          Validators.maxLength(this.transitNumberMaxLength),
          Validators.pattern(new RegExp(this.transitNumberRegexp))
        ]
      ],
      institution_number: [ '',
        [ Validators.required,
          Validators.minLength(this.institutionNumberMinLength),
          Validators.maxLength(this.institutionNumberMaxLength),
          Validators.pattern(new RegExp(this.institutionNumberRegexp))
        ]
      ],
      account_number: [ '',
        [ Validators.required,
          Validators.minLength(this.accountNumberMinLength),
          Validators.maxLength(this.accountNumberMaxLength),
          Validators.pattern(new RegExp(this.accountNumberRegexp))
        ]
      ]
    });
  }

  // NAVIGATION

  cancel(): void {
    this._cancelling = true;
    this.bankingFlowService.triggerCancelEvent();
  }

  create(): void {
    if (this.isFormInvalid) return;

    this._creatingBankAccount = true;

    const bankAccountBody: BankAccountPost = {
      transit_number: this._bankInformationFormGroup.value['transit_number'].trim(),
      institution_number: this._bankInformationFormGroup.value['institution_number'].trim(),
      account_number: this._bankInformationFormGroup.value['account_number'].trim()
    };

    this.bankAccountService.createBankAccount(bankAccountBody)
      .pipe(take(1))
      .subscribe(
        () => this.next(),
        (e: ErrorResponse) => {
          Bugsnag.notify(e);
  
          this._creatingBankAccount = false;
          this.errorService.show(UiError.createBankAccount);
  
          if (e.statusCode === 409) this.next();
        }
      );
  }

  private next(): void {
    this.bankingFlowService.triggerCompleteEvent();
  }

  // PRIVATE HELPERS

  private isFormControlTouched(name: string): boolean {
    return this._bankInformationFormGroup &&
           this._bankInformationFormGroup.controls[name] &&
           this._bankInformationFormGroup.controls[name].touched;
  }

  private isFormControlValid(name: string): boolean {
    return this._bankInformationFormGroup &&
           this._bankInformationFormGroup.controls[name] &&
           this._bankInformationFormGroup.controls[name].valid;
  }

  private isFormControlInvalid(name: string): boolean {
    return this._bankInformationFormGroup &&
           this._bankInformationFormGroup.controls[name] &&
           this._bankInformationFormGroup.controls[name].invalid;
  }
}
