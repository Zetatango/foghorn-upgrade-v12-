import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import * as Factory from 'factory.ts';

/********************************* FACTORIES **********************************/

export const uiAlertFactory = Factory.Sync.makeFactory<UiAlert>({
    type: UiAlertStatus.success,
    msg: ''
});
