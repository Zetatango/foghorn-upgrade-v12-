import * as storage from 'app/helpers/storage.helper';
import { DateString } from 'app/models/api-entities/utility';
import {
  MerchantUpdateHistory,
  MerchantUpdateThrottling
} from 'app/services/business-logic/merchant-update-throttling';

describe('MerchantUpdateThrottling', () => {

  function range(start: number, end: number): number[] {
    const length = (end !== 0) ? end - start + 1 : 0;
    return Array.from({ length: length }, (_, i) => i + start);
  }

  const now = (): number => new Date().getTime();
  const oneMinute = 60 * 1000; // ms
  const oneDay = 24 * 60 * 60 * 1000; // ms
  const sevenDays = 7 * oneDay; // ms

  const m_guid = 'm_123';
  const expectedLocalStorageKey: string = 'uh_' + m_guid;

  beforeEach(() => {
    // Clean up MerchantUpdateHistory from local storage between tests
    storage.local.removeItem(expectedLocalStorageKey);
  });

  describe('exported recordMerchantUpdate & getMerchantUpdateHistory', () => {
    it('should clear date older than 7 days from object saved in local storage', () => {
      const partiallyExpiredHistory: MerchantUpdateHistory = [
        new Date(now() - oneDay * 8).toUTCString(), // Expired entry
        new Date(now() - oneDay).toUTCString()      // Non-expired entry
      ];

      spyOn(storage.local, 'getItem')
        .withArgs(expectedLocalStorageKey)
        .and.returnValue(btoa(JSON.stringify(partiallyExpiredHistory)));

      const expectedMaintainedHistory: MerchantUpdateHistory = [
        new Date(now() - oneDay).toUTCString()      // Non-expired entry
      ];

      expect(MerchantUpdateThrottling.getMerchantUpdateHistory(m_guid)).toEqual(expectedMaintainedHistory);
    });
  }); // describe - exported getMerchantUpdateHistory

  describe('exported recordMerchantUpdate', () => {
    it('should record a date entry (comparison UTC)', () => {
      expect(MerchantUpdateThrottling.getMerchantUpdateHistory(m_guid)).toEqual([]);

      const nowUtc: DateString = new Date(now()).toUTCString();
      MerchantUpdateThrottling.recordMerchantUpdate(m_guid);

      const updateHistory: MerchantUpdateHistory = MerchantUpdateThrottling.getMerchantUpdateHistory(m_guid);
      expect(updateHistory.length).toEqual(1);

      const recordedDate: DateString = updateHistory[0];

      expect(recordedDate === nowUtc).toBeTrue();
    });
  }); // describe - exported recordMerchantUpdate

  describe('exported canUpdateMerchant', () => {
    describe('when there is no MerchantUpdateHistory', () => {
      beforeEach(() => {
        spyOn(storage.local, 'getItem')
          .withArgs(expectedLocalStorageKey)
          .and.returnValue(null);
      });

      it('should return true', () => {
        expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
      });
    });

    describe('when fail to read MerchantUpdateHistory from local storage', () => {
      const expectedLocalStorageError = new Error('Failed to read from local storage');

      beforeEach(() => {
        spyOn(storage.local, 'getItem').and.callFake(() => { throw expectedLocalStorageError; });
      });

      it('should return true', () => {
        expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
      });
    }); // describe - 'when there is no MerchantUpdateHistory'

    describe('when there is a MerchantUpdateHistory', () => {
      let merchantHistoryGetItemSpy: jasmine.Spy;

      beforeEach(() => {
        merchantHistoryGetItemSpy = spyOn(storage.local, 'getItem').withArgs(expectedLocalStorageKey);
      });

      function overwriteExistingMerchantHistorySpyWith(value: MerchantUpdateHistory): void {
        merchantHistoryGetItemSpy.and.returnValue(btoa(JSON.stringify(value)));
      }

      // CONDITION 1: Up to 5 times per week.
      describe('CONDITION 1', () => {

        describe(`with less than 5 attempts in the last 7 day(s)`, () => {

          it('should return true (with attempts done closer to end of 7 day limit)', () => {

            // expired ]---------------------------- now ]
            // [         -7  -6  -5  -4  -3  -2  -1   0  ] Days from now

            // [          .   .   .   .   .   .   .   .  ] Entries recorded noted with 'x'
            // [          .   .   .   .   .   .   .   x  ]
            // [          .   .   .   .   .   .   x   x  ]
            // [          .   .   .   .   .   x   x   x  ]
            // [          .   .   .   .   x   x   x   x  ]

            range(1, 4).forEach((numberOfAttempts: number) => { // 0 to 4 attemps
              const updateHistory: MerchantUpdateHistory = range(1, numberOfAttempts) // Range of n attemps // TODO [Val] Adjust all these ranges with -1 probably
                .map((nthAttempt: number) => {
                  const deltaDay: number = nthAttempt * oneDay; // ms
                  return new Date(now() - deltaDay).toUTCString(); // One attempt i days ago for each
                });

              overwriteExistingMerchantHistorySpyWith(updateHistory);

              expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
            }); // forEach
          });

          it('should return true (with attempts done closer to start of 7 day limit)', () => {

            // expired ]---------------------------- now ]
            //           -7  -6  -5  -4  -3  -2  -1   0  ] Days from now

            //            .   .   .   .   .   .   .   .  ] Entries recorded noted with 'x'
            //            x   .   .   .   .   .   .   .  ]
            //            x   x   .   .   .   .   .   .  ]
            //            x   x   x   .   .   .   .   .  ]
            //            x   x   x   x   .   .   .   .  ]

            range(1, 4).forEach((numberOfAttempts: number) => { // 0 to 4 attemps
              const updateHistory: MerchantUpdateHistory = range(1, numberOfAttempts) // Range of n attemps
                .map((nthAttempt: number) => {
                  const deltaDay: number = nthAttempt * oneDay; // ms
                  return new Date(now() - sevenDays + deltaDay).toUTCString(); // One attempt i days ago for each
                });

              overwriteExistingMerchantHistorySpyWith(updateHistory);

              expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
            }); // forEach
          });
        }); // describe - 'with less than 5 attempts in the last 7 day(s)'

        describe(`with exactly 5 attempts in the last 7 day(s)`, () => {
          it('should return false (with attempts exhausted closer to end of 7 day limit)', () => {

            // expired ]---------------------------- now ]
            //           -7  -6  -5  -4  -3  -2  -1   0  ] Days from now
            // [          .   .   .   x   x   x   x   x  ] Entries recorded noted with 'x'

            const updateHistory: MerchantUpdateHistory = range(1, 5)
              .map((i: number) => {
                const daysDelta: number = i * oneDay; // ms
                return new Date(now() - daysDelta).toUTCString(); // One attempt i days ago for each
              });

            overwriteExistingMerchantHistorySpyWith(updateHistory);

            expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
          });

          it('should return false (with attempts exhausted closer to start of 7 day limit)', () => {

            // expired ]---------------------------- now ]
            //           -7  -6  -5  -4  -3  -2  -1   0  ] Days from now
            // [          x   x   x   x   x   .   .   .  ] Entries recorded noted with 'x'

            const updateHistory: MerchantUpdateHistory = range(1, 5)
              .map((i: number) => {
                const daysDelta: number = i * oneDay; // ms
                return new Date(now() - sevenDays + daysDelta).toUTCString(); // One attempt i days ago for each
              });

            overwriteExistingMerchantHistorySpyWith(updateHistory);

            expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
          });
        }); // describe - `with exactly 5 attempts in the last 7 day(s)`

        describe(`with more than 5 attempts in the last 7 day(s)`, () => {
          it('should return false (with attempts more than exhausted closer to end of 7 day limit)', () => {

            // expired ]---------------------------- now ]
            //           -7  -6  -5  -4  -3  -2  -1   0  ] Days from now

            // [          .   .   x   x   x   x   x   x  ] Entries recorded noted with 'x'
            // [          .   x   x   x   x   x   x   x  ]
            // [          x   x   x   x   x   x   x   x  ]
            // [         xx   x   x   x   x   x   x   x  ]
            // [        xxx   x   x   x   x   x   x   x  ]
            // [       xxxx   x   x   x   x   x   x   x  ]
            // [      xxxxx   x   x   x   x   x   x   x  ]


            range(6, 6 * 2).forEach((numberOfAttempts: number) => { // From 6 to 12 attemps
              const updateHistory: MerchantUpdateHistory = range(0, numberOfAttempts) // Range of attempts
                .map((nthAttempt: number) => {
                  const deltaDays: number = Math.min(6, nthAttempt) * oneDay; // ms
                  return new Date(now() - deltaDays).toUTCString(); // One attempt i days & i minutes ago for each (i days up to 6 days)
                });

              overwriteExistingMerchantHistorySpyWith(updateHistory);

              expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
            }); // forEach
          });

          it('should return false (with attempts more than exhausted closer to start of 7 day limit)', () => {

            // expired ]---------------------------- now     ]
            //           -7  -6  -5  -4  -3  -2  -1   0      ] Days from now

            // [          x   x   x   x   x   x   .   .      ] Entries recorded noted with 'x'
            // [          x   x   x   x   x   x   x   .      ]
            // [          x   x   x   x   x   x   x   x      ]
            // [          x   x   x   x   x   x   x   xx     ]
            // [          x   x   x   x   x   x   x   xxx    ]
            // [          x   x   x   x   x   x   x   xxxx   ]
            // [          x   x   x   x   x   x   x   xxxxx  ]


            range(6, 6 * 2).forEach((numberOfAttempts: number) => { // From 6 to 12 attemps
              const updateHistory: MerchantUpdateHistory = range(0, numberOfAttempts) // Range of attempts
                .map((nthAttempt: number) => {
                  const deltaDays: number = Math.min(6, nthAttempt) * oneDay; // ms
                  return new Date(now() - sevenDays + deltaDays).toUTCString(); // One attempt i days & i minutes ago for each (i days up to 6 days)
                });

              overwriteExistingMerchantHistorySpyWith(updateHistory);

              expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
            }); // forEach
          });
        }); // describe - 'with 5 or more attempts in the last 7 day(s)'

      }); // describe - 'CONDITION 1'

      // CONDITION 2: Up to 2 times per day
      describe('CONDITION 2', () => {

        describe(`with less than 2 attempts in the last 1 day(s)`, () => {

          it('should return true (with attempts done closer to end of 1 day limit)', () => {
            const updateHistory: MerchantUpdateHistory = [ // 1 Attempt
              new Date(now() - 5 * oneMinute).toUTCString() // 5min ago to avoid the in-progress case
            ];

            overwriteExistingMerchantHistorySpyWith(updateHistory);

            expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
          });

          it('should return true (with attempts done closer to start of 1 day limit)', () => {
            const updateHistory: MerchantUpdateHistory = [ // 1 Attempt
              new Date(now() - oneDay + 1).toUTCString() // 1 ms before expiry ago
            ];

            overwriteExistingMerchantHistorySpyWith(updateHistory);

            expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
          });

          // should return
        }); // describe - `with less than 2 attempts in the last 1 day(s)`

        describe(`with exactly 2 attempts in the last 1 day(s)`, () => {
          it('should return false (with attempts exhausted closer to end of 1 day limit)', () => {
            const updateHistory: MerchantUpdateHistory = [ // 2 Attemps
              new Date(now() - 1).toUTCString(), // 1ms ago
              new Date(now() - 2).toUTCString()  // 2ms ago
            ];

            overwriteExistingMerchantHistorySpyWith(updateHistory);
            expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
          });
        }); // describe - `with exactly 2 attempts in the last 1 day(s)`

        describe(`with more than 2 attempts in the last 1 day(s)`, () => {
          it('should return false (with attempts more than exhausted closer to end of 1 day limit)', () => {
            range(2 + 1, 2 * 2).forEach((numberOfAttempts: number) => { // From 3 to 4 attempts
              const updateHistory: MerchantUpdateHistory = range(1, numberOfAttempts) // Range of attemps
                .map((i: number) => new Date(now() - i).toUTCString()); // One attempt i ms ago for each

              overwriteExistingMerchantHistorySpyWith(updateHistory);
              expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
            }); // forEach
          });

          it('should return false (with attempts more than exhausted closer to start of 1 day limit)', () => {
            range(3, 2 * 2).forEach((numberOfAttempts: number) => { // From 3 to 4 attempts
              const updateHistory: MerchantUpdateHistory = range(1, numberOfAttempts) // Range of attemps
                .map((i: number) => {
                  return new Date(now() - oneDay + i * oneMinute).toUTCString();
                }); // One attempt i ms before expiry for each

              overwriteExistingMerchantHistorySpyWith(updateHistory);
              expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
            }); // forEach
          });
        }); // describe - `with more than 2 attempts in the last 1 day(s)`

      }); // describe - 'CONDITION 2'

      // CONDITION 3: No update in progress (last 5 min)
      describe('CONDITION 3', () => {
        it('should return false if there is an attempt just now', () => {
          const updateHistory: MerchantUpdateHistory = [ // 1 Attempt
            new Date(now()).toUTCString() // Now
          ];

          overwriteExistingMerchantHistorySpyWith(updateHistory);

          expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
        });

        it('should return true if there is an attempt less than 5 minutes ago ', () => {
          const updateHistory: MerchantUpdateHistory = [ // 1 Attempt
            new Date(now() - 2.5 * oneMinute).toUTCString() // 2min30s
          ];

          overwriteExistingMerchantHistorySpyWith(updateHistory);

          expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeFalse();
        });

        it('should return true if there is an attempt just 5 minutes ago', () => {
          const updateHistory: MerchantUpdateHistory = [ // 1 Attempt
            new Date(now() - 5 * oneMinute + 1 ).toUTCString() // 5min ago
          ];

          overwriteExistingMerchantHistorySpyWith(updateHistory);

          expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
        });

        it('should return true if there is an attempt more than 5 minutes ago ', () => {
          const updateHistory: MerchantUpdateHistory = [ // 1 Attempt
            new Date(now() - 5 * oneMinute + 1).toUTCString() // 5min1ms ago
          ];

          overwriteExistingMerchantHistorySpyWith(updateHistory);

          expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
        });

        it('should return true if there is no attempt', () => {
          const updateHistory: MerchantUpdateHistory = [];

          overwriteExistingMerchantHistorySpyWith(updateHistory);

          expect(MerchantUpdateThrottling.canUpdateMerchant(m_guid)).toBeTrue();
        });
      }); // describe - 'CONDITION 3'

    }); // describe - 'when there is a MerchantUpdateHistory'
  }); // describe - exported canUpdateMerchant

  describe('exported isMerchantUpdateInProgress', () => {
    let merchantHistoryGetItemSpy: jasmine.Spy;

    beforeEach(() => {
      merchantHistoryGetItemSpy = spyOn(storage.local, 'getItem').withArgs(expectedLocalStorageKey);
    });

    function overwriteExistingMerchantHistorySpyWith(value: MerchantUpdateHistory): void {
      merchantHistoryGetItemSpy.and.returnValue(btoa(JSON.stringify(value)));
    }

    it('should return false with no attempts in the past 10 minutes', () => {
      const updateHistory: MerchantUpdateHistory = []; // No attemps

      overwriteExistingMerchantHistorySpyWith(updateHistory);
      expect(MerchantUpdateThrottling.isMerchantUpdateInProgress(m_guid)).toBeFalse();
    });

    it('should return false with 1 or more attemps, more than 10 minutes', () => {
      range(1, 3).forEach((numberOfAttempts: number) => { // From 1 to 3 attempts
        const updateHistory: MerchantUpdateHistory = range(1, numberOfAttempts) // Range of attemps
          .map((i: number) => {
            return new Date(now() - (10 + i) * oneMinute).toUTCString();
          }); // One attempt i min before expiry for each

        overwriteExistingMerchantHistorySpyWith(updateHistory);
        expect(MerchantUpdateThrottling.isMerchantUpdateInProgress(m_guid)).toBeFalse();
      }); // forEach
    });

    it('should return true with 1 or more attemps in the past 10 minutes', () => {
      range(1, 3).forEach((numberOfAttempts: number) => { // From 1 to 3 attempts
        const updateHistory: MerchantUpdateHistory = range(1, numberOfAttempts) // Range of attemps
          .map((i: number) => {
            return new Date(now() - i * oneMinute).toUTCString();
          }); // One attempt i min before expiry for each

        overwriteExistingMerchantHistorySpyWith(updateHistory);
        expect(MerchantUpdateThrottling.isMerchantUpdateInProgress(m_guid)).toBeTrue();
      }); // forEach
    });
  }); // describe - 'exported isMerchantUpdateInProgress'

}); // describe - MerchantUpdateThrottling
