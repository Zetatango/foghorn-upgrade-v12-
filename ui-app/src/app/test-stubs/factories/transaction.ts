import * as Factory from 'factory.ts';
import { Transaction } from 'app/models/api-entities/transaction';
import { TransactionState } from 'app/models/api-entities/transaction';
import { Currency } from 'app/models/api-entities/utility';
import { OrderDirection } from 'app/models/datatables';
import { TransactionList } from 'app/models/api-entities/transaction-list';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

export const transactionFactory = Factory.Sync.makeFactory<Transaction>({
  id: '100942312',
  created_at: Date.now().toString(),
  amount: 500,
  currency: Currency.CAD,
  direction: undefined,
  state: TransactionState.success,
  request_sent_at: Date.now().toString(),
  request_started_at: Date.now().toString(),
  merchant_id: 'm_abc',
  merchant_name: 'Merchant'
});

export const receivedTransactionList: TransactionList = {
  transactions: [ transactionFactory.build(), transactionFactory.build() ],
  limit: 20,
  offset: 0,
  total_count: 2,
  filtered_count: 2,
  order_by: '',
  order_direction: OrderDirection.ascending
};

export const receivedTransactionListFactory = Factory.Sync.makeFactory<TransactionList>({
  transactions: [ transactionFactory.build(), transactionFactory.build() ],
  limit: 20,
  offset: 0,
  total_count: 2,
  filtered_count: 2,
  order_by: '',
  order_direction: OrderDirection.ascending
});

export const receivedTransactionListResponseFactory = Factory.Sync.makeFactory<ZttResponse<TransactionList>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: receivedTransactionListFactory.build()
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const emptyTransaction: Transaction = transactionFactory.build();
