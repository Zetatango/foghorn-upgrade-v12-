import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { Lead } from 'app/models/api-entities/lead';
import { Merchant } from 'app/models/api-entities/merchant';
import { Partner } from 'app/models/user-entities/partner';
import { UserProfile } from 'app/models/user-entities/user-profile';
import { SupportedLanguage } from '../languages';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  referrer_path: string;
  profiles: UserProfile[];
  selected_profile: UserProfile;
  partner: Partner;
  business_partner_application: BusinessPartnerApplication;
  merchant: Merchant;
  lead?: Lead;
  applicant_guid?: string;
  guarantor?: string;
  preferred_language: SupportedLanguage;
  insights_preference: boolean;
  product_preference: ProductPreference;
}

export interface UpdateInsightsPreferencePut {
  opt_in: boolean;
}

export enum ProductPreference {
  CFA = 'CFA',
  LOC = 'LOC'
}
