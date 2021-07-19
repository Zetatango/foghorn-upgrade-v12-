export interface ApplicantPost {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  owner_since: string;
  phone_number: string;
  sin?: string;

  address_line_1: string;
  country: string;
  city: string;
  province: string;
  postal_code: string;
}
