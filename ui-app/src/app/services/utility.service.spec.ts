import { TestBed, waitForAsync } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from './utility.service';
import { CONSTANTS } from 'app/constants';
import { fakeHttpOptions } from 'app/test-stubs/api-entities-stubs';
import { SupportedLanguage } from 'app/models/languages';

import {
  objectWithExtraWhitespace,
  objectWithNoWhitespace,
  objectWithNullValue
} from 'app/test-stubs/factories/object';

describe('UtilityService', () => {
  let cookieService: CookieService;
  let meta: Meta;
  let utilityService: UtilityService;

  const baseUrl = 'http://test.com/users/sign_out?redirect=http%3A%2F%2Fzetatango.local%3A3001%2F%2Flogout&locale';
  const supportedUrls = Object.values(SupportedLanguage).map((lang: string) => `${baseUrl}=${lang}` );
  const unsupportedUrls = [`${baseUrl}=aa`];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        CookieService,
        Meta,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    cookieService = TestBed.inject(CookieService);
    meta = TestBed.inject(Meta);
    utilityService = TestBed.inject(UtilityService);
  });

  it('should be created', () => {
    expect(utilityService).toBeTruthy();
  });

  describe('getHttpOptionsForBody()', () => {
    it('should set proper headers on init', () => {
      const httpOptions = utilityService.getHttpOptionsForBody();
      const httpHeaders = httpOptions.headers;

      expect(httpHeaders).toBeTruthy();
      expect(httpHeaders.get('Accept')).toEqual(fakeHttpOptions.headers.get('Accept'));
      expect(httpHeaders.get('Content-Type')).toEqual('application/json');
      expect(httpHeaders.has(CONSTANTS.CSRF_KEY)).toBeFalsy();
      expect(httpOptions.observe).toBe('body');
    });
  });

  describe('getHttpOptions()', () => {
    it('should set proper headers on init', () => {
      const httpOptions = utilityService.getHttpOptions();
      const httpHeaders = httpOptions.headers;

      expect(httpHeaders).toBeTruthy();
      expect(httpHeaders.get('Accept')).toEqual(fakeHttpOptions.headers.get('Accept'));
      expect(httpHeaders.get('Content-Type')).toEqual('application/json');
      expect(httpHeaders.has(CONSTANTS.CSRF_KEY)).toBeFalsy();
      expect(httpOptions.observe).toBeUndefined('body');
    });

    it('should set CSRF header if cookie present', () => {
      spyOn(cookieService, 'get').and.returnValue('csrfcookietest');
      const httpOptions = utilityService.getHttpOptions();
      const httpHeaders = httpOptions.headers;

      expect(httpHeaders.get(CONSTANTS.CSRF_KEY)).toEqual('csrfcookietest');
    });

    it('should set CSRF header if present by falling back to meta tag value', () => {
      const alteredSampleCsrfToken = fakeHttpOptions.headers.get('X-CSRF-Token') + 'a';
      meta.updateTag({ name: 'csrf-token', content: alteredSampleCsrfToken });

      const inst_utilityService = new UtilityService(cookieService, meta);
      const httpOptions = inst_utilityService.getHttpOptions();
      const httpHeaders = httpOptions.headers;

      expect(httpHeaders.get('X-CSRF-Token')).toEqual(alteredSampleCsrfToken);
    });
  });

  describe('trimParameters()', () => {
    it('should not change null values from given map input', () => {
      const input = objectWithNullValue();
      const result = UtilityService.trimParameters(input);

      expect(result).toEqual(input);
    });

    it('should trim whitespaces from given map input', () => {
      const input = objectWithExtraWhitespace();
      const output = objectWithNoWhitespace();
      const result = UtilityService.trimParameters(input);

      expect(result).toEqual(output);
    });
  });

  describe('getAugmentedUrl()', () => {
    const base_url = '/api/url/test';

    it('should return augmented url when string params are provided', () => {
      const result = utilityService.getAugmentedUrl(base_url, { param1: '1', param2: '2', param3: '3' });

      expect(result).toEqual(base_url + '?param1=1&param2=2&param3=3');
    });

    it('should return augmented url when number params are provided', () => {
      const result = utilityService.getAugmentedUrl(base_url, { param1: 1, param2: 2, param3: 3 });

      expect(result).toEqual(base_url + '?param1=1&param2=2&param3=3');
    });

    it('should return url when no query params provided', () => {
      const result = utilityService.getAugmentedUrl(base_url);

      expect(result).toEqual(base_url);
    });

    it('should return url without null, undefined, or empty params', () => {
      const result = utilityService.getAugmentedUrl(base_url, { param1: undefined, param2: null, param3: '', param4: 0 });

      expect(result).toEqual(base_url + '?param4=0');
    });
  });

  describe('localizeUrl', () => {
    it('Should set the locale to en if language parameter is en', () => {
      const expectedUrl = 'http://test.com/users/sign_out?redirect=http%3A%2F%2Fzetatango.local%3A3001%2F%2Flogout&locale=en';
      supportedUrls.forEach(url => expect(utilityService.localizeUrl(url, SupportedLanguage.en)).toEqual(expectedUrl));
    });

    it('Should set the locale to fr if language parameter is fr', () => {
      const expectedUrl = 'http://test.com/users/sign_out?redirect=http%3A%2F%2Fzetatango.local%3A3001%2F%2Flogout&locale=fr';
      supportedUrls.forEach(url => expect(utilityService.localizeUrl(url, SupportedLanguage.fr)).toEqual(expectedUrl));
    });

    it('Should set the locale to English if current language is unknown', () => {
      const expectedUrl = 'http://test.com/users/sign_out?redirect=http%3A%2F%2Fzetatango.local%3A3001%2F%2Flogout&locale=en';
      unsupportedUrls.forEach(url => expect(utilityService.localizeUrl(url, null)).toEqual(expectedUrl));
    });

    it('Should return the current url if locale cannot be found', () => {
      unsupportedUrls.forEach(() => expect(utilityService.localizeUrl(null, SupportedLanguage.en)).toBeNull());
    });
  });
});
