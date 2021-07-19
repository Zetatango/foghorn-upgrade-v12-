import { GOOGLE_TAG_MANAGER } from 'app/constants/google-tag-manager.constants';
import { GoogleTagManagerEvent, GoogleTagManagerInitEvent } from './google-tag-manager';

describe('GoogleTagManagerEvent', () => {
  describe('constructor()', () => {
    it('should set all values to undefined that are not passed in', () => {
      const event = new GoogleTagManagerEvent(null);

      expect(event.buttonClicked).toBeUndefined();
      expect(event.currentPage).toBeUndefined();
      expect(event.event).toEqual(GOOGLE_TAG_MANAGER.ARIO);
      expect(event.eventAction).toBeUndefined();
      expect(event.eventCategory).toBeUndefined();
      expect(event.eventLabel).toBeUndefined();
      expect(event.tabClicked).toBeUndefined();
    });

    it('should set all values that are passed in', () => {
      const event = new GoogleTagManagerEvent({
        buttonClicked: '1',
        currentPage: '2',
        eventAction: '3',
        eventCategory: '4',
        eventLabel: '5',
        industry: '6',
        tabClicked: '7'
      });

      expect(event.buttonClicked).toEqual('1');
      expect(event.currentPage).toEqual('2');
      expect(event.event).toEqual(GOOGLE_TAG_MANAGER.ARIO);
      expect(event.eventAction).toEqual('3');
      expect(event.eventCategory).toEqual('4');
      expect(event.eventLabel).toEqual('5');
      expect(event.industry).toEqual('6');
      expect(event.tabClicked).toEqual('7');
    });
  });
});

describe('GoogleTagManagerInitEvent', () => {
  describe('constructor()', () => {
    it('should set all values that are passed in', () => {
      const event = new GoogleTagManagerInitEvent({
        email: '1',
        userId: '2'
      });

      expect(event.email).toEqual('1');
      expect(event.userId).toEqual('2');
    });
  });
});
