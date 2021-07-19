export interface DirectPaymentPost {
  merchant_id: string;
  amount: number;
  invoice_id?: string;
  invoice_number?: string;
  account_number?: string;
  payee_id?: string;
}
