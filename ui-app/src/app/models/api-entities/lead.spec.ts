import { leadApplicantAttributesFactory, leadFactory, leadMerchantAttributesFactory } from "app/test-stubs/factories/lead";
import { ApplicantInfo, MerchantInfo } from "./lead";


describe('MerchantInfo', () => {
  describe('constructor()', () => {
    it('should have falsy values when attempting to set as null', () => {
      const merchantInfo = new MerchantInfo(null, null);

      expect(merchantInfo.name).toBeFalsy();
      expect(merchantInfo.doing_business_as).toBeFalsy();
      expect(merchantInfo.phone_number).toBeFalsy();
      expect(merchantInfo.industry).toBeFalsy();
      expect(merchantInfo.business_num).toBeFalsy();
      expect(merchantInfo.incorporated_in).toBeFalsy();
      expect(merchantInfo.address_line_1).toBeFalsy();
      expect(merchantInfo.address_line_2).toBeFalsy();
      expect(merchantInfo.city).toBeFalsy();
      expect(merchantInfo.state_province).toBeFalsy();
      expect(merchantInfo.postal_code).toBeFalsy();
      expect(merchantInfo.self_attested_date_established).toBeFalsy();
      expect(merchantInfo.operate_in).toBeFalsy();
      expect(merchantInfo.referrer).toBeFalsy();
      expect(merchantInfo.equifax_file_number).toBeFalsy();
    });

    it('should set values as expected', () => {
      const lead = leadFactory.build();
      const attributes = leadMerchantAttributesFactory.build();
      const merchantInfo = new MerchantInfo(lead, attributes);

      expect(merchantInfo.name).toEqual(lead.merchant_name);
      expect(merchantInfo.doing_business_as).toEqual(attributes.merchant_doing_business_as);
      expect(merchantInfo.phone_number).toBeTruthy();
      expect(merchantInfo.industry).toEqual(attributes.merchant_industry);
      expect(merchantInfo.business_num).toEqual(attributes.merchant_business_number);
      expect(merchantInfo.incorporated_in).toEqual(attributes.merchant_jurisdiction);
      expect(merchantInfo.address_line_1).toEqual(attributes.merchant_address_line_1);
      expect(merchantInfo.address_line_2).toEqual(attributes.merchant_address_line_2);
      expect(merchantInfo.city).toEqual(attributes.merchant_city);
      expect(merchantInfo.state_province).toEqual(attributes.merchant_state_province);
      expect(merchantInfo.postal_code).toEqual(attributes.merchant_postal_code);
      expect(merchantInfo.self_attested_date_established).toEqual(new Date(attributes.merchant_self_attested_date_established));
      expect(merchantInfo.operate_in).toEqual(attributes.merchant_operate_in);
      expect(merchantInfo.referrer).toEqual(attributes.merchant_referrer);
      expect(merchantInfo.equifax_file_number).toEqual(attributes.merchant_equifax_file_number);
    });
  });
});


describe('ApplicantInfo', () => {
  describe('constructor()', () => {
    it('should have falsy values when attempting to set as null', () => {
      const applicantInfo = new ApplicantInfo(null, null);

      expect(applicantInfo.first_name).toBeFalsy();
      expect(applicantInfo.last_name).toBeFalsy();
      expect(applicantInfo.middle_name).toBeFalsy();
      expect(applicantInfo.suffix).toBeFalsy();
      expect(applicantInfo.email).toBeFalsy();
      expect(applicantInfo.phone_number).toBeFalsy();
      expect(applicantInfo.date_of_birth).toBeFalsy();
      expect(applicantInfo.owner_since).toBeFalsy();
      expect(applicantInfo.address_line_1).toBeFalsy();
      expect(applicantInfo.address_line_2).toBeFalsy();
      expect(applicantInfo.city).toBeFalsy();
      expect(applicantInfo.state_province).toBeFalsy();
      expect(applicantInfo.postal_code).toBeFalsy();
    });

    it('should set values as expected', () => {
      const lead = leadFactory.build();
      const attributes = leadApplicantAttributesFactory.build();
      const applicantInfo = new ApplicantInfo(lead, attributes);

      expect(applicantInfo.first_name).toEqual(lead.applicant_first_name);
      expect(applicantInfo.last_name).toEqual(lead.applicant_last_name);
      expect(applicantInfo.middle_name).toEqual(attributes.applicant_middle_name);
      expect(applicantInfo.suffix).toEqual(attributes.applicant_suffix);
      expect(applicantInfo.phone_number).toBeTruthy();
      expect(applicantInfo.date_of_birth).toEqual(new Date(attributes.applicant_date_of_birth));
      expect(applicantInfo.owner_since).toEqual(new Date(attributes.applicant_owner_since));
      expect(applicantInfo.address_line_1).toEqual(attributes.applicant_address_line_1);
      expect(applicantInfo.address_line_2).toEqual(attributes.applicant_address_line_2);
      expect(applicantInfo.city).toEqual(attributes.applicant_city);
      expect(applicantInfo.state_province).toEqual(attributes.applicant_state_province);
      expect(applicantInfo.postal_code).toEqual(attributes.applicant_postal_code);
    });
  });
});

describe('BaseLeadInfo', () => {
  it('formats phone number as expected', () => {
    const lead = leadFactory.build();
    const attributes = leadMerchantAttributesFactory.build({ merchant_phone_number: '+16666666666' });
    const merchantInfo = new MerchantInfo(lead, attributes);

    expect(merchantInfo.phone_number).toEqual('6666666666');
  });

  it('formats invalid date as expected', () => {
    const lead = leadFactory.build();
    const attributes = leadMerchantAttributesFactory.build({ merchant_self_attested_date_established: '01-2020' });
    const merchantInfo = new MerchantInfo(lead, attributes);

    expect(merchantInfo.self_attested_date_established).toBeUndefined();
  });
});
