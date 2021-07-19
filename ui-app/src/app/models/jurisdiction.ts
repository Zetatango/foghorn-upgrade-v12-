/**
 * These are the supported jurisdiction by the app. Currently, Canadian provinces only.
 */
export enum Jurisdiction {
  CD = 'CD', // Canada
  AB = 'AB',
  BC = 'BC',
  MB = 'MB',
  NB = 'NB',
  NL = 'NL',
  NS = 'NS',
  NT = 'NT',
  NU = 'NU',
  ON = 'ON',
  PE = 'PE',
  QC = 'QC',
  SK = 'SK',
  YT = 'YT'
}

export function isJurisdiction(value: string): boolean {
  return Object.values(Jurisdiction).includes(value as Jurisdiction);
}

export function asJurisdiction(value: string): Jurisdiction {
  return (isJurisdiction(value)) ? value as Jurisdiction : null;
}
