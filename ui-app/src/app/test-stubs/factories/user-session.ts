import * as Factory from 'factory.ts';
import  * as crype from 'crypto-js';
import { ProductPreference, UpdateInsightsPreferencePut, UserSession } from 'app/models/user-entities/user-session';
import { UserRole, UserProperties } from 'app/models/user-entities/user-properties';
import { UserProfile } from 'app/models/user-entities/user-profile';
import { billmarketPartner } from './partner';
import { ZttResponse } from 'app/models/api-entities/response';
import { merchantDataFactory } from './merchant';
import { SupportedLanguage } from 'app/models/languages';

/********************************* FACTORIES **********************************/

/****************************** USER PROPERTIES *******************************/
export const userPropertiesFactory = Factory.Sync.makeFactory<UserProperties>({
  partner: billmarketPartner.id,
  merchant: merchantDataFactory.build(),
  applicant: `app_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  lead: 'ld_123',
  role: UserRole.merchant_new
});

/****************************** USER PROFILE *******************************/
export const userProfileFactory = Factory.Sync.makeFactory<UserProfile>({
  uid: `prof_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  properties: userPropertiesFactory.build()
});

/****************************** USER SESSION *******************************/
export const userSessionFactory = Factory.Sync.makeFactory<UserSession>({
  id: `u_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  name: 'Bob',
  email: 'BobTheBuilder@btb.ca',
  referrer_path: 'bobthebuilder.zetatango.com',
  profiles: [],
  selected_profile: userProfileFactory.build(),
  partner: billmarketPartner,
  business_partner_application: null,
  merchant: null,
  lead: null,
  product_preference: ProductPreference.LOC,
  applicant_guid: 'app_123',
  preferred_language: SupportedLanguage.en,
  insights_preference: true
});

/*************************** USER SESSION RESPONSE ****************************/
export const userSessionResponseFactory = Factory.Sync.makeFactory<ZttResponse<UserSession>>({
  status: 'SUCCESS',
  message: 'Loaded resources',
  data: userSessionFactory.build()
});

/*************************** UPDATE INSIGHTS PREFERENCE REQUEST ****************************/
export const updateInsightsPreferenceFactory = Factory.Sync.makeFactory<UpdateInsightsPreferencePut>({
  opt_in: true
});

/********************************* PRE-CONSTRUCTED PROFILES **********************************/

export const merchantAddProfile = Factory.Sync.makeFactory<UserProfile>({
  uid: `prof_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  properties: {
    partner: billmarketPartner.id,
    role: UserRole.merchant_add
  }
});

export const merchantOnboardingProfile = Factory.Sync.makeFactory<UserProfile>({
  uid: `prof_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  properties: {
    partner: billmarketPartner.id,
    merchant: merchantDataFactory.build(),
    lead: 'ld_123',
    role: UserRole.merchant_new
  }
});

export const merchantNewProfile = Factory.Sync.makeFactory<UserProfile>({
  uid: `prof_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  properties: {
    partner: billmarketPartner.id,
    merchant: merchantDataFactory.build(),
    applicant: `app_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
    lead: 'ld_123',
    role: UserRole.merchant_new
  }
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */
