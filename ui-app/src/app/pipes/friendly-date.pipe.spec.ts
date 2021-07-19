import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FriendlyDatePipe } from './friendly-date.pipe';

registerLocaleData(localeFr);

describe('FriendlyDatePipe', () => {
  let pipe: FriendlyDatePipe;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  beforeEach(() => {
    pipe = new FriendlyDatePipe('en');
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('English', () => {
    it('should return the date in the requested format if older than 30 days', () => {
      expect(pipe.transform('2019-01-01T12:00:00.000Z', 'longDate', 'UTC', 'en')).toEqual('January 1, 2019');
    });

    it('should return the date in the requested format if more than 1 day in the future', () => {
      const date = new Date();
      date.setDate(date.getUTCDate() + 2);

      const dateString = months[date.getUTCMonth()] + ' ' + date.getUTCDate() + ', ' + date.getFullYear();
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual(dateString);
    });

    it('should return Now if within 60 seconds', () => {
      expect(pipe.transform(new Date().toISOString(), 'longDate', 'UTC', 'en')).toEqual('Now');
    });

    it('should return A minute ago if between one and two minutes', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('A minute ago');
    });

    it('should return x minutes ago if at least two minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 2);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('2 minutes ago');
    });

    it('should return x minutes ago if less than an hour ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 59);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('59 minutes ago');
    });

    it('should return an hour ago if between one and two hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('An hour ago');
    });

    it('should return x hours ago if at least two hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 2);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('2 hours ago');
    });

    it('should return x hours ago if less than a day ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 23);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('23 hours ago');
    });

    it('should return yesterday if a day ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('Yesterday');
    });

    it('should return x days ago if between a day and a week', () => {
      const date = new Date();
      date.setDate(date.getDate() - 6);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('6 days ago');
    });

    it('should return a week ago if a week ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('A week ago');
    });

    it('should return x weeks ago if more than a week ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 14);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('2 weeks ago');
    });

    it('should return tomorrow if date is the next day', () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('Tomorrow');
    });

    it('should return today if date is a future time on the same day', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'en')).toEqual('Today');
    });
  });

  describe('French', () => {
    it('should return the date in the requested format if older than 30 days', () => {
      expect(pipe.transform('2019-01-01T12:00:00.000Z', 'longDate', 'UTC', 'fr')).toEqual('1 janvier 2019');
    });

    it('should return the date in the requested format if more than 1 day in the future', () => {
      const date = new Date();
      date.setDate(date.getUTCDate() + 2);

      const dateString = date.getUTCDate() + ' ' + monthsFr[date.getUTCMonth()] + ' ' + date.getFullYear();
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual(dateString);
    });

    it('should return Now if within 60 seconds', () => {
      expect(pipe.transform(new Date().toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Maintenant');
    });

    it('should return A minute ago if between one and two minutes', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a une minute');
    });

    it('should return x minutes ago if at least two minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 2);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a 2 minutes');
    });

    it('should return x minutes ago if less than an hour ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 59);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a 59 minutes');
    });

    it('should return an hour ago if between one and two hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a une heure');
    });

    it('should return x hours ago if at least two hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 2);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a 2 heures');
    });

    it('should return x hours ago if less than a day ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 23);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a 23 heures');
    });

    it('should return yesterday if a day ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Hier');
    });

    it('should return x days ago if between a day and a week', () => {
      const date = new Date();
      date.setDate(date.getDate() - 6);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a 6 jours');
    });

    it('should return a week ago if a week ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a une semaine');
    });

    it('should return x weeks ago if more than a week ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 14);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Il y a 2 semaines');
    });

    it('should return tomorrow if date is the next day', () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Demain');
    });

    it('should return today if date is a future time on the same day', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 1);
      expect(pipe.transform(date.toISOString(), 'longDate', 'UTC', 'fr')).toEqual('Aujourd\'hui');
    });
  });
});
