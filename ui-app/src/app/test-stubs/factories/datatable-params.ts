import * as Factory from 'factory.ts';
import { OrderDirection, DatatablesParams } from 'app/models/datatables';
import { InvoiceListParams } from 'app/models/invoice-list-params';
import { CustomerSummaryParams } from 'app/models/customer-summary-params';

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const DEFAULT_DATATABLES_PARAMS: DatatablesParams = {
    start: 0,
    length: 10,
    columns: [
        {
            data: 0,
            name: 'name',
            orderable: true,
            search: {
                value: '',
                regex: false
            },
            searchable: true
        },
        {
            data: 1,
            name: 'email',
            orderable: true,
            search: {
                value: '',
                regex: false
            },
            searchable: true
        }
    ],
    draw: 1,
    search: {
        regex: false,
        value: ''
    },
    order: [
        {
            dir: OrderDirection.ascending,
            column: 0
        }
    ]
};

/********************************* FACTORIES **********************************/

export const datatableParamsFactory = Factory.Sync.makeFactory<InvoiceListParams | CustomerSummaryParams>({
    callback: (): void => undefined,
    dataTablesParameters: null
});
