import { AddBankAccountManualComponent } from './add-bank-account-manual.component';

// Form Stubbing

interface FormStub {
  transit_number: string;
  institution_number: string;
  account_number: string;
}

function stubForm(comp: AddBankAccountManualComponent, formStub: FormStub) {
  comp.bankInformationFormGroup.controls['transit_number'].setValue(formStub.transit_number);
  comp.bankInformationFormGroup.controls['institution_number'].setValue(formStub.institution_number);
  comp.bankInformationFormGroup.controls['account_number'].setValue(formStub.account_number);
}

export const validFormStub: FormStub = {
  transit_number: '00000',
  institution_number: '000',
  account_number: '00000'
};

export const invalidFormStub: FormStub = {
  transit_number: '',
  institution_number: '',
  account_number: ''
};

export const stubValidBankingInfoForm = (comp: AddBankAccountManualComponent): void => stubForm(comp, validFormStub);
export const stubInvalidBankingInfoForm = (comp: AddBankAccountManualComponent): void => stubForm(comp, invalidFormStub);
