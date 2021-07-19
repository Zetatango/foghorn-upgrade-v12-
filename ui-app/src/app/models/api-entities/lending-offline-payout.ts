export interface LendingOfflinePayout {
  payee: PayoutPayee;
  amount: number;
  label: string;
}

export enum PayoutPayee {
  cra = 'cra',
  landlord = 'landlord',
  key_supplier = 'key supplier',
  competitor = 'competitor',
  other = 'other'
}
