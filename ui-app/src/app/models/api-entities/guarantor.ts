export interface Guarantor {
  first_name: string;
  last_name: string;
  date_of_birth: string | Date;
  phone_number: string;
  email: string;
  relationship: string;
}

export interface GuarantorForm extends Guarantor {
  address_line_1: string;
  city: string;
  state_province: string;
  postal_code: string;
}

export interface GuarantorPost extends GuarantorForm {
  application_id: string;
  country: string;
}
