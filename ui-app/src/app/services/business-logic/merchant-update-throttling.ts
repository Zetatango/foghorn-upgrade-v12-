import * as storage from 'app/helpers/storage.helper';
import { DateString } from 'app/models/api-entities/utility';

const EDIT_HISTORY_RECORD_KEY_PREFIX = 'uh_';
const oneMinute = 60 * 1000; // ms
const oneDay = 24 * 60 * 60 * 1000; // ms

/**
 * This module contains the business logic around the front-end throttling of merchant update around the 'Merchant Self-Edit feature'.
 */

/** An array of UTC dates stored as strings. These are not necessarily sorted. */
export type MerchantUpdateHistory = DateString[];

export class MerchantUpdateThrottling {

  // PRIVATE

  private static maintainMerchantUpdateHistory(history: MerchantUpdateHistory): MerchantUpdateHistory {
    const historyExpiry = 7 * oneDay; // 7 days in ms
    const now = new Date().getTime(); // ms

    const maintainedHistory = history
      .map((record: DateString) => new Date(record).getTime())    // DateString -> Date
      .filter((record: number) => (now - record) <= historyExpiry)
      .map((record: number) => new Date(record).toUTCString());   // Number -> DateString

    return maintainedHistory;
  }

  // PUBLIC

  static getMerchantUpdateHistory(merchant_guid: string): MerchantUpdateHistory {
    const editHistoryRecordKey = EDIT_HISTORY_RECORD_KEY_PREFIX + merchant_guid;

    let existingHistory: MerchantUpdateHistory;
    try {
      existingHistory = JSON.parse(atob(storage.local.getItem(editHistoryRecordKey)));
    } catch (e) {
      existingHistory = [];
    }

    return this.maintainMerchantUpdateHistory(existingHistory);
  }

  static recordMerchantUpdate(merchant_guid: string): void {
    // Important: Storing in  UTC format looses the milliseconds precision.

    const now: DateString = new Date().toUTCString(); // ms
    const editHistoryRecordKey = EDIT_HISTORY_RECORD_KEY_PREFIX + merchant_guid;
    const existingHistory = this.getMerchantUpdateHistory(merchant_guid);

    existingHistory.push(now);
    storage.local.setItem(editHistoryRecordKey, btoa(JSON.stringify(existingHistory)));
  }

  static canUpdateMerchant(merchant_guid: string): boolean {
    const now = new Date().getTime(); // ms
    const existingHistory: number[] = this.getMerchantUpdateHistory(merchant_guid)
      .map((record: DateString) => new Date(record).getTime()); // DateString -> number

    // Up to twice per day
    const twiceADay = existingHistory
      .filter((record: number) => record > now - oneDay) // Keep the last 24h
      .length < 2;

    // Up to 5 times a week
    const oneWeek = 7 * oneDay; // ms
    const fiveTimesAWeek = existingHistory
      .filter((record: number) => record > now - oneWeek) // Keep the last 7 days
      .length < 5;

    const conditionsSatisfied: boolean[] = [
      twiceADay,
      fiveTimesAWeek,
      !MerchantUpdateThrottling.isMerchantUpdateInProgress(merchant_guid)
    ];

    return conditionsSatisfied.reduce((p: boolean, n: boolean) => !!p && !!n, true); // andmap
  }

  static isMerchantUpdateInProgress(merchant_guid: string): boolean {
    const now = new Date().getTime(); // ms
    const existingHistory = this.getMerchantUpdateHistory(merchant_guid)
      .map((record: DateString) => new Date(record).getTime()); // DateString -> number

      const fiveMinutes = 5 * oneMinute; // ms
      const recentlyUpdated: boolean = existingHistory
        .filter((record: number) => record > now - fiveMinutes) // Keep the last 10min
        .length > 0;

      return recentlyUpdated;
  }
}
