export interface LendingApplicationAcceptPut {
  // Required
  ubl_terms_agreed: boolean;
  pad_terms_agreed: boolean;

  // Note: ip_address is required by swagger and should be required in this interface
  //       but we'd rather provide at the server level where the information is more trusted.
  ip_address?: string;

  // Optional:
  payor_account_id?: string;
  payee_id?: string;
  payee_account_num?: string;
  payee_invoice_num?: string;
}
