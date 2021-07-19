import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { CONSTANTS } from 'app/constants';
import { CookieService } from 'ngx-cookie-service';
import { SupportedLanguage } from 'app/models/languages';

@Injectable()
export class UtilityService {
  constructor(private cookieService: CookieService,
              private meta: Meta) {}

  /**
   * Trims whitespace from each value in the passed object.
   *
   */
  static trimParameters(obj: Record<string, any>): Record<string, any> { // eslint-disable-line
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && typeof value.trim === 'function') {
        obj[key] = value.trim();
      }
    }

    return obj;
  }

  /**
   * Returns default http options.
   */
  private generateHeaders(): HttpHeaders {
    // Note: Watch out, HttpHeaders is immutable. Need to reassign at each set()
    let httpHeaders = new HttpHeaders;

    httpHeaders = httpHeaders.set('Accept', 'application/json');
    httpHeaders = httpHeaders.set('Content-Type', 'application/json');

    const csrfTokenValue = this.getCsrfTokenValue();
    if (csrfTokenValue) {
      httpHeaders = httpHeaders.set(CONSTANTS.CSRF_KEY, csrfTokenValue);
    }

    return httpHeaders;
  }

  /**
   * Returns default http options.
   */
  // Note: [Graham] this may cause issues:
  // https://angular.io/guide/http
  getHttpOptions(): any { // eslint-disable-line
    return {
      headers: this.generateHeaders()
    };
  }

  /**
   * Returns default http options for responses that return the body instead of response.
   */
  getHttpOptionsForBody(): { headers: HttpHeaders; observe: 'body' } {
    return {
      headers: this.generateHeaders(),
      observe: 'body'
    };
  }

  getHttpOptionsForBlob(): { headers: HttpHeaders; responseType: 'blob', observe: 'body' } {
    return {
      headers: this.generateHeaders(),
      responseType: 'blob',
      observe: 'body'
    };
  }

  /**
   * Returns url augmented with passed query params.
   *
   */
  getAugmentedUrl(url: string, queryParams: any = {}): string { // eslint-disable-line
    const queryVals = Object.keys(queryParams)
      .filter((k) => {
        const value = queryParams[k];
        return value !== undefined && value !== null && value.toString() !== '';
      })
      .map((k) => k.concat('=', queryParams[k]));
    return queryVals.length === 0 ? url : url + '?' + queryVals.join('&');
  }

  private getCsrfTokenValue(): string {
    let csrfTokenValue: string = this.cookieService.get(CONSTANTS.CSRF_COOKIE_KEY);

    // If no CSRF is found in a secure cookie, fallback to reading the value from the meta tag (if present)
    if (!csrfTokenValue) {
      const csrfKeyPresent: HTMLMetaElement = this.meta.getTag(CONSTANTS.CSRF_META_KEY);

      if (csrfKeyPresent) {
        csrfTokenValue = this.meta.getTag(CONSTANTS.CSRF_META_KEY).content;
      }
    }

    return csrfTokenValue;
  }

  localizeUrl(url: string, currentLang: string): string {
    const language = SupportedLanguage[currentLang] || SupportedLanguage.default;
    if (url && url.indexOf('locale=en') > 0) {
      url = url.replace('locale=en', 'locale=' + language);
    } else if (url && url.indexOf('locale=fr') > 0) {
      url = url.replace('locale=fr', 'locale=' + language);
    } else if (url) {
      url = url.replace(/locale=[a-zA-Z]{2}/, 'locale=en');
    }
    return url;
  }
}
