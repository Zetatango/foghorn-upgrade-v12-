import * as Factory from 'factory.ts';
import { BankAccount, BankAccountSource } from 'app/models/bank-account';
import { Currency } from 'app/models/api-entities/utility';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

export const bankAccountFactory = Factory.Sync.makeFactory<BankAccount>({
  id: 'ba_abc',
  owner_guid: 'm_abc',
  name: 'Bob\'s Business Account',
  currency: Currency.CAD,
  institution_number: '123',
  transit_number: '12345',
  account_number: '1234567890',
  verified: 'false',
  source: undefined
});

export const bankAccountResponseFactory = Factory.Sync.makeFactory<ZttResponse<BankAccount[]>>({
  status: 'SUCCESS',
  message: 'Bank accounts',
  data: bankAccountFactory.buildList(3)
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const unexpectedBankAccount = bankAccountFactory.build();

/** @deprecated Prefer factories instead. */
export const flinksBankAccount = bankAccountFactory.build({ verified: 'true', source: BankAccountSource.flinks }); // always verified

/** @deprecated Prefer factories instead. */
export const manualUnverifiedBankAccount = bankAccountFactory.build({ verified: 'false', source: BankAccountSource.manual });
/** @deprecated Prefer factories instead. */
export const manualVerifiedBankAccount = bankAccountFactory.build({ verified: 'true', source: BankAccountSource.manual });

// BANK ACCOUNT SETS

// TODO [Val] unverifiedBankAccount & verifiedBankAccount not added to those sets.

/**
 * This set must contain all expected valid flinks bank account stubs defined.
 */
export const FLINKS_BANK_ACCOUNTS = [
  flinksBankAccount
];

/**
 * This set must contain all expected valid manual bank account stubs defined.
 */
export const MANUAL_BANK_ACCOUNTS = [
  manualUnverifiedBankAccount,
  manualVerifiedBankAccount
];

/**
 * This set must contain all invalid bank account stubs defined.
 */
export const ALL_INVALID_BANK_ACCOUNTS = [
  unexpectedBankAccount
];

/**
 * This set must contain all expected valid bank account stubs defined.
 */
export const ALL_VALID_BANK_ACCOUNTS = [
  ...FLINKS_BANK_ACCOUNTS,
  ...MANUAL_BANK_ACCOUNTS
];

/**
 * This set must contain all valid & invalid bank account stubs defined.
 */
export const ALL_BANK_ACCOUNTS = [
  ...ALL_INVALID_BANK_ACCOUNTS,
  ...ALL_VALID_BANK_ACCOUNTS
];

// LONE STUBS

/** @deprecated Prefer factories instead. */
export const unverifiedBankAccount = bankAccountFactory.build({ verified: 'false' }); // TODO [Val] - Deprecate in favour of real stubs
/** @deprecated Prefer factories instead. */
export const verifiedBankAccount = bankAccountFactory.build({ verified: 'true' }); // TODO [Val] - Deprecate in favour of real stubs
