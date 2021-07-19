import { Lead } from './api-entities/lead';
import { BankAccountDetails, Merchant } from './api-entities/merchant';
import { Currency } from './api-entities/utility';

export interface BankAccount {
  id: string;
  owner_guid: string;
  currency: Currency;
  institution_number: string;
  transit_number: string;
  account_number: string;
  name: string;
  verified: string; // TODO [Val] Reconsider our API because this is not cute.
  source: BankAccountSource;
}

export const enum BankAccountSource {
  manual = 'manual',
  flinks = 'flinks'
}

export interface BankAccountPost {
  institution_number: string;
  transit_number: string;
  account_number: string;
}

export const enum FlinksPollingState {
  success = 'completed',
  pending = 'pending'
}

export class BankAccountOwner implements Partial<Merchant>{
  id: string;
  selected_bank_account?: string;
  selected_insights_bank_accounts: string[];
  selected_insights_bank_accounts_details: BankAccountDetails[];
  desired_bank_account_balance: number;
  bank_connection_required: boolean;
  flinks_account_uuids: string[];

  constructor(owner: Merchant | Lead) {
    this.id = owner?.id;
    this.selected_bank_account = (owner as Merchant)?.selected_bank_account;
    this.selected_insights_bank_accounts = owner?.selected_insights_bank_accounts || [];
    this.selected_insights_bank_accounts_details = owner?.selected_insights_bank_accounts_details || [];
    this.desired_bank_account_balance = owner?.desired_bank_account_balance;
    this.bank_connection_required = (owner as Merchant)?.bank_connection_required;
    this.flinks_account_uuids = this.selected_insights_bank_accounts_details.map(account => account.flinks_account_uuid);
  }

  isLead(): boolean {
    return /(^lead_\w+$)/.test(this.id);
  }

  isMerchant(): boolean {
    return /(^m_\w+$)/.test(this.id);
  }

  isCfaUnsupported(): boolean {
    return this.bank_connection_required || !this.hasFlinksAccount();
  }

  bankConnectionRequired(): boolean {
    return !!this.bank_connection_required;
  }

  areInsightsBankAccountsChosen(): boolean {
    return !!this.selected_insights_bank_accounts.length;
  }

  hasCompletedCYB(): boolean {
    return !this.bank_connection_required && !!this.selected_bank_account;
  }

  private hasFlinksAccount(): boolean {
    const merchantFlinks = this.selected_insights_bank_accounts_details
      && this.selected_insights_bank_accounts_details.some((account: BankAccountDetails) => account.flinks_account_uuid);

    const leadFlinks = this.isLead() && this.selected_insights_bank_accounts.length;
    return !!(merchantFlinks || leadFlinks);
  }
}
