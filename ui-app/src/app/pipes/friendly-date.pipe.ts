import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

const MILLIS_SECOND = 1000;
const SECONDS_MINUTE = 60;
const MINUTES_HOUR = 60;
const HOURS_DAY = 24;
const DAYS_WEEK = 7;
const DAYS_MONTH = 30;

@Pipe({
  name: 'friendlyDate'
})
export class FriendlyDatePipe extends DatePipe implements PipeTransform {
  private static convertToFriendlyFutureDate(locale?: string): string | null {
    return locale && locale.indexOf('fr') > -1 ? 'Demain' : 'Tomorrow';
  }

  private static convertToFriendlyPastDate(value: any, locale?: string): string | null { // eslint-disable-line
    const date = new Date(value);
    const now = new Date();

    const dayDifference = differenceInDays(now, date);
    const hourDifference = differenceInHours(now, date);
    const minuteDifference = differenceInMinutes(now, date);

    if (dayDifference === 0) {
      if (minuteDifference === 0) {
        return locale && locale.indexOf('fr') > -1 ? 'Maintenant' : 'Now';
      } else if (minuteDifference === 1) {
        return locale && locale.indexOf('fr') > -1 ? 'Il y a une minute' : 'A minute ago';
      } else if (hourDifference === 0) {
        return locale && locale.indexOf('fr') > -1 ? 'Il y a ' + minuteDifference + ' minutes' : minuteDifference + ' minutes ago';
      } else if (hourDifference === 1) {
        return locale && locale.indexOf('fr') > -1 ? 'Il y a une heure' : 'An hour ago';
      } else {
        return locale && locale.indexOf('fr') > -1 ? 'Il y a ' + hourDifference + ' heures' : hourDifference + ' hours ago';
      }
    } else if (dayDifference === 1) {
      return locale && locale.indexOf('fr') > -1 ? 'Hier' : 'Yesterday';
    } else if (dayDifference < DAYS_WEEK) {
      return locale && locale.indexOf('fr') > -1 ? 'Il y a ' + dayDifference + ' jours' : dayDifference + ' days ago';
    } else {
      const weeks = Math.ceil(dayDifference / DAYS_WEEK);
      if (weeks === 1) {
        return locale && locale.indexOf('fr') > -1 ? 'Il y a une semaine' : 'A week ago';
      }
      return locale && locale.indexOf('fr') > -1 ? 'Il y a ' + weeks + ' semaines' : weeks + ' weeks ago';
    }
  }

  transform(value: any, format?: string, timezone?: string, locale?: string): any { // eslint-disable-line
    const dateValue: number = Date.parse(value);
    const daysPast: number = Math.floor(((Date.now() - dateValue) / MILLIS_SECOND) / (SECONDS_MINUTE * MINUTES_HOUR * HOURS_DAY));

    const providedDate = new Date(dateValue);
    const tomorrow: Date = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let retVal: string;
    if (daysPast < DAYS_MONTH && daysPast >= 0) {
      retVal = FriendlyDatePipe.convertToFriendlyPastDate(value, locale);
    } else if (providedDate.getUTCDate() === tomorrow.getUTCDate() &&
      providedDate.getUTCMonth() === tomorrow.getUTCMonth() &&
      providedDate.getFullYear() === tomorrow.getFullYear()) {
      retVal = FriendlyDatePipe.convertToFriendlyFutureDate(locale);
    } else if (providedDate.getUTCDate() === new Date().getUTCDate() &&
      providedDate.getUTCMonth() === new Date().getUTCMonth() &&
      providedDate.getFullYear() === new Date().getFullYear()) {
      return locale && locale.indexOf('fr') > -1 ? 'Aujourd\'hui' : 'Today';
    } else {
      retVal = super.transform(value, format, timezone, locale);
    }

    return retVal;
  }
}
