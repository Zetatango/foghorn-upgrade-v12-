import { bankAccountDetailsFactory } from 'app/test-stubs/factories/bank-account-details';
import { leadFactory } from 'app/test-stubs/factories/lead';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { BankAccountOwner } from './bank-account';

describe('BankAccountOwner', () => {
  describe('constructor()', () => {
    it('should handle a lead passed in', () => {
      const lead = leadFactory.build({
        selected_insights_bank_accounts: ['ba_123'],
        desired_bank_account_balance: 300,
        selected_insights_bank_accounts_details: bankAccountDetailsFactory.buildList(1)
      });
      const owner = new BankAccountOwner(lead);

      expect(owner.id).toEqual(lead.id);
      expect(owner.selected_bank_account).toBeUndefined();
      expect(owner.selected_insights_bank_accounts).toEqual(lead.selected_insights_bank_accounts);
      expect(owner.selected_insights_bank_accounts_details).toEqual(lead.selected_insights_bank_accounts_details);
      expect(owner.flinks_account_uuids).toEqual([lead.selected_insights_bank_accounts_details[0].flinks_account_uuid]);
      expect(owner.desired_bank_account_balance).toEqual(lead.desired_bank_account_balance);
      expect(owner.bank_connection_required).toBeUndefined();
    });

    it('should handle a merchant passed in', () => {
      const merchant = merchantDataFactory.build({
        selected_insights_bank_accounts: ['ba_123'],
        selected_insights_bank_accounts_details: bankAccountDetailsFactory.buildList(1),
        desired_bank_account_balance: 300,
        bank_connection_required: true,
        selected_bank_account: 'ba_123'
      });
      const owner = new BankAccountOwner(merchant);

      expect(owner.id).toEqual(merchant.id);
      expect(owner.selected_bank_account).toEqual(merchant.selected_bank_account);
      expect(owner.selected_insights_bank_accounts).toEqual(merchant.selected_insights_bank_accounts);
      expect(owner.selected_insights_bank_accounts_details).toEqual(merchant.selected_insights_bank_accounts_details);
      expect(owner.flinks_account_uuids).toEqual([merchant.selected_insights_bank_accounts_details[0].flinks_account_uuid]);
      expect(owner.desired_bank_account_balance).toEqual(merchant.desired_bank_account_balance);
      expect(owner.bank_connection_required).toBeTrue();
    });

    it('should handle null being passed in', () => {
      const owner = new BankAccountOwner(null);

      expect(owner.id).toBeUndefined();
      expect(owner.selected_bank_account).toBeUndefined();
      expect(owner.selected_insights_bank_accounts).toEqual([]);
      expect(owner.selected_insights_bank_accounts_details).toEqual([]);
      expect(owner.flinks_account_uuids).toEqual([]);
      expect(owner.desired_bank_account_balance).toBeUndefined();
      expect(owner.bank_connection_required).toBeUndefined();
    });

    describe('isLead', () => {
      it('should return true for lead', () => {
        const owner = new BankAccountOwner(leadFactory.build());
        expect(owner.isLead()).toBeTrue();
      });

      it('should return false for merchant', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build());
        expect(owner.isLead()).toBeFalse();
      });

      it('should return false for null', () => {
        const owner = new BankAccountOwner(null);
        expect(owner.isLead()).toBeFalse();
      });
    });

    describe('isMerchant', () => {
      it('should return true for merchant', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build());
        expect(owner.isMerchant()).toBeTrue();
      });

      it('should return false for lead', () => {
        const owner = new BankAccountOwner(leadFactory.build());
        expect(owner.isMerchant()).toBeFalse();
      });

      it('should return false for null', () => {
        const owner = new BankAccountOwner(null);
        expect(owner.isMerchant()).toBeFalse();
      });
    });

    describe('bankConnectionRequired', () => {
      it('should return value when true', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ bank_connection_required: true }));
        expect(owner.bankConnectionRequired()).toBeTrue();
      });

      it('should return value when false', () => {
        const owner = new BankAccountOwner(null);
        expect(owner.bankConnectionRequired()).toBeFalse();
      });
    });

    describe('isCfaUnsupported', () => {
      it('should return true when bank conection is required', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ bank_connection_required: true }));
        expect(owner.isCfaUnsupported()).toBeTrue();
      });

      it('should return false when merchant has flinks details', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ selected_insights_bank_accounts_details: bankAccountDetailsFactory.buildList(1) }));
        expect(owner.isCfaUnsupported()).toBeFalse();
      });

      it('should return false when lead has a selected insight account', () => {
        const owner = new BankAccountOwner(leadFactory.build({ selected_insights_bank_accounts: ['ba_123'] }));
        expect(owner.isCfaUnsupported()).toBeFalse();
      });
    });

    describe('areInsightsBankAccountsChosen', () => {
      it('should return value when true', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ selected_insights_bank_accounts: [] }));
        expect(owner.areInsightsBankAccountsChosen()).toBeFalse();
      });

      it('should return value when false', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ selected_insights_bank_accounts: ['ba_123'] }));
        expect(owner.areInsightsBankAccountsChosen()).toBeTrue();
      });
    });

    describe('hasCompletedCYB', () => {
      it('should return true when bank account is selected and bank_connection_required is false', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ selected_bank_account: 'ba_123', bank_connection_required: false }));
        expect(owner.hasCompletedCYB()).toBeTrue();
      });

      it('should return false when bank account is NOT selected', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ selected_bank_account: null }));
        expect(owner.hasCompletedCYB()).toBeFalse();
      });

      it('should return false when bank account is selected but bank_connection_required is true', () => {
        const owner = new BankAccountOwner(merchantDataFactory.build({ selected_bank_account: 'ba_123', bank_connection_required: true }));
        expect(owner.hasCompletedCYB()).toBeFalse();
      });
    });
  });
});
