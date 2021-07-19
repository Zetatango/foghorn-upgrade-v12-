/**
 * These are the supported Provinces by the app. Currently, Canadian provinces only.
 */
export enum Province {
  CD = 'CD', // TODO [Val] Temporary to facilitate the progressive introduction of Jurisdiction.
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

export function isProvince(value: string): boolean {
  return Object.values(Province).includes(value as Province);
}

export function asProvince(value: string): Province {
  return (isProvince(value)) ? value as Province : null;
}
