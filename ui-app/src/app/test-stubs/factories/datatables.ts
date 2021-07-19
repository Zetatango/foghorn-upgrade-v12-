import * as Factory from 'factory.ts';
import { DatatablesParams, OrderDirection } from 'app/models/datatables';
import { DatatablesRequestParameters } from 'app/models/api-entities/datatables-request-parameters';

/********************************* FACTORIES **********************************/

export const dtParamsFactory = Factory.Sync.makeFactory<DatatablesParams>({
  columns: [{ data: 1, name: '', orderable: false, search: { regex: false, value: '' }, searchable: false }],
  draw: 1,
  length: 10,
  order: [{ column: 0, dir: OrderDirection.ascending }],
  search: { regex: false, value: '' },
  start: 0
});

// DatatablesRequestParameters
export const datatableRequestParamsFactory = Factory.Sync.makeFactory<DatatablesRequestParameters>({
  filter: '',
  limit: 10,
  offset: 0,
  order_by: 'account_number',
  order_direction: OrderDirection.ascending
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const datatableParams: DatatablesParams = dtParamsFactory.build();
/** @deprecated Prefer factories instead. */
export const defaultDatatableRequestParams = datatableRequestParamsFactory.build();
/** @deprecated Prefer factories instead. */
export const defaultCustomerSummaryRequestParams = datatableRequestParamsFactory.build({
  filter: '',
  limit: 10,
  offset: 0,
  order_by: 'col1',
  order_direction: OrderDirection.ascending
});
