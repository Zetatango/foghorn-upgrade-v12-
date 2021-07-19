import { MerchantProperties } from './merchant-properties';

export interface UserProperties {
  applicant?: string;
  guarantor?: string;
  lead?: string;
  merchant?: MerchantProperties;
  partner: string;
  role: UserRole;
}

export enum UserRole {
  merchant_add = 'merchant_add',
  merchant_new = 'merchant_new',
  merchant_admin = 'merchant_admin',
  partner_admin = 'partner_admin'
}
