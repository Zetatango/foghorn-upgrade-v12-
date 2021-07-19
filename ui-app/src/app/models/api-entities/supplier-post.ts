// TODO: Check the entire project and expand the use of these interface to every component that should use it.

export interface SupplierPost {
  // Required
  name: string;
  institution_number: string;
  transit_number: string;
  account_number: string;

  // Optional
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  state_province?: string;

  phone_number?: string;
  business_number?: string;
  jurisdiction?: string;
  operate_in?: string;
}
