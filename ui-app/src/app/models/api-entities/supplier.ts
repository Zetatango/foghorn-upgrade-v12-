// TODO: Check the entire project and expand the use of these interface to every component that should use it.

export interface Supplier {
  name: string;
  id: string;
  is_business_partner: boolean;
}

// This is a supplier with extra information inputted by the user.
export interface SupplierInformation {
  name: string;
  id: string;
  is_business_partner: boolean;
  account_number: string;
  invoice_number?: string;
}
